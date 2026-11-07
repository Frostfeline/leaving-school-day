import {chromium} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {validateInvestigationFiles} from './validate-investigation.mjs';
const files=['oa-library-assistant','wechat/characters','wechat/sister-reminder-2','search/search-index','wechat/chats/luo-yao','wechat/chats/sister'];
const originals=new Map(files.map(f=>[f,readFileSync('src/content/'+f+'.json','utf8')]));
const edit=(f,fn)=>{const d=JSON.parse(originals.get(f));fn(d);writeFileSync('src/content/'+f+'.json',JSON.stringify(d,null,2)+'\n');};
let browser;
try{
 edit('oa-library-assistant',d=>{d.questions[0].paragraphs=['【QA临时】回答仅通过JSON修改。'];});
 edit('wechat/characters',d=>{d.luoyao.remark='【QA】尧友';});
 edit('wechat/sister-reminder-2',d=>{d.messages[0].text='【QA临时】第二次提醒仅通过JSON修改。';});
 edit('search/search-index',d=>{d.entries[0].summary='【QA临时】书目摘要仅通过JSON修改。';d.entries.push({id:'qa-document',kind:'document',title:'【QA】测试资料',source:'测试存档',summary:'测试新增索引',keywords:['qa-新词'],paragraphs:['【QA】新增文档正文。']});});
 edit('wechat/chats/sister',d=>{d.messages.push({id:'qa-ayaohistory',senderId:'linyuan',timestamp:'2025-06-25T09:03:00+08:00',type:'text',text:'【QA临时】包含阿尧的历史消息。'});});
 edit('wechat/chats/luo-yao',d=>{d.messages.push({id:'qa-luoyao-site',senderId:'luoyao',timestamp:'2021-01-01T10:00:00+08:00',type:'link',text:'【QA临时】链接接口测试。',linkLabel:'【QA】旧书网站链接',routeId:'bookstore-home'});});
 validateInvestigationFiles();
 browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:900}});const p=await context.newPage();await p.goto('http://127.0.0.1:5173/#/game/wechat/linyuan');const search=p.getByRole('searchbox',{name:'搜好友',exact:true});
 await search.fill('阿尧');assert.equal(await p.locator('.wc-chat-item[data-chat-id="luoyao"]').count(),0);assert.equal(await p.locator('.wc-message-result').count(),0);await search.fill('');await p.locator('.wc-chat-item[data-chat-id="linyuan"]').click();await p.locator('.wc-history [data-message-id="qa-ayaohistory"]').waitFor();
 await search.fill('罗尧');await p.locator('.wc-chat-item[data-chat-id="luoyao"]').getByText('【QA】尧友',{exact:true}).waitFor();await p.locator('.wc-chat-item[data-chat-id="luoyao"]').click();
 await p.getByRole('link',{name:'【QA】旧书网站链接',exact:true}).click();await p.locator('.bs-home-hero h1').waitFor();assert.equal(context.pages().length,1);await p.getByRole('button',{name:'返回微信聊天',exact:true}).click();
 await p.getByRole('button',{name:'搜一搜',exact:true}).click();await p.getByRole('searchbox',{name:'搜一搜关键词',exact:true}).fill('7806711865');await p.getByRole('searchbox',{name:'搜一搜关键词',exact:true}).press('Enter');await p.getByText('【QA临时】书目摘要仅通过JSON修改。',{exact:true}).waitFor();
 await p.getByRole('searchbox',{name:'搜一搜关键词',exact:true}).fill('qa-新词');await p.getByRole('searchbox',{name:'搜一搜关键词',exact:true}).press('Enter');await p.locator('[data-result-id="qa-document"] a').click();await p.getByText('【QA】新增文档正文。',{exact:true}).waitFor();
 const oa=await context.newPage();await oa.goto('http://127.0.0.1:5173/#/oa/login');await oa.locator('#oa-student').fill('201920300522');await oa.getByRole('button',{name:'发送验证码',exact:true}).click();await oa.locator('#oa-code').fill('210709');await oa.getByRole('button',{name:'登录',exact:true}).click();await oa.waitForURL('**/#/oa/home',{timeout:7000});await oa.goto('http://127.0.0.1:5173/#/oa/library/record');await oa.locator('[data-question-id="borrower_mismatch"]').click();await oa.getByText('【QA临时】回答仅通过JSON修改。',{exact:true}).waitFor();
 await p.bringToFront();await p.getByRole('button',{name:'返回微信聊天',exact:true}).click();await search.fill('');await p.locator('.wc-chat-item[data-chat-id="linyuan"]').click();await p.getByText('【QA临时】第二次提醒仅通过JSON修改。',{exact:true}).waitFor({timeout:5000});
 console.log('PASS JSON-only edits: answer, contact remark, reminder, summary, new document index, 阿尧 history vs contact, luoyao route B uses same embedded bookstore (temporary fixture, not authored plot)');
}finally{
 if(browser)await browser.close();for(const [f,text]of originals)writeFileSync('src/content/'+f+'.json',text);validateInvestigationFiles();console.log('RESTORED all authored JSON files');
}
