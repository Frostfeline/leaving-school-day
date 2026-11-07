import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const errors=[];const make=async options=>{const context=await browser.newContext({viewport:{width:1440,height:900},...options});context.on('page',p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('response',r=>{if(r.status()>=400)errors.push(r.url())});p.on('dialog',d=>errors.push('unexpected '+d.type()))});return context;};
const state=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('leaving-school-day:state:v1')||'null'));
mkdirSync('test-results',{recursive:true});
try{
 const context=await make();const wc=await context.newPage();await wc.goto('http://127.0.0.1:4173/#/game/wechat/linyuan');
 await wc.locator('[data-chat-id="class-group"]').click();const popup=context.waitForEvent('page');await wc.getByRole('link',{name:'东澜大学统一身份认证平台',exact:true}).click();const oa=await popup;await oa.waitForLoadState();
 await oa.locator('#oa-student').fill('201920300522');await oa.getByRole('button',{name:'发送验证码',exact:true}).click();await wc.locator('.wc-unread').waitFor();await oa.locator('#oa-code').fill('210709');await oa.getByRole('button',{name:'登录',exact:true}).click();await oa.waitForURL('**/#/oa/home',{timeout:7000});
 const authenticatedFixture=await context.storageState();
 await oa.locator('[data-notice-id="library-exception"] a').click();await oa.getByRole('heading',{name:'图书馆借阅异常',exact:true}).waitFor();
 assert.deepEqual(await oa.locator('.oa-record dt').allTextContents(),['事项类型','馆藏条码','当前责任登记人','待处理金额','当前状态']);
 let text=await oa.locator('body').innerText();for(const secret of ['罗尧','ISBN','书名','借阅日期'])assert(!text.includes(secret),secret);
 await oa.getByText('200400080612',{exact:true}).waitFor();assert.equal((await state(oa)).knowLuoYaoName,false);assert.equal((await state(oa)).enteredInvestigation,false);
 assert.equal(await oa.getByText('待处理',{exact:true}).count(),1);assert.equal(await oa.getByRole('link',{name:'待处理',exact:true}).count(),0);
 await oa.screenshot({path:'test-results/oa-summary-v13-1440.png',fullPage:false});
 await oa.getByRole('link',{name:'立即缴费',exact:true}).click();await oa.getByRole('heading',{name:'东澜大学校园统一支付平台',exact:true}).waitFor();
 const pay=oa.getByRole('button',{name:'确认支付 ¥1,600.00',exact:true});assert(await pay.isDisabled());assert.equal(await oa.getByRole('checkbox').isChecked(),false);
 assert(!(await oa.locator('body').innerText()).includes('罗尧'));
 await oa.screenshot({path:'test-results/oa-payment-v13-1440.png',fullPage:false});
 await oa.getByRole('checkbox').check();assert(await pay.isEnabled());const started=Date.now();await pay.click();await oa.getByRole('button',{name:'支付处理中……',exact:true}).waitFor();assert(await oa.getByRole('button',{name:'支付处理中……',exact:true}).isDisabled());
 await oa.waitForFunction(()=>JSON.parse(localStorage.getItem('leaving-school-day:state:v1')).libraryPayment!==null);
 const paymentId=(await state(oa)).libraryPayment.id;const startedAt=(await state(oa)).libraryPayment.startedAt;
 await oa.reload();await oa.getByRole('button',{name:'支付处理中……',exact:true}).waitFor();assert.equal((await state(oa)).libraryPayment.startedAt,startedAt);
 // A second already-open OA tab must not restart the payment either.
 const other=await context.newPage();await other.goto('http://127.0.0.1:4173/#/oa/payment');assert(await other.getByRole('button',{name:'支付处理中……',exact:true}).isDisabled());
 await oa.getByText('支付成功',{exact:true}).waitFor({timeout:5000});const elapsed=Date.now()-started;assert(elapsed>=2400&&elapsed<4000,`payment duration ${elapsed}`);
 await oa.screenshot({path:'test-results/oa-payment-success-v13-1440.png',fullPage:false});
 const paid=await state(oa);assert.equal(paid.libraryPayment.id,paymentId);assert.equal(paid.libraryPayment.status,'completed');assert.equal(paid.ending,'ne-graduation');assert.equal(paid.knowLuoYaoName,false);
 await oa.waitForURL('**/#/ending/ne',{timeout:4000});await oa.locator('.ne-receipt').waitFor();assert(await oa.getByRole('button',{name:'返回游戏首页',exact:true,includeHidden:true}).isHidden());
 await oa.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.ne-ending')).opacity)>.99);
 await oa.screenshot({path:'test-results/ne-receipt-v13-1440.png',fullPage:false});
 assert.equal(await oa.locator('.ne-identity dd').nth(1).innerText(),'201920300522');assert.deepEqual(await oa.locator('.ne-settlement tbody td').allTextContents(),['水电费','已结清','图书馆','已结清']);assert(!(await oa.locator('body').innerText()).includes('开发'));
 await oa.waitForFunction(()=>JSON.parse(localStorage.getItem('leaving-school-day:state:v1')).endingPresentationComplete===true,{timeout:12000});
 await oa.getByRole('button',{name:'返回游戏首页',exact:true}).waitFor();assert.equal(await oa.locator('.ne-final').evaluate(n=>getComputedStyle(n).opacity),'1');
 await oa.getByRole('button',{name:'返回游戏首页',exact:true}).scrollIntoViewIfNeeded();await oa.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.ne-return')).opacity)>.99);await oa.screenshot({path:'test-results/ne-final-v13-1440.png',fullPage:false});await oa.screenshot({path:'test-results/ne-full-v13.png',fullPage:true});
 assert.equal(await oa.locator('.ne-final').innerText(),'Normal End｜毕业快乐');assert.equal(await oa.locator('.ne-closing').innerText(),'毕业快乐，林琛。');
 await oa.reload();await oa.locator('.ne-narrative').waitFor();assert(await oa.locator('.ne-receipt').isHidden());assert.equal((await state(oa)).libraryPayment.startedAt,startedAt);
 await oa.goto('http://127.0.0.1:4173/#/oa/payment');await oa.waitForURL('**/#/ending/ne');assert.equal((await state(oa)).ending,'ne-graduation');
 const beforeReturn=await state(oa);const pagesBefore=context.pages().length;const rawSave=await oa.evaluate(()=>localStorage.getItem('leaving-school-day:state:v1'));
 await oa.getByRole('button',{name:'返回游戏首页',exact:true}).click();await oa.getByRole('heading',{name:'离校日',exact:true}).waitFor();assert.equal(new URL(oa.url()).hash,'#/');assert.equal(context.pages().length,pagesBefore);
 assert.equal(await oa.evaluate(()=>localStorage.getItem('leaving-school-day:state:v1')),rawSave);assert.deepEqual(await state(oa),beforeReturn);await oa.reload();await oa.getByRole('heading',{name:'离校日',exact:true}).waitFor();assert.equal((await state(oa)).ending,'ne-graduation');
 console.log('PASS return button: hidden until final text complete, same-tab intro navigation, entire save unchanged and retained after reload');
 console.log(`PASS path A: real login, no name/details in summary, default unchecked, ${elapsed}ms payment, processing refresh and multiple tabs idempotent, success/receipt/exact ending, refresh keeps final NE`);
 // Path B starts from the actual authenticated save captured above, before any branch.
 const b=await make({storageState:authenticatedFixture});const bOA=await b.newPage();const bWC=await b.newPage();await bWC.goto('http://127.0.0.1:4173/#/game/wechat/linyuan');await bOA.goto('http://127.0.0.1:4173/#/oa/notices/library-exception');
 assert.equal((await state(bOA)).knowLuoYaoName,false);await bOA.getByRole('link',{name:'我有疑问',exact:true}).click();await bOA.getByRole('heading',{name:'东澜大学图书馆',exact:true}).waitFor();await bOA.getByText('罗尧',{exact:true}).waitFor();assert.deepEqual(await bOA.locator('.oa-record dt').allTextContents(),['赔偿金额','当前责任人','原始借阅人','书名','ISBN','馆藏编码','历史借阅日期']);
 await bOA.getByText('200400080612',{exact:true}).waitFor();assert.equal((await state(bOA)).viewedOriginalRecord,true);assert.equal((await state(bOA)).enteredInvestigation,true);
 await bWC.getByRole('searchbox').fill('罗尧');await bWC.locator('[data-chat-id="luoyao"]').waitFor();assert.equal((await state(bWC)).addedLuoYao,false);await bWC.locator('[data-chat-id="luoyao"]').click();assert.equal((await state(bWC)).addedLuoYao,true);
 await bOA.screenshot({path:'test-results/oa-investigation-v13-1440.png',fullPage:false});await bOA.getByRole('link',{name:'返回借阅异常',exact:true}).click();await bOA.getByRole('link',{name:'立即缴费',exact:true}).click();await bOA.getByRole('checkbox').check();await bOA.getByRole('button',{name:'确认支付 ¥1,600.00',exact:true}).click();await bOA.locator('.oa-payment-status').filter({hasText:'支付成功'}).waitFor({timeout:5000});await bOA.waitForURL('**/#/ending/ne',{timeout:4000});assert.equal((await state(bOA)).ending,'ne-graduation');
 const completedAt=(await state(bOA)).libraryPayment.completedAt;await bOA.reload();await bOA.locator('.ne-ending').waitFor();assert.equal((await state(bOA)).libraryPayment.completedAt,completedAt);assert.equal((await state(bOA)).knowLuoYaoName,true);assert.equal((await state(bOA)).addedLuoYao,true);
 console.log('PASS path B: name discovery/search preserved, investigate then pay also reaches NE, refresh preserves payment and contacts');
 // Reproduce the old-rule completed save from the reported payment-success screen.
 const legacy=await b.storageState();for(const origin of legacy.origins){for(const item of origin.localStorage){if(item.name==='leaving-school-day:state:v1'){const saved=JSON.parse(item.value);saved.ending=null;saved.libraryPayment.eligibleForNE=false;saved.endingStartedAt=null;saved.endingPresentationComplete=false;item.value=JSON.stringify(saved);}}}
 const restored=await make({storageState:legacy});const restoredPage=await restored.newPage();await restoredPage.goto('http://127.0.0.1:4173/#/oa/payment');await restoredPage.waitForURL('**/#/ending/ne');
 const restoredState=await state(restoredPage);assert.equal(restoredState.ending,'ne-graduation');assert.equal(restoredState.libraryPayment.completedAt,completedAt);assert.equal(restoredState.addedLuoYao,true);assert.equal(restoredState.enteredInvestigation,true);assert.equal(await restoredPage.getByRole('button',{name:'支付处理中……',exact:true}).count(),0);
 await restoredPage.reload();assert.equal((await state(restoredPage)).libraryPayment.completedAt,completedAt);console.log('PASS legacy save: completed investigated payment restores NE without repaying, no lost progress');
 // Investigation in another tab while processing no longer disqualifies NE.
 const c=await make({storageState:authenticatedFixture});const cOA=await c.newPage();await cOA.goto('http://127.0.0.1:4173/#/oa/payment');await cOA.getByRole('checkbox').check();await cOA.getByRole('button',{name:'确认支付 ¥1,600.00',exact:true}).click();const recordTab=await c.newPage();await recordTab.goto('http://127.0.0.1:4173/#/oa/library/record');await recordTab.getByText('罗尧',{exact:true}).waitFor();await cOA.locator('.oa-payment-status').filter({hasText:'支付成功'}).waitFor({timeout:5000});assert.equal((await state(cOA)).ending,'ne-graduation');
 const unauth=await make();const guard=await unauth.newPage();for(const path of ['#/oa/payment','#/oa/library/record','#/ending/ne']){await guard.goto('http://127.0.0.1:4173/'+path);await guard.waitForURL('**/#/oa/login');}
 await recordTab.setViewportSize({width:390,height:844});assert(await recordTab.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);console.log('PASS concurrent investigation, unauthenticated route guards, mobile overflow, console/network/dialog');
}finally{await browser.close();}
