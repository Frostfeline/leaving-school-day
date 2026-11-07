// Test the built site with a strict static server: no Vite, SPA fallback or APIs.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync, readdirSync, statSync, mkdirSync, writeFileSync} from 'node:fs';
import {extname, posix} from 'node:path';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {chromium} from '@playwright/test';

const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(d+'/'+e.name):[d+'/'+e.name]);
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const files=walk('dist'), paths=new Set(files.map(p=>p.slice(5)));
const source=walk('public');
const codeFiles=[...walk('src'),...walk('scripts'),'vite.config.ts'];
const codePaths=new Set(codeFiles);
for(const p of codeFiles.filter(p=>/\.(?:ts|mjs)$/.test(p))){
  for(const m of readFileSync(p,'utf8').matchAll(/(?:from\s*|import\s*\(?\s*)['"](\.[^'"]+)['"]/g)){
    const resolved=posix.normalize(posix.join(posix.dirname(p),m[1].split('?')[0]));
    assert([resolved,resolved+'.ts',resolved+'.mjs',resolved+'.json',resolved+'/index.ts'].some(v=>codePaths.has(v)),'Case-mismatched import '+p+' -> '+m[1]);
  }
}
assert(paths.has('index.html'));
for(const p of source)assert.equal(hash(p),hash('dist/'+p.slice(7)),p+' copied unchanged');
assert(!files.some(p=>/\.(map|ts|tsx|py|ps1)$/.test(p)||/(?:^|\/)(?:output|outputs|src|scripts|node_modules|test-results|\.tools)\//.test(p)));
const app=files.filter(p=>/\/index-[^/]+\.(js|css)$/.test(p)).map(p=>readFileSync(p,'utf8')).join('\n');
assert(!/localhost|127\.0\.0\.1|__archive-dev|\/@vite|[A-Z]:\\\\Users\\\\/.test(app),'no local API or path in production app');
const refs=new Set();
for(const p of [...walk('src'),...walk('public').filter(p=>/\.(svg|css)$/.test(p))]) {
  if(!/\.(ts|json|css|svg)$/.test(p)||p.startsWith('src/dev/'))continue;
  for(const m of readFileSync(p,'utf8').matchAll(/(?:["'`(])(?:\.\/)?(assets\/[^"'`\s)<>]+\.(?:png|jpe?g|webp|svg|gif|pdf|woff2?|ttf|mjs|mp3|ogg|wav))["'`)]/g))refs.add(m[1]);
}
for(const ref of refs)assert(paths.has(ref),'Missing or case-mismatched asset: '+ref);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.pdf':'application/pdf','.woff2':'font/woff2'};
const prefix='/release-rehearsal/';
const server=createServer((req,res)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);}catch{res.writeHead(400).end();return;}
  const path=pathname.startsWith(prefix)?pathname.slice(prefix.length)||'index.html':'';
  if(!paths.has(path)){res.writeHead(404).end('Not found');return;}
  res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(readFileSync('dist/'+path));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const port=server.address().port, base=`http://127.0.0.1:${port}${prefix}`;
const launch={headless:true,executablePath:process.env.BROWSER_EXECUTABLE || (process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined)};
const key='leaving-school-day:state:v1', errors=[],requests=new Set();
const read=p=>JSON.parse(readFileSync('src/content/'+p+'.json','utf8'));
const monitor=context=>context.on('page',p=>{
  p.on('pageerror',e=>errors.push(e.message));
  p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  p.on('request',r=>{if(/^https?:/.test(r.url())){requests.add(r.url());if(!r.url().startsWith(base))errors.push('Out of subpath: '+r.url());}});
});
let browser;
try {
  for(const p of paths){const response=await fetch(base+p);assert.equal(response.status,200,p);assert.equal((await response.arrayBuffer()).byteLength,statSync('dist/'+p).size,p);}
  assert.equal((await fetch(base+'__archive-dev/content')).status,404);
  browser=await chromium.launch(launch);
  const context=await browser.newContext({viewport:{width:1440,height:900}});monitor(context);
  const page=await context.newPage();await page.goto(base);
  await page.locator('[data-action=start-game]').click();await page.locator('.wc-window').waitFor();
  for(const id of ['flea-market','university-service','class-group']){await page.locator(`[data-chat-id=${id}]`).click();assert.equal(await page.locator('.wc-window').getAttribute('data-conversation-id'),id);}
  await page.getByText('东澜大学2025届离校人员信息登记表.pdf',{exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.textLayer')?.textContent?.includes('林琛'));
  assert(await page.locator('.game-pdf canvas').count()>0);
  await page.locator('.game-pdf select').selectOption('1.25');
  await page.waitForFunction(()=>!document.querySelector('.game-pdf select')?.disabled);
  await page.keyboard.press('Escape');
  console.log('PASS PDF module, worker, Chinese text layer, render, zoom and close');
  const popupPromise=page.waitForEvent('popup');
  await page.getByText('登录学校统一身份认证OA平台',{exact:true}).click();
  const oa=await popupPromise;await oa.locator('#oa-student').waitFor();assert(oa.url().startsWith(base));
  await oa.locator('#oa-student').fill('202210300522');await oa.locator('.oa-request').click();
  const code=await oa.evaluate(key=>JSON.parse(localStorage.getItem(key)).auth.code,key);
  await page.locator('[data-chat-id=university-service]').click();await page.getByText(code,{exact:false}).first().waitFor();
  await oa.locator('#oa-code').fill(code);await oa.locator('.oa-submit').click();await oa.waitForURL('**/#/oa/home');
  console.log('PASS real OA login and cross-tab WeChat verification code');
  const forum=read('forum/forum-thread');
  const routes=['#/oa/home',...read('oa-notices').items.map(n=>'#/oa/notices/'+n.id),'#/oa/library/record','#/oa/payment','#/search?q='+encodeURIComponent('借命'),'#/search?q='+encodeURIComponent('罗尧'),'#/wechat/article/borrow-life','#/wechat/article/donglan-admission-2017','#/forum/threads/'+(forum.id||forum.threadId),'#/fortune-match','#/bookstore'];
  const routeSource=readFileSync('src/utils/routes.ts','utf8');
  const fiction=routeSource.match(/'fiction-changdu':\s*'([^']+)'/);assert(fiction);routes.push(fiction[1]);
  for(const route of routes){await oa.goto(base+route);await oa.locator('main').first().waitFor();assert.equal(new URL(oa.url()).hash,route);await oa.reload();assert.equal(new URL(oa.url()).hash,route);assert((await oa.locator('#app').innerText()).trim().length>20);}
  await oa.goto(base+'#/bookstore');await oa.locator('.bs-brand').waitFor();
  const fontInfo=await oa.evaluate(async()=>{await document.fonts.load('34px LaozhuangBrush','老庄旧书网');return [...document.fonts].map(f=>({family:f.family,status:f.status}));});
  assert(fontInfo.some(f=>f.family.replaceAll('"','')==='LaozhuangBrush'&&f.status==='loaded'),JSON.stringify(fontInfo));
  // Use a fresh page so history from earlier route reloads does not participate.
  const historyPage=await context.newPage();await historyPage.goto(base+'#/bookstore');await historyPage.locator('.bs-page').waitFor();
  await historyPage.evaluate(()=>{location.hash='/fortune-match';});await historyPage.waitForURL('**/#/fortune-match');await historyPage.locator('main').waitFor();
  await historyPage.goBack();assert.equal(new URL(historyPage.url()).hash,'#/bookstore');await historyPage.goForward();assert.equal(new URL(historyPage.url()).hash,'#/fortune-match');await historyPage.close();
  await oa.goto(base+'#/dev/private-commission-editor');await oa.waitForURL('**/#/');assert.equal(await oa.locator('.he-editor').count(),0);
  console.log('PASS '+routes.length+' routes, refresh, history back/forward, no production editor');
  await context.close();
  const touch=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});monitor(touch);
  const mobile=await touch.newPage();
  await mobile.goto(base+'#/memory-archive?chat=litianming&source=litianming-2022-08-03-01');
  const pair=read('memoryArchive/puzzle').pairs[0],archiveUI=read('memoryArchive/ui');
  await mobile.locator(`[data-archive-group="${pair.chatGroupId}"]`).tap();
  await mobile.locator('[data-timeline-slot="0"]').tap();
  await mobile.getByRole('tab',{name:archiveUI.tabs.attachments,exact:true}).tap();
  await mobile.locator(`.ma-file[data-attachment-id="${pair.attachmentId}"]`).tap();
  await mobile.locator('.ma-image-dialog').getByRole('button',{name:archiveUI.select,exact:true}).tap();
  await mobile.locator('[data-attachment-slot="0"]').tap();
  assert.equal(await mobile.locator('[data-attachment-slot="0"]').getAttribute('aria-label'),'复查报告');
  await touch.close();console.log('PASS emulated touch selection and placement without native drag');
  await browser.close();browser=null;
  mkdirSync('test-results',{recursive:true});
  const profile='test-results/pages-profile-'+Date.now();
  let persistent=await chromium.launchPersistentContext(profile,launch);monitor(persistent);
  let savedPage=await persistent.newPage();await savedPage.goto(base+'#/oa/login');
  await savedPage.locator('#oa-student').fill('202210300522');await savedPage.reload();assert.equal(await savedPage.locator('#oa-student').inputValue(),'202210300522');
  await persistent.close();
  persistent=await chromium.launchPersistentContext(profile,launch);monitor(persistent);
  savedPage=await persistent.newPage();await savedPage.goto(base+'#/oa/login');assert.equal(await savedPage.locator('#oa-student').inputValue(),'202210300522');await persistent.close();
  console.log('PASS local progress after reload and actual browser close/reopen');
  for(const script of ['memory-archive-check','sister-confrontation-browser-check','final-story-browser-check']){
    await new Promise((resolve,reject)=>{
      const child=spawn(process.execPath,['scripts/'+script+'.mjs'],{stdio:'inherit',env:{...process.env,TEST_PORT:String(port),TEST_BASE_URL:base,TEST_PRODUCTION:'1'}});
      const timer=setTimeout(()=>{child.kill();reject(Error(script+' timed out'));},240000);
      child.on('error',e=>{clearTimeout(timer);reject(e);});
      child.on('exit',code=>{clearTimeout(timer);code===0?resolve():reject(Error(script+' exit '+code));});
    });
  }
  assert.deepEqual(errors,[]);
  const totals={};for(const p of files){const ext=extname(p);totals[ext]??={count:0,bytes:0};totals[ext].count++;totals[ext].bytes+=statSync(p).size;}
  const duplicates=new Map();for(const p of files){const h=hash(p);duplicates.set(h,[...(duplicates.get(h)||[]),p]);}
  const summary={files:files.length,bytes:files.reduce((n,p)=>n+statSync(p).size,0),sourceAssets:source.length,checkedAssetReferences:refs.size,totals,duplicates:[...duplicates.values()].filter(a=>a.length>1),largest:files.map(p=>({path:p,bytes:statSync(p).size})).sort((a,b)=>b.bytes-a.bytes).slice(0,10),requests:[...requests],unreferencedAssets:source.map(p=>p.slice(7)).filter(p=>!refs.has(p)),errors};
  writeFileSync('test-results/pages-report.json',JSON.stringify(summary,null,2));
  console.log('PASS production subpath suite; '+files.length+' files, '+summary.bytes+' bytes; test-results/pages-report.json');
} finally {if(browser)await browser.close();await new Promise(r=>server.close(r));}
