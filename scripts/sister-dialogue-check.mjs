import {chromium} from '@playwright/test';
import {readFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const content=JSON.parse(readFileSync('src/content/wechat/sister-reminder-2.json','utf8'));
const comments=JSON.parse(readFileSync('src/content/bookstore/messages.json','utf8')).items;
const base='http://127.0.0.1:4173/';const KEY='leaving-school-day:state:v1';
const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const errors=[];const state=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
const context=async saved=>{const c=await browser.newContext({viewport:{width:1440,height:900},...(saved?{storageState:saved}:{})});c.on('page',p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});});return c;};
mkdirSync('test-results',{recursive:true});
try{
 const first=await context();const oa=await first.newPage();await oa.goto(base+'#/oa/login');await oa.locator('#oa-student').fill('201920300522');await oa.getByRole('button',{name:'发送验证码',exact:true}).click();await oa.locator('#oa-code').fill('210709');await oa.getByRole('button',{name:'登录',exact:true}).click();await oa.waitForURL('**/#/oa/home',{timeout:7000});await oa.goto(base+'#/oa/library/record');await oa.getByRole('heading',{name:'东澜大学图书馆',exact:true}).waitFor();await oa.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).sisterReminder2Sent,KEY);
 const fixture=await first.storageState();
 for(const [i,choice]of content.detailReplies.entries()){
  const c=await context(fixture);const wc=await c.newPage();if(i===1)await wc.setViewportSize({width:375,height:667});await wc.goto(base+'#/game/wechat/linyuan');await wc.locator('.wc-history').getByText(content.messages[0].text,{exact:true}).waitFor();
  assert.equal(await wc.locator('.wc-history .wc-reply-choices').count(),0);assert.equal(await wc.locator('.wc-composer [data-reply-id]').count(),1);
  await wc.locator(`[data-reply-id="${content.initialReply.id}"]`).click();await wc.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).sisterConversation?.introReplyAt,KEY);const introAt=(await state(wc)).sisterConversation.introReplyAt;assert.equal(await wc.locator(`[data-message-id="${content.question.id}"]`).count(),0);
  await wc.locator('.wc-history').getByText(content.question.text,{exact:true}).waitFor();assert(Date.now()-introAt>=content.replyIntervalMs-100);assert.equal(await wc.locator('.wc-composer .wc-reply-choices button').count(),2);
  if(i===1)assert(await wc.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await wc.screenshot({path:`test-results/sister-choices-${i}.png`});
  await wc.locator(`[data-reply-id="${choice.id}"]`).click();await wc.locator('.wc-typing').waitFor();const started=(await state(wc)).sisterConversation.choiceAt;
  assert.equal(await wc.locator('.wc-reply-choices').isVisible(),false);assert.equal(await wc.locator('.wc-history').getByText(content.commonReplies[0].text,{exact:true}).count(),0);
  if(i===0){await wc.waitForTimeout(1800);await wc.reload();await wc.locator('.wc-typing').waitFor();await wc.screenshot({path:'test-results/sister-typing.png'});await wc.setViewportSize({width:1440,height:667});await wc.locator('.wc-history').evaluate(e=>e.scrollTop=0);assert(await wc.locator('.wc-history').evaluate(e=>e.scrollHeight-e.clientHeight>60));}
  else{const sibling=await c.newPage();await sibling.goto(base+'#/game/wechat/linyuan');await sibling.locator('.wc-typing').waitFor();await sibling.locator('.wc-chat-item[data-chat-id="flea-market"]').click();}
  await wc.locator('.wc-history').getByText(content.commonReplies[0].text,{exact:true}).waitFor({timeout:10000});const firstAt=Date.now();assert(firstAt-started>=content.typingDurationMs-100);assert.equal(await wc.locator(`[data-message-id="${content.commonReplies[1].id}"]`).count(),0);
  if(i===0){await wc.getByRole('button',{name:content.newMessagesLabel,exact:true}).waitFor();await wc.getByRole('button',{name:content.newMessagesLabel,exact:true}).click();assert(await wc.locator('.wc-history').evaluate(e=>e.scrollHeight-e.scrollTop-e.clientHeight<40));}
  await wc.locator('.wc-history').getByText(content.commonReplies[1].text,{exact:true}).waitFor({timeout:4000});const elapsed=Date.now()-started;assert(elapsed>=content.typingDurationMs+content.replyIntervalMs-100,`ended too early: ${elapsed}`);assert(Date.now()-firstAt>=content.replyIntervalMs-500);assert(elapsed<content.typingDurationMs+6000);
  for(const m of [content.initialReply,content.question,choice,...content.commonReplies])assert.equal(await wc.locator(`[data-message-id="${m.messageId??m.id}"]`).count(),1);
  const other=content.detailReplies.find(r=>r.id!==choice.id);assert.equal(await wc.locator(`[data-message-id="${other.messageId}"]`).count(),0);
  let s=await state(wc);assert.equal(s.sisterConversation.choiceId,choice.id);assert.equal(s.confirmedResponsibility,false);assert.equal(s.libraryPayment,null);assert.equal(s.ending,null);const completed=s.sisterConversation.completedAt;
  await wc.reload();await wc.locator('.wc-history').getByText(content.commonReplies[1].text,{exact:true}).waitFor();assert.equal((await state(wc)).sisterConversation.completedAt,completed);assert.equal(await wc.locator('.wc-typing').count(),0);
  if(i===0){await wc.setViewportSize({width:375,height:844});await wc.locator('.wc-history').evaluate(e=>e.scrollTop=e.scrollHeight);await wc.screenshot({path:'test-results/sister-completed-375.png'});assert(await wc.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await c.close();console.log(`PASS ${choice.id}: authored choice/question, ${elapsed}ms typing, shared reply, refresh/resume/idempotency, no automatic payment/ending`);
 }
 const check=await context();const page=await check.newPage();await page.goto(base+'#/bookstore/books/hermitage-book-001?tab=messages');
 const rendered=page.locator('.bs-public-message');assert.equal(await rendered.count(),3);
 const names=await rendered.locator(':scope > header > strong').allTextContents();assert.deepEqual(names,['罗尧','Hermitage','罗尧']);assert.deepEqual(await rendered.locator(':scope > header > time').allTextContents(),['10:24','11:08','11:16']);
 for(const m of comments)await page.getByText(m.text,{exact:true}).waitFor();assert(!(await page.locator('.bs-detail-panel').innerText()).includes('2021/01/01'));await page.screenshot({path:'test-results/bookstore-authored-comments.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS comments: exact authored text and times, 3 ordered replies, Hermitage public name with staff identity retained, no invented calendar date, no console errors');
}finally{await browser.close();}
