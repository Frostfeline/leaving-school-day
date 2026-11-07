import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const originalNotices=readFileSync('src/content/oa-notices.json','utf8');
const originalRecord=readFileSync('src/content/oa-library-record.json','utf8');
const build=()=>execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build','--configLoader','native'],{stdio:'inherit'});
const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900}});const errors=[];
context.on('page',p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('response',r=>{if(r.status()>=400)errors.push(r.url())});p.on('dialog',d=>errors.push('unexpected dialog: '+d.type()))});
const page=await context.newPage();const read=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('leaving-school-day:state:v1')||'null'));
mkdirSync('test-results',{recursive:true});let mutated=false;
try{
 for(const path of ['#/oa/home','#/oa/notices/library-exception']){await page.goto('http://127.0.0.1:4173/'+path);await page.waitForURL('**/#/oa/login');assert.equal(await page.getByText('罗尧',{exact:true}).count(),0);}
 await page.goto('http://127.0.0.1:4173/#/game/wechat/linyuan');
 await page.getByRole('searchbox').fill('罗尧');assert.equal(await page.locator('[data-chat-id="luoyao"]').count(),1);await page.getByRole('searchbox').fill('');assert.equal(await page.locator('.wc-chat-item').count(),4);
 await page.locator('[data-chat-id="class-group"]').click();const sourceURL=page.url();
 const popup=context.waitForEvent('page');await page.getByRole('link',{name:'东澜大学统一身份认证平台',exact:true}).click();const oa=await popup;await oa.waitForLoadState();
 await oa.locator('#oa-student').fill('201920300522');await oa.getByRole('button',{name:'发送验证码',exact:true}).click();await page.locator('.wc-unread').waitFor();
 await oa.locator('#oa-code').fill('210709');const start=Date.now();await oa.getByRole('button',{name:'登录',exact:true}).click();
 await oa.getByRole('heading',{name:'登录成功，正在进入东澜大学OA系统……'}).waitFor();
 assert.equal(await oa.locator('.oa-campus').count(),1);assert.equal(await oa.locator('.oa-panel').count(),1);assert.equal(await oa.getByText('系统正在加载，请稍候……',{exact:true}).count(),1);
 await oa.screenshot({path:'test-results/oa-buffer-v12-1440.png',fullPage:false});
 await oa.reload();await oa.waitForURL('**/#/oa/home',{timeout:7000});const elapsed=Date.now()-start;assert(elapsed>=3700&&elapsed<6500,`buffer duration ${elapsed}`);
 assert.equal(await oa.locator('.oa-notice-row').count(),3);assert.equal(await oa.locator('.oa-important').count(),1);assert.equal(await oa.locator('.oa-welcome p').innerText(),'2025年6月25日');
 const text=await oa.locator('body').innerText();assert(!text.includes('罗尧'));assert(!text.includes('1,200'));assert(!text.includes('开发占位'));assert.equal((await read(oa)).knowLuoYaoName,false);
 await oa.screenshot({path:'test-results/oa-home-v12-1440.png',fullPage:false});
 await oa.reload();assert.equal(new URL(oa.url()).hash,'#/oa/home');assert.equal(await oa.locator('.oa-campus').count(),0);
 await oa.locator('[data-notice-id="library-exception"] a').click();await oa.getByRole('heading',{name:'图书馆借阅异常',exact:true}).waitFor();
 await oa.getByText('贵重馆藏图书逾期未还',{exact:true}).waitFor();assert.equal(await oa.getByText('罗尧',{exact:true}).count(),0);assert.equal((await read(oa)).knowLuoYaoName,false);await oa.locator('.oa-record').getByText('林琛',{exact:true}).waitFor();await oa.getByText('¥1,600.00',{exact:true}).waitFor();
 await oa.screenshot({path:'test-results/oa-library-v12-1440.png',fullPage:false});
 await oa.getByRole('link',{name:'我有疑问',exact:true}).click();await oa.getByRole('heading',{name:'东澜大学图书馆',exact:true}).waitFor();await oa.getByText('罗尧',{exact:true}).waitFor();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('leaving-school-day:state:v1')).knowLuoYaoName===true);
 assert.equal(page.url(),sourceURL);assert.equal(await page.locator('[data-chat-id="luoyao"]').count(),0);assert.equal((await read(page)).addedLuoYao,false);
 await oa.reload();assert.equal(new URL(oa.url()).hash,'#/oa/library/record');await oa.getByRole('link',{name:'首页',exact:true}).click();
 for(const id of ['graduation-arrangements','thesis-archive']){await oa.locator(`[data-notice-id="${id}"] a`).click();await oa.getByText('通知正文待作者填写。',{exact:true}).waitFor();await oa.getByRole('link',{name:'返回首页',exact:true}).click();}
 await page.getByRole('searchbox').fill('罗');assert.equal(await page.locator('[data-chat-id="luoyao"]').count(),1);
 await page.getByRole('searchbox').fill('  罗尧  ');await page.locator('[data-chat-id="luoyao"]').waitFor();assert.equal((await read(page)).addedLuoYao,false);
 await page.locator('[data-chat-id="luoyao"]').click();await page.getByRole('heading',{name:'尧哥',exact:true}).waitFor();assert.equal((await read(page)).addedLuoYao,true);
 await page.getByRole('searchbox').fill('');assert.equal(await page.locator('.wc-chat-item').count(),5);await page.reload();await page.getByRole('heading',{name:'罗尧',exact:true}).waitFor();assert.equal(await page.locator('.wc-chat-item').count(),5);
 await oa.goto('http://127.0.0.1:4173/#/oa/login');await oa.waitForURL('**/#/oa/home');assert.equal(await oa.locator('.oa-campus').count(),0);
 assert(await oa.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 console.log(`PASS V1.2: auth guards, original buffer, ${elapsed}ms delay with refresh, 3 notices, no early clues, detail fields, return, ordinary placeholders, cross-tab reveal, exact-name search and click-to-add, persistence, no rebuffer`);
 const n=JSON.parse(originalNotices);n.items[0].title='公告名称修改验收';const r=JSON.parse(originalRecord);r.paragraphs.push('正文新增段落验收。');mutated=true;
 writeFileSync('src/content/oa-notices.json',JSON.stringify(n,null,2));writeFileSync('src/content/oa-library-record.json',JSON.stringify(r,null,2));build();
 await oa.reload();await oa.getByRole('link',{name:/公告名称修改验收/}).click();await oa.getByText('正文新增段落验收。',{exact:true}).waitFor();await oa.getByText('¥1,600.00',{exact:true}).waitFor();
 await oa.setViewportSize({width:390,height:844});assert(await oa.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);console.log('PASS JSON-only title/body mutation and build, mobile overflow, console/network/dialog');
}finally{writeFileSync('src/content/oa-notices.json',originalNotices);writeFileSync('src/content/oa-library-record.json',originalRecord);await browser.close();if(mutated)build();}
