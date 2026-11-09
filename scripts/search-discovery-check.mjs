import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from '@playwright/test';
import {emptyHermitage} from './hermitage-2025-model.mjs';
import {emptyConfrontation} from './sister-confrontation-model.mjs';
const base=process.env.TEST_BASE_URL || 'http://127.0.0.1:5173/';
const key='leaving-school-day:state:v1';
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE || (process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined)});
const initial={version:1,authenticated:true,oaHomeEntered:true,collectedEndings:[],bookstoreMember:{accountId:'luoyao-bookstore'},sisterConfrontation3:{...emptyConfrontation(),startedAt:1,completedAt:2,manuscriptViewedAt:2,nodeId:'S3_COMPLETE'},hermitage2025:{...emptyHermitage(),openingConfirmedAt:1,startedAt:1,completedAt:2,choice:'H25_OPTION_B',stage:'commission'}};
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const goto=async route=>{await page.goto(base+route);};
 const search=async q=>{await goto('#/search?q='+encodeURIComponent(q));await page.locator('.wc-web-search-form').waitFor();};
 const read=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key))?.openedResearchIds??[],key);
 mkdirSync('test-results',{recursive:true});
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});await search('');
  await page.getByRole('heading',{name:'如何发现未知世界？'}).waitFor();
  assert.equal(await page.locator('.web-search-guide li').count(),4);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const form=await page.locator('.wc-web-search-form').boundingBox(),guide=await page.locator('.web-search-guide').boundingBox();assert(guide.y>=form.y+form.height);
  await page.screenshot({path:`test-results/search-guide-${width}.png`,fullPage:true});
 }
 for(const [q,id] of [['寄岁','forum-jisui'],['寄岁补年','forum-jisui'],['借命','article-borrow-life'],['借命续途','article-borrow-life'],['逆天而行','article-borrow-life'],['三五年','forum-jisui'],['旧书','bookstore-site'],['罗尧','article-donglan-admission-2017']]){
  await search(q);await page.locator(`[data-result-id="${id}"]`).waitFor();
 }
 for(const [q,id] of [['常司烛','changsizhu'],['天东有若木','changsizhu'],['哲学系 常司烛','changsizhu'],['霍思斯','huosisi'],['青山-','litianming']]){await search(q);await page.locator(`[data-contact-id="${id}"]`).waitFor();}
 for(const q of ['罗','续算杂录','Y20201218C','未结之契']){await search(q);assert.equal(await page.locator('[data-result-id="article-donglan-admission-2017"], [data-result-id="book-history"], [data-result-id="book-bibliography"]').count(),0);}
 assert.deepEqual(await read(),[]);
 await goto('#/bookstore/private-commission');assert.equal(await page.locator('.private-reading-hint').count(),0);assert.equal(await page.locator('.private-verification').count(),0);
 await page.evaluate(({key,initial})=>localStorage.setItem(key,JSON.stringify(initial)),{key,initial});await page.reload();await page.locator('.private-verification').waitFor();
 const hint=page.locator('.private-reading-hint');assert.equal(await hint.count(),1);assert.equal(await hint.innerText(),'你似乎还有一些资料没有查看。搜一搜某些陌生的高亮关键词，或许能帮助你理解相关民俗说法。');assert.deepEqual(await hint.locator('strong').allTextContents(),['搜一搜','高亮关键词']);
 assert.equal(await page.getByText('此仪所改命籍，凡几人？',{exact:true}).count(),1);assert.equal(await page.getByText('契上虽载其名，仍未属归籍。',{exact:true}).count(),1);assert.equal(await page.getByText('寄岁所补的年寿，至借命开始共多少年岁？',{exact:true}).count(),0);
 for(const [i,value] of ['3','4','14','0'].entries())await page.locator('.private-verification input').nth(i).fill(value);
 assert.equal(await hint.count(),1);assert(await page.locator('.private-verification button').isEnabled());
 await page.screenshot({path:'test-results/verification-reading-hint-mobile.png',fullPage:true});
 await goto('#/wechat/article/borrow-life');await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).openedResearchIds?.includes('borrow-life'),key);
 await page.reload();assert.deepEqual(await read(),['borrow-life']);
 await goto('#/bookstore/private-commission');await hint.waitFor();
 await goto('#/forum/threads/jisui-2016');await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).openedResearchIds?.length===2,key);
 await goto('#/bookstore/private-commission');await page.locator('.private-verification').waitFor();assert.equal(await hint.count(),0);
 await page.locator('.private-verification button').click();await page.locator('.private-success:visible').waitFor();
 // The other single-unread case, with persisted reading status.
 await page.evaluate(({key,initial})=>localStorage.setItem(key,JSON.stringify({...initial,openedResearchIds:['jisui-2016']})),{key,initial});await page.reload();await hint.waitFor();
 assert.deepEqual(errors,[]);console.log('PASS search guide desktop/mobile, aliases/body/contact search, protected routes, actual reads, old saves, once-per-entry hint and unchanged answers');
}finally{await browser.close();}
