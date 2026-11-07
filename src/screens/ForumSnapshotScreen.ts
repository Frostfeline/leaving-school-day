import {el} from '../utils/dom';
import {forumSite as ui,forumUsers,forumThread as thread,forumRoute,forumRouteId,forumTime,forumQuote,type ForumBlock} from '../utils/forum-content';
import {routes,routeUrl} from '../utils/routes';
import '../styles/forum.css';
import '../styles/forum-header.css';

export function ForumSnapshotScreen(route:string,navigate?:(route:string)=>void){
 const page=el('main','forum-page');const wrap=el('div','forum-wrap');page.append(wrap);let disposed=false;
 const image=(src:string,alt:string,className:string)=>{const img=el('img',className);img.src=import.meta.env.BASE_URL+src;img.alt=alt;return img;};
 const dialog=el('dialog','forum-closed-dialog');dialog.setAttribute('aria-labelledby','forum-closed-title');
 const dialogHead=el('header','forum-dialog-head');const dialogTitle=el('h2','',ui.closedDialog.title);dialogTitle.id='forum-closed-title';const close=el('button','forum-dialog-close','×');close.type='button';close.setAttribute('aria-label',ui.closedDialog.close);close.onclick=()=>dialog.close();dialogHead.append(dialogTitle,close);
 const dialogBody=el('div','forum-dialog-body');dialogBody.append(...ui.closedDialog.paragraphs.map(p=>el('p','',p)));const confirm=el('button','forum-dialog-confirm',ui.closedDialog.confirm);confirm.type='button';confirm.onclick=()=>dialog.close();dialogBody.append(confirm);dialog.append(dialogHead,dialogBody);page.append(dialog);
 let trigger:HTMLElement|undefined;let scrolls:{node:HTMLElement;top:number;left:number}[]=[];let windowTop=0,windowLeft=0;
 const restore=()=>{if(disposed)return;for(const s of scrolls){s.node.scrollTop=s.top;s.node.scrollLeft=s.left;}window.scrollTo(windowLeft,windowTop);};
 const showClosed=(target:HTMLElement)=>{if(dialog.open)return;trigger=target;windowTop=window.scrollY;windowLeft=window.scrollX;scrolls=[];for(let parent=target.parentElement;parent;parent=parent.parentElement){if(parent.scrollHeight>parent.clientHeight||parent.scrollWidth>parent.clientWidth)scrolls.push({node:parent,top:parent.scrollTop,left:parent.scrollLeft});}dialog.showModal();confirm.focus({preventScroll:true});restore();};
 dialog.addEventListener('close',()=>{if(disposed)return;trigger?.focus({preventScroll:true});restore();});
 page.addEventListener('screen-dispose',()=>{disposed=true;if(dialog.open)dialog.close();});
 const closedButton=(label:string,id:string,className='')=>{const b=el('button',className,label);b.type='button';b.dataset.forumAction=id;b.onclick=()=>showClosed(b);return b;};
 const branding=el('header','forum-branding');branding.style.backgroundImage=`url("${import.meta.env.BASE_URL+ui.headerBackground}")`;const brand=closedButton('', 'brand','forum-brand');const wordmark=el('span','forum-wordmark');wordmark.append(el('span','',ui.name),el('span','forum-description',ui.description));brand.append(image(ui.logo,ui.logoAlt,'forum-logo'),wordmark);const identity=el('div','forum-identity');identity.append(brand);const stamp=el('div','forum-snapshot');stamp.append(el('strong','',ui.snapshotLabel));const accounts=el('div','forum-accounts');for(const action of ui.accountActions)accounts.append(closedButton(action.label,action.id));branding.append(identity,stamp);wrap.append(branding);
 const nav=el('nav','forum-nav');nav.setAttribute('aria-label',ui.navigationLabel);for(const item of ui.navigation)nav.append(closedButton(item.label,item.id));nav.append(accounts);wrap.append(nav,el('p','forum-closed-notice',ui.closedNotice));
 if(forumRouteId(route)!==thread.id){wrap.append(el('p','forum-not-found',ui.labels.notFound));return page;}
 const breadcrumb=el('nav','forum-breadcrumb');breadcrumb.append(closedButton(ui.name,'breadcrumb-forum'),el('span','','›'),closedButton(thread.board.name,'breadcrumb-board'));wrap.append(breadcrumb);
 const title=el('section','forum-thread-heading');title.append(el('h1','',thread.title));const author=forumUsers.users.find(u=>u.id===thread.authorId)!;const starter=thread.posts.find(p=>p.id===thread.starterPostId)!;
 const meta=el('div','forum-thread-meta');
 meta.append(el('span','',ui.labels.author.replace('{name}',author.name)),el('span','',ui.labels.postedAt.replace('{time}',forumTime(starter.timestamp))),el('span','',ui.labels.replies.replace('{count}',String(thread.posts.filter(p=>p.id!==thread.starterPostId).length))));
 if(thread.views!==null)meta.append(el('span','',ui.labels.views.replace('{count}',String(thread.views))));
 title.append(meta);wrap.append(title);
 const actionBar=el('div','forum-actions');for(const action of ui.threadActions)actionBar.append(closedButton(action.label,action.id,'forum-action-button'));
 const jump=el('select','forum-jump');jump.setAttribute('aria-label',ui.labels.jump);const empty=el('option','',ui.labels.jump);empty.value='';jump.append(empty);for(const post of [...thread.posts].sort((a,b)=>a.floor-b.floor)){const option=el('option','',ui.labels.floor.replace('{floor}',String(post.floor)));option.value=post.id;jump.append(option);}jump.onchange=()=>{if(jump.value)page.querySelector<HTMLElement>(`[data-forum-post-id="${jump.value}"]`)?.scrollIntoView({block:'start'});};actionBar.append(jump);wrap.append(actionBar);
 const posts=el('section','forum-posts');
 for(const post of thread.posts){
  const user=forumUsers.users.find(u=>u.id===post.authorId)!;const article=el('article','forum-post');article.id=`forum-${post.id}`;article.dataset.forumPostId=post.id;article.dataset.floor=String(post.floor);
  const profile=el('aside','forum-profile');const name=closedButton(user.name,`user-${user.id}`,'forum-user-name');profile.append(name);if(user.id===thread.authorId)profile.append(el('span','forum-starter',ui.labels.starter));const avatar=closedButton('',`avatar-${user.id}`,'forum-avatar-button');avatar.append(image(user.avatar,ui.labels.avatar.replace('{name}',user.name),'forum-avatar'));profile.append(avatar);
  for(const [key,label]of [['registeredAt',ui.labels.registered],['level',ui.labels.level],['postCount',ui.labels.postCount]] as const)if(user[key]!==null)profile.append(el('p','forum-user-meta',label.replace('{value}',String(user[key]))));
  const body=el('div','forum-post-body');const postHead=el('header','forum-post-head');const time=el('time','',forumTime(post.timestamp));time.dateTime=post.timestamp;const floor=el('a','forum-floor',ui.labels.floor.replace('{floor}',String(post.floor)));floor.href=forumRoute(thread.id)+`?floor=${post.floor}`;floor.onclick=e=>{e.preventDefault();article.scrollIntoView({block:'start'});};postHead.append(time,floor);body.append(postHead);
  const text=el('div','forum-post-text');for(const block of post.content as ForumBlock[]){if(typeof block==='string')text.append(el('p','',block));else if(block.type==='quote')text.append(el('blockquote','',forumQuote(block)));else{const a=el('a','forum-resource-link',block.label);a.href=routeUrl(block.targetId);if(block.targetId==='oa-login'){a.target='_blank';a.rel='noopener noreferrer';}else if(navigate)a.onclick=e=>{e.preventDefault();navigate(routes[block.targetId]);};text.append(a);}}body.append(text);article.append(profile,body);posts.append(article);
 }wrap.append(posts);
 const quick=el('section','forum-quick-reply');quick.append(el('h2','',ui.quickReply.title));const inputWrap=el('div','forum-reply-input');const input=el('textarea');input.disabled=true;input.placeholder=ui.quickReply.placeholder;input.setAttribute('aria-label',ui.quickReply.placeholder);const inputOverlay=closedButton('', 'quick-reply-input','forum-reply-overlay');inputOverlay.setAttribute('aria-label',ui.quickReply.openLabel);inputWrap.append(input,inputOverlay);const submit=closedButton(ui.quickReply.submit,'quick-reply-submit','forum-reply-submit');submit.setAttribute('aria-disabled','true');quick.append(inputWrap,submit);wrap.append(quick,el('footer','forum-footer',ui.labels.footer));
 queueMicrotask(()=>{if(disposed||!page.isConnected)return;const floor=new URLSearchParams(route.split('?')[1]).get('floor');if(floor&&/^\d+$/.test(floor))page.querySelector<HTMLElement>(`[data-floor="${Number(floor)}"]`)?.scrollIntoView({block:'start'});});
 return page;
}
