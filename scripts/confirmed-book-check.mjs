import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});mkdirSync('test-results',{recursive:true});
try{
 for(const port of [5173,4173]){
 const context=await browser.newContext({viewport:{width:1440,height:900}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 const base='http://127.0.0.1:'+port+'/';
 await page.goto(base+'#/bookstore');assert.equal(await page.getByRole('searchbox').inputValue(),'');assert(!(await page.locator('body').innerText()).includes('7806711865'));
 for(const query of ['7806711865',' 7-80671-186-5 ','道教命籍与民间禳解文化研究','命籍']){
 await page.goto(base+'#/bookstore');await page.getByRole('searchbox').fill(query);await page.getByRole('searchbox').press('Enter');await page.getByRole('link',{name:'道教命籍与民间禳解文化研究',exact:true}).waitFor();assert.equal(await page.locator('.bs-result').count(),1);
 }
 if(port===5173)await page.screenshot({path:'test-results/bookstore-confirmed-results-1440.png',fullPage:false});
 await page.getByRole('link',{name:'道教命籍与民间禳解文化研究',exact:true}).click();await page.getByRole('heading',{name:'道教命籍与民间禳解文化研究',exact:true}).waitFor();
 for(const text of ['周景衡 沈知止','栖云古籍出版社','2003年11月','7806711865','B958','¥600.00'])await page.locator('.bs-product-info').getByText(text,{exact:true}).first().waitFor();
 assert(!(await page.locator('body').innerText()).includes('200400080612'));assert.equal(await page.locator('.bs-product-info .bs-draft-notice').count(),0);await page.waitForFunction(()=>Array.from(document.querySelectorAll('img')).every(i=>i.complete&&i.naturalWidth>0));
 if(port===5173)await page.screenshot({path:'test-results/bookstore-confirmed-product-1440.png',fullPage:false});
 await page.getByRole('searchbox').fill('200400080612');await page.getByRole('searchbox').press('Enter');await page.getByText('未找到相关书籍，请尝试其他关键词。',{exact:true}).waitFor();
 await page.goto(base+'#/oa/login');await page.locator('#oa-student').fill('201920300522');await page.getByRole('button',{name:'发送验证码',exact:true}).click();await page.locator('#oa-code').fill('210709');await page.getByRole('button',{name:'登录',exact:true}).click();await page.waitForURL('**/#/oa/home',{timeout:7000});
 await page.locator('[data-notice-id="library-exception"] a').click();await page.getByText('200400080612',{exact:true}).waitFor();await page.getByText('¥1,600.00',{exact:true}).waitFor();assert.equal(await page.getByText('7806711865',{exact:true}).count(),0);
 await page.getByRole('link',{name:'我有疑问',exact:true}).click();await page.locator('[data-question-id="book_details"]').click();
 for(const text of ['200400080612','道教命籍与民间禳解文化研究','周景衡 沈知止','栖云古籍出版社','2003年11月','7806711865','B958','¥600.00','¥1,600.00'])await page.locator('.oa-record').getByText(text,{exact:true}).first().waitFor();
 assert(!(await page.locator('body').innerText()).includes('1,200'));await page.reload();await page.locator('.oa-record').getByText('7806711865',{exact:true}).waitFor();if(port===5173)await page.screenshot({path:'test-results/oa-confirmed-library-record.png',fullPage:true});
 await page.getByRole('link',{name:'返回借阅异常',exact:true}).click();await page.getByRole('link',{name:'立即缴费',exact:true}).click();await page.getByRole('button',{name:'确认支付 ¥1,600.00',exact:true}).waitFor();
 await page.setViewportSize({width:390,height:844});await page.goto(base+'#/bookstore/books/hermitage-book-001');await page.getByRole('heading',{name:'道教命籍与民间禳解文化研究',exact:true}).waitFor();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);await context.close();
 console.log(`PASS port ${port}: confirmed ISBN/full/partial search, normalized ISBN, exact metadata, list price vs sale price, library-only barcode, live OA record/reload, compensation/payment 1600, mobile and console`);
 }
}finally{await browser.close();}
