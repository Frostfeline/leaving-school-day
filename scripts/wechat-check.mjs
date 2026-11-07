import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors=[]; page.on('pageerror', e=>errors.push(e.message)); page.on('console',m=>{if(m.type()==='error') errors.push(m.text())}); page.on('response',r=>{if(r.status()>=400)errors.push(r.url())});
mkdirSync('test-results',{recursive:true});
try {
 await page.goto('http://127.0.0.1:4173/'); await page.getByRole('button',{name:'开始游戏'}).click();
 await page.getByRole('heading',{name:'姐姐',exact:true}).waitFor();
 assert.equal(await page.locator('.wc-chat-item').count(),4);
 assert.equal(await page.getByText('罗尧').count(),0);
 const box=await page.locator('.wc-window').boundingBox(); assert(box.width>=1100 && box.width<=1250 && box.height>=700 && box.height<=800);
 await page.screenshot({path:'test-results/wechat-sister-1440.png',fullPage:true});
 for(const id of ['class-group','university-service','flea-market','linyuan']) {
   await page.locator(`[data-chat-id="${id}"]`).click();
   assert.equal(await page.locator('.wc-window').getAttribute('data-conversation-id'),id);
   assert.equal(await page.locator(`[data-chat-id="${id}"]`).getAttribute('aria-current'),'true');
   if(id==='class-group') { await page.locator('.wc-sender').first().waitFor(); await page.screenshot({path:'test-results/wechat-class-1440.png',fullPage:true}); }
 }
 await page.getByRole('searchbox').fill('  通知群  '); assert.equal(await page.locator('.wc-chat-item').count(),1);
 await page.getByRole('searchbox').fill('罗尧'); assert.equal(await page.locator('.wc-chat-item').count(),0);
 await page.getByRole('searchbox').fill(''); assert.equal(await page.locator('.wc-chat-item').count(),4);
 assert(await page.getByRole('button',{name:'发送',exact:true}).isDisabled());
 assert(await page.locator('textarea').isDisabled());
 assert(await page.locator('img').evaluateAll(images=>images.every(image=>image.complete&&image.naturalWidth>0)));
 await page.reload(); await page.getByRole('heading',{name:'姐姐',exact:true}).waitFor();
 await page.setViewportSize({width:375,height:667});
 await page.getByRole('button',{name:'聊天列表',exact:true}).click();
 await page.locator('[data-chat-id="class-group"]').click();
 await page.getByRole('heading',{name:'2022级法语系2班通知群',exact:true}).waitFor();
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'test-results/wechat-mobile-375.png',fullPage:true});
 assert.deepEqual(errors,[]); console.log('PASS stage B: 1440x900 desktop, four chats, group nickname, search, hidden contact absent, disabled composer, avatars, refresh, mobile, console/network');
} finally { await browser.close(); }
