import {chromium} from '@playwright/test';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
import {validateBookstoreFiles} from './check-bookstore.mjs';
const file='src/content/bookstore/xusuan-zalu.json';const original=readFileSync(file,'utf8');const group=JSON.parse(original);const oldBook=JSON.parse(readFileSync('src/content/bookstore/books.json','utf8')).items[0];
const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});const KEY='leaving-school-day:state:v1';
mkdirSync('test-results',{recursive:true});
const errors=[];const make=async()=>{const c=await browser.newContext({viewport:{width:1440,height:900}});c.on('page',p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('response',r=>{if(r.status()>=400)errors.push(r.url())});});return c;};
const submit=async(page,q)=>{const input=page.locator('.bs-search input');await input.fill(q);await input.press('Enter');await page.waitForFunction(q=>document.querySelector('.bs-results-heading')?.dataset.query===q,q.trim());};
const unrelated=async page=>page.evaluate(key=>{const state=JSON.parse(localStorage.getItem(key)||'null');if(!state)return null;const {bookstoreProgress,...other}=state;return other;},KEY);
try{
 validateBookstoreFiles();
 for(const port of [5173,4173]){
  const c=await make();const page=await c.newPage();const base=`http://127.0.0.1:${port}/`;await page.goto(base+'#/bookstore');const initial=await unrelated(page);
  for(const query of ['续算杂录','《续算杂录》','  续算杂录  ']){await submit(page,query);assert.deepEqual(await page.locator('.bs-result').evaluateAll(rows=>rows.map(r=>r.dataset.productId)),group.items.map(b=>b.id));await page.getByRole('heading',{name:'搜索结果：续算杂录',exact:true}).waitFor();await page.getByText('共找到 2 件相关商品',{exact:true}).waitFor();assert.equal(await page.locator('.bs-results .bs-stock-empty').count(),2);assert.equal(await page.locator('.bs-results .bs-price').count(),0);}
  await submit(page,'续算杂录');await page.screenshot({path:`test-results/xusuan-results-${port}-1440.png`});
  for(const [index,book]of group.items.entries()){
   const row=page.locator(`[data-product-id="${book.id}"]`);await row.getByText(book.summary,{exact:true}).waitFor();await row.getByText(`版本：${book.edition}`,{exact:true}).waitFor();
   // First title, second card body; both reuse the same product router.
   if(index===0)await row.locator('.bs-result-title').click();else await row.locator('.bs-result-summary').click();
   await page.locator('.bs-product-info h1').filter({hasText:book.title}).waitFor();
   assert.equal(await page.getByRole('tab',{name:'历史留言',exact:true}).count(),0);assert.equal(await page.locator('.bs-public-message').count(),0);assert.equal(await page.locator('.bs-price').count(),0);
   assert.equal(await page.getByRole('button',{name:/购买|购物车/}).count(),0);await page.locator('.bs-stock-detail').getByText('无货',{exact:true}).waitFor();
   await page.getByText(book.stockNote,{exact:true}).waitFor();for(const text of book.description)await page.locator('.bs-detail-panel').getByText(text,{exact:true}).waitFor();
   const fields=await page.locator('.bs-product-info .bs-metadata > div').evaluateAll(rows=>rows.map(r=>[r.querySelector('dt').textContent,r.querySelector('dd').textContent]));
   assert.equal(fields.length,9);assert(fields.some(([label,value])=>label==='ISBN'&&value==='无'));assert(!fields.some(([label])=>/售价|上架|浏览|销量/.test(label)));
   const body=await page.locator('body').innerText();for(const forbidden of ['寄寿留契','四年又十四天','阳契','归籍不可','立即购买','暂无历史留言'])assert(!body.includes(forbidden),forbidden);
   await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0));await page.screenshot({path:`test-results/${book.id}-${port}-1440.png`,fullPage:true});
   const shop=page.locator('.bs-shop h3 a');await shop.click();await page.locator('.bs-shop-home h1').waitFor();assert.equal(new URL(page.url()).hash.split('?')[0],`#/bookstore/shops/${book.sellerId}`);assert.equal(await page.locator(`[data-product-id="${book.id}"]`).count(),1);
   await page.getByRole('link',{name:'返回原搜索结果',exact:true}).click();assert.equal(await page.locator('.bs-search input').inputValue(),'续算杂录');
   // Cover link, forced comments URL, refresh and return are also supported.
   await page.locator(`[data-product-id="${book.id}"] .bs-result-cover`).click();await page.getByRole('link',{name:'返回搜索结果',exact:true}).click();
   await page.goto(base+`#/bookstore/books/${book.id}?q=${encodeURIComponent('续算杂录')}&tab=messages`);await page.reload();assert.equal(await page.getByRole('tab').count(),1);await page.locator('.bs-detail-panel').getByText(book.description[0],{exact:true}).waitFor();
   await page.getByRole('link',{name:'返回搜索结果',exact:true}).click();
  }
  assert.deepEqual(await unrelated(page),initial);
  await submit(page,oldBook.isbn);assert.equal(await page.locator('.bs-result').count(),1);await page.locator('.bs-result-title').click();await page.getByRole('tab',{name:'历史留言',exact:true}).click();await page.locator('.bs-public-message').first().waitFor();assert.equal(await page.locator('.bs-public-message').count(),3);await page.getByText('11:08',{exact:true}).waitFor();
  for(const width of [390,375]){await page.setViewportSize({width,height:844});await page.goto(base+'#/bookstore');await submit(page,'《续算杂录》');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`test-results/xusuan-results-${port}-${width}.png`,fullPage:true});for(const book of group.items){await page.locator(`[data-product-id="${book.id}"] .bs-result-title`).click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.getByRole('link',{name:'返回搜索结果',exact:true}).click();}}
  // The existing embedded site receives the same catalog without web-search index changes.
  await page.setViewportSize({width:1440,height:900});await page.goto(base+'#/game/wechat/linyuan');await page.locator('.wc-chat-item[data-chat-id="flea-market"]').click();await page.getByRole('link',{name:'老庄旧书网',exact:true}).click();await submit(page,'续算杂录');assert.equal(await page.locator('.bs-result').count(),2);await page.locator('[data-product-id="xusuan-yulinzhai-05"] .bs-result-title').click();await page.locator('.bs-stock-detail').waitFor();assert.equal(new URL(page.url()).hash,'#/game/wechat/linyuan');assert.equal((await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY)).sisterReminder2Sent,false);
  await c.close();console.log(`PASS ${port}: 3 query formats, exact ordered products/metadata/stock, title/cover/body navigation, no price/purchase/comments even forced URL, both shop catalogs, return query/reload, old ISBN/comments, desktop/mobile/embedded, unrelated state unchanged`);
 }
 // Author editing only the dedicated JSON updates list and detail; restore in finally.
 const edit=structuredClone(group);edit.items[0].summary='【QA临时】仅修改JSON的列表摘要。';edit.items[0].description.push('【QA临时】仅修改JSON的新增简介段落。');writeFileSync(file,JSON.stringify(edit,null,2)+'\n');validateBookstoreFiles();
 const editContext=await make();const p=await editContext.newPage();await p.goto('http://127.0.0.1:5173/#/bookstore');await submit(p,'续算杂录');await p.getByText(edit.items[0].summary,{exact:true}).waitFor();await p.locator('[data-product-id="xusuan-hermitage-12"] .bs-result-title').click();await p.getByText(edit.items[0].description.at(-1),{exact:true}).waitFor();await editContext.close();assert.deepEqual(errors,[]);console.log('PASS JSON-only summary/paragraph edits, no console/network errors');
}finally{await browser.close();writeFileSync(file,original);validateBookstoreFiles();console.log('RESTORED author catalog JSON');}
