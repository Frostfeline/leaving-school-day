import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from '@playwright/test';
const read=p=>JSON.parse(readFileSync('src/content/'+p+'.json','utf8'));
const base=process.env.TEST_BASE_URL || 'http://127.0.0.1:5173/';
const key='leaving-school-day:state:v1';
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE || (process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined)});
const errors=[];
try{
 const context=await browser.newContext();const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
 await page.goto(base);await page.locator('#intro-panel').waitFor();
 assert.deepEqual(await page.locator('#intro-panel > p').allTextContents(),read('intro').preface.paragraphs.map(p=>p.replaceAll('*','')));
 assert.equal(await page.locator('#intro-panel strong').count(),5);
 assert(await page.locator('#intro-panel > p').evaluateAll(ps=>ps.every(p=>parseFloat(getComputedStyle(p).textIndent)===2*parseFloat(getComputedStyle(p).fontSize))));
 assert(await page.locator('#intro-panel > p').nth(2).evaluate(p=>parseFloat(getComputedStyle(p).paddingBlockStart)>0));
 const forum=read('forum/forum-thread');await page.goto(base+'#/forum/threads/'+forum.id);
 for(const floor of [8,12,18]){
  const post=forum.posts.find(p=>p.floor===floor),text=page.locator(`[data-floor="${floor}"] .forum-post-text`);
  assert.deepEqual(await text.locator('p').allTextContents(),post.content.map(p=>p.replaceAll('*','')));
  assert(await text.locator('strong').count()>0);
 }
 await page.goto(base+'#/wechat/article/borrow-life');
 await page.locator('.wa-article-body strong').getByText('算尽则死',{exact:true}).waitFor();
 const accounts=page.locator('.wa-article-body p').filter({hasText:'有名籍，有账目。有欠负，亦有偿还。'});
 assert.equal(await accounts.count(),1);assert.equal(await accounts.locator('strong').count(),0);
 const rule=page.locator('.wa-article-body strong').filter({hasText:'要求受命者在命数接续之日'});
 assert.equal(await rule.innerText(),'要求受命者在命数接续之日，恰好与借命者当时的实足年龄相等。');
 assert.equal(await rule.locator('em').count(),0);
 await page.goto(base+'#/wechat/article/donglan-admission-2017');
 await page.getByRole('heading',{name:'东澜大学2020年审核制、硕博连读博士研究生（第一批）拟录取公示',exact:true}).waitFor();
 assert(!(await page.locator('.wa-article').innerText()).includes('2017年'));
 await page.goto(base+'#/game/wechat/linyuan');await page.locator('.wc-window').waitFor();
 for(const [id,file,name] of [['changsizhu','chang-si-zhu','常司烛'],['huosisi','huo-si-si','霍思斯']]){
  assert.equal(await page.locator(`[data-chat-id=${id}]`).count(),0);
  const messages=read('wechat/chats/'+file).messages;
  assert(messages.every((m,i)=>!i||m.timestamp>=messages[i-1].timestamp));
  assert.equal(new Set(messages.map(m=>m.id)).size,messages.length);
  await page.locator('.wc-search').fill(name);
  await page.locator(`[data-contact-id=${id}]`).click();await page.locator('.wc-search').fill('');
  for(const m of messages){
   const bubble=page.locator(`[data-message-id="${m.id}"] .wc-bubble`);
   assert.equal(await bubble.innerText(),m.text.replaceAll('[Doge]',''));
   assert.equal(await bubble.locator('img[alt="[Doge]"]').count(),m.text.split('[Doge]').length-1);
   await bubble.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
  }
  await page.reload();await page.locator(`[data-chat-id=${id}]`).waitFor();
  for(const query of [read('wechat/characters')[id].wechatNickname,read('wechat/characters')[id].remark]){
   await page.locator('.wc-search').fill(query);await page.locator(`[data-contact-id=${id}]`).waitFor();
  }
  await page.locator('.wc-search').fill('');
 }
 assert.equal(read('wechat/chats/chang-si-zhu').messages.at(-1).text,'明白了谢谢[Doge][Doge]');
 assert(read('wechat/chats/chang-si-zhu').messages[3].timestamp.startsWith('2023-10-19T20:42:00'));
 assert(read('wechat/chats/huo-si-si').messages[0].timestamp.startsWith('2023-12-18'));
 // Old conversation progress remains valid after removing the unshipped transfer feature.
 await page.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key)),now=Date.now()-60000;delete s.receivedTransferIds;s.sisterReminder2Sent=true;s.sisterReminder2SentAt=now;s.sisterReminder2Read=true;s.sisterConversation={branchRepliesEnabled:false,introReplyAt:now,questionSentAt:now,questionRead:true,choiceId:'describe_book',choiceAt:now,typingUntil:now,commonRepliesSent:2,readReplyCount:2,completedAt:now,completionRead:true};localStorage.setItem(key,JSON.stringify(s));},key);
 await page.reload();await page.locator('[data-chat-id=linyuan]').click();
 const transfer=page.locator('[data-transfer-id=sister-transfer-500]');
 assert.equal(await transfer.count(),0);await page.locator('[data-message-id=sister-offer-transfer]').getByText('姐姐一会转你',{exact:true}).waitFor();
 await page.reload();await page.locator('[data-message-id=sister-offer-transfer]').getByText('姐姐一会转你',{exact:true}).waitFor();assert.equal(await transfer.count(),0);
 await page.goto(base+'#/oa/login');await page.locator('#oa-student').fill('abc');await page.locator('.oa-request').click();
 await page.getByText(read('oa-login').wrongStudent,{exact:true}).waitFor();
 await page.locator('#oa-student').fill('202210300529');await page.locator('.oa-request').click();
 await page.getByText(read('oa-login').unboundStudent,{exact:true}).waitFor();
 assert.deepEqual(errors,[]);console.log('PASS indent/nested emphasis, hidden friends/search/discovery persistence, Doge/date, removed transfer, OA validation');
}finally{await browser.close();}
