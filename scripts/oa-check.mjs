import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900}});
const errors=[];
context.on('page',p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('response',r=>{if(r.status()>=400)errors.push(r.url())})});
const page=await context.newPage();
const state=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('leaving-school-day:state:v1')||'null'));
try{
 await page.goto('http://127.0.0.1:4173/#/game/wechat/linyuan');
 await page.locator('[data-chat-id="class-group"]').click();
 const oldURL=page.url();const scroll=await page.locator('.wc-history').evaluate(n=>n.scrollTop);
 const popup=context.waitForEvent('page');await page.getByRole('link',{name:'东澜大学统一身份认证平台',exact:true}).click();const oa=await popup;await oa.waitForLoadState();
 assert.equal(page.url(),oldURL);
 const send=oa.getByRole('button',{name:'发送验证码',exact:true});const submit=oa.getByRole('button',{name:'登录',exact:true});
 await send.click();await oa.getByText('请输入学号 / 工号。',{exact:true}).waitFor();
 await oa.locator('#oa-student').fill('wrong');await send.click();await oa.getByText('学号 / 工号不正确，请核对后重试。',{exact:true}).waitFor();
 assert.equal((await state(oa))?.issuedCodes?.length??0,0);assert.equal(await page.locator('.wc-unread').count(),0);
 await oa.locator('#oa-student').fill('201920300522');await oa.locator('#oa-code').fill('210709');await submit.click();await oa.getByText('请先获取验证码。',{exact:true}).waitFor();
 await send.click();await oa.getByText('验证码已发送至绑定微信服务号',{exact:true}).waitFor();
 await page.locator('.wc-unread').waitFor();assert.equal(await page.locator('.wc-window').getAttribute('data-conversation-id'),'class-group');assert.equal(await page.locator('.wc-history').evaluate(n=>n.scrollTop),scroll);
 assert.equal((await state(oa)).issuedCodes.length,1);
 assert(!(await oa.locator('body').innerText()).includes('210709'));
 assert((await page.locator('[data-chat-id="university-service"] .wc-preview').innerText()).includes('210709'));
 await page.locator('[data-chat-id="university-service"]').click();await page.locator('.wc-history').getByText('您正在登录东澜大学统一身份认证平台，验证码为 210709。请勿向他人泄露。',{exact:true}).waitFor();
 assert.equal(await page.locator('.wc-unread').count(),0);assert.equal(await page.locator('[data-message-id^="oa-code-"]').count(),1);
 for(let i=0;i<2;i++){await page.reload();await oa.reload();}
 assert.equal((await state(oa)).issuedCodes.length,1);assert.equal(await page.locator('[data-message-id^="oa-code-"]').count(),1);
 await page.getByRole('searchbox').fill('服务号');await page.getByRole('searchbox').fill('');assert.equal((await state(page)).issuedCodes.length,1);
 await oa.locator('#oa-code').fill('');await submit.click();await oa.getByText('验证码不正确，请核对后重试。',{exact:true}).waitFor();
 await oa.locator('#oa-code').fill('000000');await submit.click();await oa.getByText('验证码不正确，请核对后重试。',{exact:true}).waitFor();assert.equal((await state(oa)).authenticated,false);
 await send.click();await page.waitForFunction(()=>document.querySelectorAll('[data-message-id^="oa-code-"]').length===2);assert.equal((await state(oa)).issuedCodes.length,2);
 await oa.evaluate(()=>{window.loginEvents=0;window.addEventListener('oa-login-success',e=>{window.loginEvents++;window.loginPlayer=e.detail.playerId;})});
 await oa.locator('#oa-code').fill('210709');await submit.click();await oa.getByRole('heading',{name:'登录成功，正在进入东澜大学OA系统……'}).waitFor();
 assert.equal(await oa.evaluate(()=>window.loginEvents),1);assert.equal(await oa.evaluate(()=>window.loginPlayer),'linchen');assert.equal((await state(page)).authenticated,true);
 await oa.reload();await oa.getByRole('heading',{name:'登录成功，正在进入东澜大学OA系统……'}).waitFor();await page.reload();assert.equal((await state(page)).issuedCodes.length,2);
 assert.deepEqual(errors,[]);
 console.log('PASS V1.1: empty/wrong student sends nothing; fixed code; new tab and cross-tab sync; unread; empty/wrong code rejected; refresh/render no duplicates; resend adds exactly one; correct login; success event; persisted auth; no console/network errors');
}finally{await browser.close();}
