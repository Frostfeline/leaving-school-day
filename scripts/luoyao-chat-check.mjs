import {chromium} from '@playwright/test';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const path='src/content/wechat/chats/luo-yao.json',raw=readFileSync(path,'utf8'),data=JSON.parse(raw);
const rows=data.messages;assert.equal(rows.length,19);assert.equal(new Set(rows.map(m=>m.id)).size,19);assert(rows.every(m=>m.senderId==='linchen'));assert.equal(rows[0].timestamp,'2022-08-30T22:16:00+08:00');assert.equal(rows.at(-1).timestamp,'2025-06-20T20:37:00+08:00');
assert.deepEqual(Object.values(Object.groupBy(rows,m=>m.timestamp)).map(g=>g.length),[4,3,2,1,2,3,2,2]);assert.equal(rows.filter(m=>m.type==='link').length,0);
const protectedPaths=['sister','class-group','university-service','flea-market','li-tian-ming'].map(n=>`src/content/wechat/chats/${n}.json`).concat(['src/content/bookstore/mail-messages.json','src/content/memoryArchive/chats.json']);const protectedText=protectedPaths.map(p=>readFileSync(p,'utf8'));
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});const errors=[];mkdirSync('test-results',{recursive:true});
try{
 for(const port of (process.env.TEST_PORT?[Number(process.env.TEST_PORT)]:[5173,4173])){
  const c=await browser.newContext({viewport:{width:1440,height:900}});c.on('page',p=>{p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.url())})});const p=await c.newPage();const base=`http://127.0.0.1:${port}/`;await p.goto(base+'#/game/wechat/linyuan');
  const search=p.locator('.wc-search');await search.fill('罗尧');await p.locator('[data-contact-id=luoyao]').click();await p.waitForTimeout(100);
  assert.equal(await p.locator('.wc-heading').innerText(),'尧哥');assert.equal(await p.locator('.wc-message').count(),19);assert.equal(await p.locator('.wc-message:not(.wc-outgoing)').count(),0);
  assert.deepEqual(await p.locator('.wc-message').evaluateAll(n=>n.map(e=>e.dataset.messageId)),rows.map(m=>m.id));
  assert.deepEqual(await p.locator('.wc-message-time').allTextContents(),['2022年8月30日 22:16','2022年12月18日 21:22','2022年12月31日 22:41','2023年5月8日 00:02','2023年12月18日 22:08','2024年5月8日 09:18','2025年5月8日 08:46','2025年6月20日 20:37']);
  for(const message of rows)assert.equal(await p.locator(`[data-message-id="${message.id}"] .wc-bubble`).innerText(),message.text.replaceAll('*',''));
  const bottom=async()=>p.locator('.wc-history').evaluate(n=>n.scrollHeight-n.clientHeight-n.scrollTop<2);assert(await bottom());
  await p.screenshot({path:`test-results/luoyao-latest-${port}-1440.png`});
  await p.locator('.wc-history').evaluate(n=>n.scrollTop=0);await p.screenshot({path:`test-results/luoyao-earliest-${port}-1440.png`});
  assert.equal(await p.locator('.wc-link-card').count(),0);
  await p.reload();await p.locator('.wc-heading').filter({hasText:'尧哥'}).waitFor();await p.waitForTimeout(80);assert(await bottom());await p.locator('.wc-search').fill('尧哥');assert.equal(await p.locator('[data-contact-id=luoyao]').count(),1);await p.locator('[data-contact-id=luoyao]').click();assert(await bottom());
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(100);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.locator('[data-contact-id=luoyao]').evaluate(n=>n.click());await p.waitForTimeout(80);assert(await bottom());await p.screenshot({path:`test-results/luoyao-latest-${port}-390.png`});await c.close();console.log(`PASS ${port}: exact 19 outgoing messages, 8 dates/order, both contact queries, latest on open/refresh, no memory link, mobile`);
 }
 // A JSON-only edit is reflected in the running game without changing branch state.
 const changed=structuredClone(data);changed.messages.at(-1).text='JSON单条修改检查。';writeFileSync(path,JSON.stringify(changed,null,2));
 const c=await browser.newContext();const p=await c.newPage();await p.goto('http://127.0.0.1:'+(process.env.TEST_PORT??5173)+'/#/game/wechat/linyuan');await p.locator('.wc-search').fill('尧哥');await p.locator('[data-contact-id=luoyao]').click();await p.locator('.wc-bubble').getByText('JSON单条修改检查。',{exact:true}).waitFor();await c.close();
 assert.deepEqual(protectedPaths.map(p=>readFileSync(p,'utf8')),protectedText);assert.deepEqual(errors,[]);console.log('PASS JSON-only text update; other chats and 2021 merchant history unchanged; no browser/resource errors');
}finally{writeFileSync(path,raw);await browser.close();}
