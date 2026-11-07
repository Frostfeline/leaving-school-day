import {readFileSync,existsSync} from 'node:fs';
export function readFictionFiles(){const read=name=>{try{return JSON.parse(readFileSync('src/content/fiction/'+name+'.json','utf8'))}catch(e){throw Error('src/content/fiction/'+name+'.json: '+e)}};return {site:read('site'),novels:read('novels')};}
export function validateFiction({site,novels},checkAssets=false){
 const fail=(p,m)=>{throw Error('[content] src/content/fiction/'+p+': '+m)};
 const text=(v,p)=>{if(typeof v!=='string'||!v.trim())fail(p,'需要填写文字')};
 for(const key of ['name','subtitle','promotionBadge','promotionFormat','searchTitleFormat','pageTitleFormat','descriptionHeading','viewWork'])text(site[key],'site.json.'+key);
 for(const [key,token]of [['promotionFormat','{site}'],['promotionFormat','{column}'],['searchTitleFormat','{title}'],['pageTitleFormat','{title}'],['pageTitleFormat','{site}']])if(!site[key].includes(token))fail('site.json.'+key,'缺少变量 '+token);
 if(!Array.isArray(novels.items)||!novels.items.length)fail('novels.json.items','需要非空作品数组');const ids=new Set(),routes=new Set();
 for(const n of novels.items){const path='novels.json.'+n.id;if(typeof n.id!=='string'||!/^[-a-z0-9]+$/.test(n.id)||ids.has(n.id))fail(path+'.id','需要唯一稳定ID');ids.add(n.id);if(n.routeId!=='fiction-changdu'||routes.has(n.routeId))fail(path+'.routeId','未注册或重复路由');routes.add(n.routeId);
  for(const key of ['promotionLabel','title','genre','detailGenre','description','coverAlt'])text(n[key],path+'.'+key);
  if(typeof n.coverImage!=='string'||!/^assets\/[a-zA-Z0-9/_-]+\.(svg|webp|png|jpg|jpeg)$/.test(n.coverImage)||n.coverImage.includes('..')||(checkAssets&&!existsSync('public/'+n.coverImage)))fail(path+'.coverImage','需要存在的站内图片路径');
  if(!Array.isArray(n.searchKeywords)||!n.searchKeywords.length||!n.searchKeywords.every(k=>typeof k==='string'&&k.trim()))fail(path+'.searchKeywords','需要关键词数组');
  if(typeof n.isSponsored!=='boolean')fail(path+'.isSponsored','需要布尔值');if(n.hasReadableContent!==false)fail(path+'.hasReadableContent','本阶段不支持小说正文');
 }
}
export function validateFictionFiles(){validateFiction(readFictionFiles(),true);}
