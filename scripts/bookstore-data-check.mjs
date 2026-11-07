import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {validateBookstore} from './validate-bookstore.mjs';
const read=n=>JSON.parse(readFileSync('src/content/bookstore/'+n+'.json','utf8'));const data=Object.fromEntries(['site','books','sellers','messages'].map(n=>[n,read(n)]));const ids=Object.keys(JSON.parse(readFileSync('src/content/wechat/characters.json','utf8')));validateBookstore(data,ids);
for(const mutate of [d=>d.books.items.push({...d.books.items[0]}),d=>d.messages.items[0].productId='bad',d=>d.messages.items[1].replyTo='bad',d=>{d.messages.items[0].replyTo=d.messages.items[1].id;d.messages.items[0].timestamp=d.messages.items[1].timestamp},d=>d.books.items[0].images[0].src='file:///C:/cover.png',d=>{d.books.items[0].enabled=true;d.books.items[0].title=null},d=>d.sellers.shops[0].staffIds=['missing'],d=>d.books.items[0].price=-1]){const copy=structuredClone(data);mutate(copy);assert.throws(()=>validateBookstore(copy,ids),/bookstore/);}
console.log('PASS bookstore: valid pending content; duplicate IDs, missing references, cycles, local paths, empty enabled title, bad staff and invalid price rejected');
