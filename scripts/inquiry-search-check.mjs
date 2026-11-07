import {chromium} from '@playwright/test';
import {mkdirSync,readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const book=JSON.parse(readFileSync('src/content/bookstore/books.json','utf8')).items[0];
const library=JSON.parse(readFileSync('src/content/oa-library-record.json','utf8'));
const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const state=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('leaving-school-day:state:v1')));
mkdirSync('test-results',{recursive:true});
try{
 for(const port of [4173,5173]){
  const context=await browser.newContext({viewport:{width:1440,height:900}});const errors=[];
  context.on('page',p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('response',r=>{if(r.status()>=400)errors.push(r.url())});});
  const wc=await context.newPage();const base=`http://127.0.0.1:${port}/`;await wc.goto(base+'#/game/wechat/linyuan');
  const search=wc.getByRole('searchbox',{name:'搜好友',exact:true});
  assert.equal(await wc.locator('.wc-chat-item[data-chat-id="luoyao"]').count(),0);
  for(const query of ['尧','尧哥','罗尧']){await search.fill(query);await wc.locator('.wc-chat-item[data-chat-id="luoyao"]').waitFor();await wc.getByText('微信昵称 罗尧',{exact:true}).waitFor();}
  await search.fill('阿尧');assert.equal(await wc.locator('.wc-chat-item[data-chat-id="luoyao"]').count(),0);
  await search.fill('罗尧');await wc.locator('.wc-chat-item[data-chat-id="luoyao"]').click();await wc.locator('.wc-heading').filter({hasText:'尧哥'}).waitFor();
  assert.equal((await state(wc)).knowLuoYaoName,false);assert.equal((await state(wc)).enteredInvestigation,false);assert.equal((await state(wc)).addedLuoYao,true);assert.equal((await state(wc)).ending,null);
  await wc.getByText('历史聊天内容待作者提供。',{exact:true}).waitFor();
  // The top field searches contacts only; web search has its own green entry.
  await search.fill('五点');assert.equal(await wc.locator('.wc-chat-item').count(),0);assert.equal(await wc.locator('.wc-message-result,.wc-web-entry').count(),0);await search.press('Enter');assert.equal(await wc.locator('.wc-web').isVisible(),false);
  await search.fill('');await wc.locator('.wc-chat-item[data-chat-id="linyuan"]').click();
  const webSearch=async query=>{if(!await wc.locator('.wc-web').isVisible()){if(wc.viewportSize().width<=600)await wc.getByRole('button',{name:'聊天列表',exact:true}).click();await wc.getByRole('button',{name:'搜一搜',exact:true}).click();}const field=wc.getByRole('searchbox',{name:'搜一搜关键词',exact:true});await field.fill(query);await field.press('Enter');};
  await wc.screenshot({path:`test-results/wechat-local-search-${port}.png`});
  for(const query of [book.title,'命籍',book.isbn,'7-80671-186-5','９７８７９９５８８２１６３']){
   await webSearch(query);await wc.locator('.wc-web-result[data-result-id="book-bibliography"]').waitFor();assert.equal(await wc.locator('.wc-web-result').count(),2);
  }
  assert.equal(new URL(wc.url()).hash,'#/game/wechat/linyuan');
  await wc.screenshot({path:`test-results/wechat-web-search-${port}.png`});
  await wc.locator('[data-result-id="book-bibliography"] a').click();await wc.locator('.wc-book-metadata').getByText(book.isbn,{exact:true}).waitFor();
  await wc.getByRole('button',{name:'返回上一页',exact:true}).click();await wc.locator('[data-result-id="book-history"] a').click();await wc.locator('.bs-product-info h1').filter({hasText:book.title}).waitFor();
  assert(!(await wc.locator('.wc-web').innerText()).includes(library.data.collectionCode.value));assert.equal(context.pages().length,1);
  await wc.getByRole('tab',{name:'历史留言',exact:true}).click();await wc.locator('.bs-public-message').first().waitFor();await wc.getByText('宁先生',{exact:true}).first().waitFor();
  await wc.getByRole('button',{name:'返回搜索结果',exact:true}).click();await wc.locator('[data-result-id="book-history"]').waitFor();
  await wc.reload();await wc.locator('[data-result-id="book-history"]').waitFor();assert.equal(await search.inputValue(),'');
  await wc.getByRole('button',{name:'返回微信聊天',exact:true}).click();await wc.locator('.wc-heading').filter({hasText:'姐姐'}).waitFor();
  await search.fill('');await wc.locator('.wc-chat-item[data-chat-id="flea-market"]').click();const scroll=await wc.locator('.wc-history').evaluate(e=>e.scrollTop);
  await wc.getByRole('link',{name:'老庄旧书网',exact:true}).click();await wc.locator('.bs-home-hero h1').waitFor();assert.equal(context.pages().length,1);
  await wc.locator('.bs-search input').fill(book.isbn);await wc.locator('.bs-search button').click();await wc.locator('.bs-result-title').click();await wc.locator('.bs-product-info h1').waitFor();
  await wc.screenshot({path:`test-results/wechat-embedded-book-${port}.png`});
  await wc.getByRole('button',{name:'返回微信聊天',exact:true}).click();assert.equal(await wc.locator('.wc-history').evaluate(e=>e.scrollTop),scroll);
  // OA must still open in its own browser tab; the service code stays in WeChat.
  await wc.locator('.wc-chat-item[data-chat-id="class-group"]').click();const pending=context.waitForEvent('page');await wc.getByRole('link',{name:'东澜大学统一身份认证平台',exact:true}).click();const oa=await pending;await oa.waitForLoadState();
  await oa.locator('#oa-student').fill('201920300522');await oa.getByRole('button',{name:'发送验证码',exact:true}).click();await wc.locator('.wc-chat-item[data-chat-id="university-service"] .wc-unread').waitFor();
  await oa.locator('#oa-code').fill('210709');await oa.getByRole('button',{name:'登录',exact:true}).click();await oa.waitForURL('**/#/oa/home',{timeout:7000});
  await oa.locator('[data-notice-id="library-exception"] a').click();assert(!(await oa.locator('body').innerText()).includes('罗尧'));
  await oa.getByRole('link',{name:'我有疑问',exact:true}).click();await oa.getByRole('heading',{name:'东澜大学图书馆',exact:true}).waitFor();
  for(const text of [book.title,book.isbn,library.data.collectionCode.value,library.data.amount,'罗尧','林琛'])await oa.locator('.la-thread').getByText(text,{exact:true}).waitFor();
  assert.equal((await state(oa)).seenOaDebtInquiry,true);assert.equal((await state(oa)).confirmedResponsibility,false);assert.equal((await state(oa)).libraryPayment,null);
  await oa.screenshot({path:`test-results/oa-library-assistant-initial-${port}.png`,fullPage:false});
  await wc.locator('.wc-chat-item[data-chat-id="linyuan"] .wc-unread').waitFor({timeout:5000});const firstSent=(await state(wc)).sisterReminder2SentAt;
  assert(firstSent);assert.equal((await state(wc)).sisterReminder2Read,false);
  for(const id of ['book_details','borrower_mismatch','request_review','book_details'])await oa.locator(`[data-question-id="${id}"]`).click();assert.equal(await oa.locator('.la-exchange').count(),4);await oa.getByText('当前赔偿状态',{exact:true}).first().waitFor();
  await oa.screenshot({path:`test-results/oa-library-assistant-${port}.png`,fullPage:true});
  const second=await context.newPage();await second.goto(base+'#/oa/library/record');await second.getByRole('heading',{name:'东澜大学图书馆',exact:true}).waitFor();await oa.reload();await oa.getByRole('heading',{name:'东澜大学图书馆',exact:true}).waitFor();await new Promise(r=>setTimeout(r,1800));assert.equal((await state(oa)).sisterReminder2SentAt,firstSent);
  await wc.bringToFront();await wc.locator('.wc-chat-item[data-chat-id="linyuan"]').click();assert.equal(await wc.locator('.wc-history [data-message-id^="sister-reminder-2-"]').count(),1);assert.equal((await state(wc)).sisterReminder2Read,true);assert.equal(await wc.locator('.wc-chat-item[data-chat-id="linyuan"] .wc-unread').count(),0);
  await wc.reload();assert.equal(await wc.locator('.wc-history [data-message-id^="sister-reminder-2-"]').count(),1);
  for(const width of [390,375]){
   await wc.setViewportSize({width,height:844});await webSearch(book.isbn);await wc.locator('[data-result-id="book-history"]').waitFor();assert(await wc.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const result=wc.locator('[data-result-id="book-history"] a');assert(await result.isVisible());await wc.screenshot({path:`test-results/wechat-search-${port}-${width}.png`});await result.click();await wc.locator('.bs-product-info h1').waitFor();assert(await wc.evaluate(()=>document.querySelector('.wc-web-content').scrollWidth<=document.querySelector('.wc-web-content').clientWidth));await wc.getByRole('button',{name:'返回微信聊天',exact:true}).click();
  }
  // Investigation still permits the original payment -> NE path.
  await oa.bringToFront();await oa.getByRole('link',{name:'返回借阅异常',exact:true}).click();await oa.getByRole('link',{name:'立即缴费',exact:true}).click();await oa.getByRole('checkbox').check();await oa.getByRole('button',{name:`确认支付 ${library.data.amount}`,exact:true}).click();await oa.waitForURL('**/#/ending/ne',{timeout:7000});assert.equal((await state(oa)).ending,'ne-graduation');
  assert.deepEqual(errors,[]);await context.close();console.log(`PASS ${port}: ungated contact aliases, contact-only top search, separate green web entry, local web index/ISBN normalization, embedded bookstore/return/reload, OA cross-tab code, repeat questions, once-only reminder/unread/read, mobile, investigation payment NE, no console/network errors`);
 }
}finally{await browser.close();}
