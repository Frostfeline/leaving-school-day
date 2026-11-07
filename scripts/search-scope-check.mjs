import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const book=JSON.parse(readFileSync('src/content/bookstore/books.json','utf8')).items[0];
const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
mkdirSync('test-results/search-scope',{recursive:true});
try{
 for(const port of [5173,4173]){
  const context=await browser.newContext({viewport:{width:1440,height:900}}),errors=[];
  context.on('page',p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});});
  const wc=await context.newPage(),base=`http://127.0.0.1:${port}/`;
  await wc.goto(base+'#/game/wechat/linyuan');const original=wc.url();
  const [search]=await Promise.all([context.waitForEvent('page'),wc.getByRole('button',{name:'搜一搜',exact:true}).click()]);
  await search.getByRole('searchbox').fill('老庄旧书网');await search.getByRole('searchbox').press('Enter');
  await search.locator('[data-result-id="bookstore-site"]').waitFor();assert.equal(await search.locator('.wc-web-result').count(),1);assert(!(await search.locator('.wc-web-results').innerText()).includes(book.title));assert.equal(wc.url(),original);
  await search.screenshot({path:`test-results/search-scope/site-only-${port}.png`});
  const [store]=await Promise.all([context.waitForEvent('page'),search.getByRole('link',{name:'老庄旧书网',exact:true}).click()]);await store.waitForLoadState();assert.equal(new URL(store.url()).hash,'#/bookstore');
  for(const query of ['道教命籍',book.title,book.isbn,'7-80671-186-5','续算杂录','《续算杂录》',' 续算杂录 ']){
   await search.getByRole('searchbox').fill(query);await search.getByRole('searchbox').press('Enter');
   await search.locator('.wc-web-query').filter({hasText:query.trim()}).waitFor();
   assert.equal(await search.locator('.wc-web-result,.wc-fiction-promotion').count(),0,`unexpected public book result: ${query}`);
   assert.equal(await search.locator('[data-result-id="book-bibliography"],[data-result-id="book-history"]').count(),0);
  }
  for(const id of ['book-bibliography','book-history']){await search.goto(base+'#/search/documents/'+id);assert.equal(await search.locator('.wc-book-metadata').count(),0);assert(!(await search.locator('.wc-web-document').innerText()).includes(book.title));}
  for(const query of ['寄岁','借命']){await search.goto(base+'#/search?'+new URLSearchParams({q:query}));if(query==='寄岁'){await search.locator('[data-result-id="forum-jisui"]').waitFor();await search.locator('[data-result-id="fortune-ad"]').waitFor();}else {await search.locator('[data-result-id="article-borrow-life"]').waitFor();await search.getByRole('link',{name:'《伥渡：借命人》',exact:true}).waitFor();}}
  for(const query of [book.isbn,'道教命籍',' 7-80671-186-5 ']){await store.goto(base+'#/bookstore');await store.getByRole('searchbox').fill(query);await store.getByRole('searchbox').press('Enter');await store.locator('.bs-result-title').waitFor();assert.equal(await store.locator('.bs-result').count(),1);}
  for(const query of ['续算杂录','《续算杂录》',' 续算杂录 ']){await store.goto(base+'#/bookstore');await store.getByRole('searchbox').fill(query);await store.getByRole('searchbox').press('Enter');await store.locator('.bs-result-title').first().waitFor();assert.equal(await store.locator('.bs-result').count(),2);}
  await store.locator('.bs-result-title').first().click();await store.locator('.bs-product-info h1').waitFor();assert((await store.locator('body').innerText()).includes('续算杂录'));
  assert.equal(wc.url(),original);assert.deepEqual(errors,[]);await context.close();console.log(`PASS ${port}: site-only public search; titles/ISBN excluded; legacy bibliography blocked; forum/article/ads retained; bookstore title/ISBN and two fragments searchable; separate tabs preserved`);
 }
 writeFileSync('test-results/search-scope/results.json',JSON.stringify({passed:true,ports:[5173,4173],scope:'book and bookstore-product excluded from WeChat search and legacy documents; bookstore search unchanged'},null,2));
}finally{await browser.close();}
