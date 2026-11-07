import {testBookstoreAccount} from './test-story-config.mjs';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
const account=testBookstoreAccount;
const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
mkdirSync('test-results',{recursive:true});
try{
 const c=await browser.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.url())});
 const base='http://127.0.0.1:4173/';
 const shot=async name=>p.screenshot({path:`test-results/bookstore-v20-${name}-1440.png`});
 await p.goto(base+'#/bookstore');await p.locator('.bs-home-hero').waitFor();await shot('home');
 await p.locator('.bs-search input').fill('7806711865');await p.locator('.bs-search button').click();await p.locator('.bs-result').waitFor();assert.equal(await p.locator('.bs-result').count(),1);await shot('search');
 await p.locator('.bs-result-title').click();await p.locator('.bs-product').waitFor();await shot('product');
 await p.getByRole('tab',{name:'历史留言',exact:true}).click();await p.waitForURL(/tab=messages/);await p.locator('.bs-public-message').first().waitFor();assert.equal(await p.locator('.bs-public-message').count(),3);
 await p.locator('.bs-contact-seller').click();await p.locator('.bs-login-dialog').waitFor();await shot('login');
 await p.locator('[name=username]').fill(account.username);await p.locator('[name=password]').fill(account.password);await p.locator('.bs-login-dialog button[type=submit]').click();await p.locator('.bs-mail-text').first().waitFor();await p.waitForTimeout(150);
 assert.equal(await p.locator('.bs-mail-letter').count(),32);assert.equal(await p.locator('.bs-mail-scroll').evaluate(n=>n.scrollTop),0);
 assert.equal(await p.locator('.bs-mail-self').count(),16);assert.equal(await p.locator('.bs-mail-letter:not(.bs-mail-self)').count(),16);
 assert(await p.locator('.bs-mail-composer textarea').isDisabled());assert(await p.locator('.bs-mail-composer button').isDisabled());
 const bounds=await p.locator('.bs-mail-layout').boundingBox();assert(bounds.y+bounds.height<=900);await shot('mail');
 const head=await p.locator('.bs-mail-thread-heading').boundingBox(),input=await p.locator('.bs-mail-composer').boundingBox(),top=await p.evaluate(()=>scrollY);
 await p.locator('.bs-mail-scroll').hover();await p.mouse.wheel(0,1800);await p.waitForTimeout(250);
 assert(await p.locator('.bs-mail-scroll').evaluate(n=>n.scrollTop>100));assert.deepEqual(await p.locator('.bs-mail-thread-heading').boundingBox(),head);assert.deepEqual(await p.locator('.bs-mail-composer').boundingBox(),input);assert.equal(await p.evaluate(()=>scrollY),top);
 await p.reload();await p.locator('.bs-mail-text').first().waitFor();assert.equal(await p.locator('.bs-mail-letter').count(),32);
 await p.locator('.bs-header-search input').fill(' 《续算杂录》 ');await p.locator('.bs-header-search button').click();await p.waitForURL(/search/);await p.locator('.bs-result').first().waitFor();assert.equal(await p.locator('.bs-result').count(),2);
 for(let i=0;i<2;i++){await p.locator('.bs-result-title').nth(i).click();await p.locator('.bs-product').waitFor();assert.equal(await p.locator('.bs-public-message').count(),0);assert.equal(await p.locator('.bs-stock-detail').innerText(),'无货');await p.goBack();await p.locator('.bs-result').first().waitFor();}
 await p.setViewportSize({width:390,height:844});
 for(const [name,route] of [['home','#/bookstore'],['search','#/bookstore/search?q=续算杂录'],['product','#/bookstore/books/hermitage-book-001'],['mail','#/bookstore/mail']]){await p.goto(base+route);await p.locator('.bs-page').waitFor();await p.waitForTimeout(100);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' horizontal overflow');await p.screenshot({path:`test-results/bookstore-v20-${name}-390.png`});}
 assert.deepEqual(errors,[]);
 // Verify the reusable input contract without adding any story or persistent messages.
 await p.goto('http://127.0.0.1:5173/#/bookstore');
 const composer=await p.evaluate(async()=>{const {BookstoreChatComposer}=await import('/src/components/BookstoreChatComposer.ts');const sent=[];const c=BookstoreChatComposer({mode:'history'});document.body.append(c.element);const input=c.element.querySelector('textarea'),button=c.element.querySelector('button');const history=input.disabled&&button.disabled;c.setMode({mode:'interactive',onSend:text=>sent.push(text)});input.value='component test';input.dispatchEvent(new Event('input'));button.click();c.setMode({mode:'history'});const result={history,sent,disabled:input.disabled&&button.disabled};c.element.remove();return result;});
 assert.deepEqual(composer,{history:true,sent:['component test'],disabled:true});
 console.log('PASS V2.0 desktop/mobile, 5 screenshots, ISBN + title search, public comments, both fragment books, 32 left/right messages, independent scrolling, fixed composer/header, refresh, reusable history/interactive contract, no browser/resource errors');
 await c.close();
}finally{await browser.close();}
