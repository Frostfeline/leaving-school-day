import {readFileSync,existsSync} from 'node:fs';
export function readArticleFiles(){
 const root='src/content/wechat-article/';const read=name=>{try{return JSON.parse(readFileSync(root+name+'.json','utf8'));}catch(e){throw Error(root+name+'.json: '+e)}};
 return {account:read('account'),meta:read('article-meta'),comments:read('comments'),ui:read('ui'),markdown:readFileSync(root+'article.md','utf8')};
}
export function validateArticle({account,meta,comments,ui,markdown},checkAssets=false){
 const fail=(p,m)=>{throw Error('[content] src/content/wechat-article/'+p+': '+m)};
 const text=(v,p)=>{if(typeof v!=='string'||!v.trim())fail(p,'必须填写文字')};
 const id=(v,p)=>{if(typeof v!=='string'||!/^[-a-z0-9]+$/.test(v))fail(p,'需要稳定英文ID')};
 const unique=(rows,p)=>{if(!Array.isArray(rows)||!rows.length)fail(p,'需要非空数组');const ids=new Set();for(const row of rows){id(row?.id,p+'.id');if(ids.has(row.id))fail(p+'.id','重复ID');ids.add(row.id)}};
 const asset=(v,p)=>{if(typeof v!=='string'||!/^assets\/[a-zA-Z0-9/_-]+\.(svg|png|webp|jpe?g)$/.test(v)||v.includes('..')||(checkAssets&&!existsSync('public/'+v)))fail(p,'需要存在的站内资源路径')};
 if(meta.banner?.src!=null)asset(meta.banner.src,'article-meta.json.banner.src');
 const date=(v,p)=>{if(v!==null&&(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(v)||!Number.isFinite(Date.parse(v))))fail(p,'需要有效日期或待确认的null')};
 id(account.id,'account.json.id');for(const k of ['name','avatarAlt','cancelledTitle','cancelledText'])text(account[k],'account.json.'+k);asset(account.avatar,'account.json.avatar');if(account.status!=='cancelled')fail('account.json.status','当前只支持注销状态');
 if(meta.id!=='borrow-life'||meta.routeId!=='wechat-article-borrow-life')fail('article-meta.json','文章或路由ID无效');if(meta.accountId!==account.id)fail('article-meta.json.accountId','无效公众号引用');for(const k of ['title','summary'])text(meta[k],'article-meta.json.'+k);date(meta.publishedAt,'article-meta.json.publishedAt');if(!Array.isArray(meta.keywords)||!meta.keywords.length||!meta.keywords.every(v=>typeof v==='string'&&v.trim()))fail('article-meta.json.keywords','需要关键词数组');
 text(markdown,'article.md');if(!/^## .+/m.test(markdown))fail('article.md','缺少章节标题');if(/^# /m.test(markdown))fail('article.md','文章标题由article-meta.json提供，请从二级章节开始');
 for(const k of ['back','windowTitle','commentsHeading','commentsReadonly','authorBadge','authorName','confirm','avatarLabel','accountLabel'])text(ui[k],'ui.json.'+k);for(const k of ['authorName','avatarLabel','accountLabel'])if(!ui[k].includes('{name}'))fail('ui.json.'+k,'缺少{name}变量');
 unique(comments.authors,'comments.json.authors');for(const a of comments.authors){if(a.accountId){if(a.accountId!==account.id)fail('comments.json.authors.accountId','无效公众号引用')}else{text(a.name,'comments.json.authors.name');if(a.avatar!==null)asset(a.avatar,'comments.json.authors.avatar');}}
 unique(comments.items,'comments.json.items');for(const c of comments.items){if(!comments.authors.some(a=>a.id===c.authorId))fail('comments.json.'+c.id+'.authorId','无效作者引用');text(c.content,'comments.json.'+c.id+'.content');if(!['blocked','visible'].includes(c.status))fail('comments.json.'+c.id+'.status','无效状态');date(c.timestamp,'comments.json.'+c.id+'.timestamp');if(c.replyTo!==null){const parent=comments.items.find(x=>x.id===c.replyTo);if(!parent||parent.replyTo!==null||parent.id===c.id)fail('comments.json.'+c.id+'.replyTo','回复必须引用顶层留言');}if('originalContent' in c)fail('comments.json.'+c.id,'不存储被屏蔽留言原文');}
}
export function validateArticleFiles(){validateArticle(readArticleFiles(),true);}
