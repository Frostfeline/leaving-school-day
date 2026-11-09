import {markResearchOpened} from '../state/game-state';
import {el} from '../utils/dom';
import {articleAccount as account,articleMeta as meta,articleComments as comments,articleUI as ui,articleMarkdown as markdown,admissionNotice} from '../utils/wechat-article-content';
import {articleMarkdown,appendArticleInline} from '../utils/article-markdown';
import {config} from '../utils/content';
import university from '../content/university.json';
import '../styles/wechat-article.css';

function articlePage(title:string,onBack:()=>void){
 const page=el('main','wa-page');
 const bar=el('header','wa-window-bar');
 const back=el('button','wa-back',ui.back);
 back.type='button';back.onclick=onBack;
 bar.append(back,el('span','',ui.windowTitle));
 const article=el('article','wa-article');
 const heading=el('h1','wa-title');appendArticleInline(heading,title);article.append(heading);
 page.append(bar,article);
 return {page,article};
}

export function WeChatArticleScreen(onBack?:()=>void,embedded=false){
 const {page,article}=articlePage(meta.title,onBack??(()=>{location.hash='/game/'+config.initialModule+'/'+config.initialConversationId;}));
 requestAnimationFrame(()=>{if(page.isConnected)markResearchOpened('borrow-life');});
 let disposed=false;
 const dialog=el('dialog','wa-account-dialog');dialog.setAttribute('aria-labelledby','wa-cancelled-title');const title=el('h2','',account.cancelledTitle);title.id='wa-cancelled-title';const confirm=el('button','',ui.confirm);confirm.type='button';confirm.onclick=()=>dialog.close();dialog.append(title,el('p','',account.cancelledText),confirm);page.append(dialog);
 let trigger:HTMLElement|undefined;let windowTop=0;let positions:{node:HTMLElement;top:number;left:number}[]=[];
 const restore=()=>{if(disposed)return;window.scrollTo({top:windowTop,behavior:'instant'});for(const p of positions){p.node.scrollTop=p.top;p.node.scrollLeft=p.left;}};
 function showCancelled(target:HTMLElement){trigger=target;windowTop=scrollY;positions=[];for(let n=target.parentElement;n;n=n.parentElement)if(n.scrollHeight>n.clientHeight||n.scrollWidth>n.clientWidth)positions.push({node:n,top:n.scrollTop,left:n.scrollLeft});dialog.showModal();confirm.focus({preventScroll:true});restore();}
 dialog.addEventListener('close',()=>{if(disposed)return;trigger?.focus({preventScroll:true});restore();});
 page.addEventListener('screen-dispose',()=>{disposed=true;if(dialog.open)dialog.close();});
 const accountButton=(withAvatar=false)=>{const button=el('button',withAvatar?'wa-account-avatar':'wa-account-name');button.type='button';button.setAttribute('aria-label',ui.accountLabel.replace('{name}',account.name));if(withAvatar){const image=el('img');image.src=import.meta.env.BASE_URL+account.avatar;image.alt=account.avatarAlt;button.append(image);}else button.textContent=account.name;button.onclick=()=>showCancelled(button);return button;};
 const info=el('div','wa-meta');info.append(accountButton(true),accountButton());if(meta.publishedAt!==null){const time=el('time','wa-date',String(meta.publishedAt));time.dateTime=String(meta.publishedAt);info.append(time);}article.append(info);const banner=el('div','wa-banner');banner.style.aspectRatio=meta.banner.aspectRatio;if(meta.banner.src){const image=el('img');image.src=import.meta.env.BASE_URL+String(meta.banner.src).replace(/^\//,'');image.alt=meta.banner.alt;banner.append(image);}else banner.setAttribute('aria-hidden','true');article.append(banner,articleMarkdown(markdown));
 const footerAccount=el('footer','wa-article-footer');footerAccount.append(accountButton());article.append(footerAccount);
 const section=el('section','wa-comments');section.setAttribute('aria-labelledby','wa-comments-heading');const commentHeading=el('h2','',ui.commentsHeading);commentHeading.id='wa-comments-heading';section.append(commentHeading,el('p','wa-readonly',ui.commentsReadonly));
 type Comment=typeof comments.items[number];
 function renderComment(comment:Comment){
  const author=comments.authors.find(a=>a.id===comment.authorId)! as {id:string;name?:string;accountId?:string;avatar?:string|null};const isAuthor=author.accountId===meta.accountId;const name=isAuthor?account.name:author.name!;
  const row=el('article',comment.replyTo?'wa-comment wa-reply':'wa-comment');row.dataset.commentId=comment.id;row.dataset.status=comment.status;
  const avatar=isAuthor?accountButton(true):el('div','wa-reader-avatar');if(!isAuthor){const label=ui.avatarLabel.replace('{name}',name);if(author.avatar){const img=el('img');img.src=import.meta.env.BASE_URL+author.avatar;img.alt=label;avatar.classList.add('wa-custom-avatar');avatar.append(img);}else{avatar.setAttribute('role','img');avatar.setAttribute('aria-label',label);}}row.append(avatar);
  const body=el('div','wa-comment-body');const byline=el('header','wa-comment-byline');if(isAuthor){const a=accountButton();a.textContent=ui.authorName.replace('{name}',account.name);byline.append(a);}else byline.append(el('span','wa-comment-name',name));body.append(byline,el('p','wa-comment-text',comment.content));if(comment.timestamp!==null){const time=el('time','',String(comment.timestamp));time.dateTime=String(comment.timestamp);body.append(time);}for(const reply of comments.items.filter(c=>c.replyTo===comment.id))body.append(renderComment(reply));row.append(body);return row;
 }
 for(const comment of comments.items.filter(c=>c.replyTo===null))section.append(renderComment(comment));article.append(section);
 if(embedded)page.classList.add('wa-embedded');
 return page;
}

export function DonglanAdmissionScreen(){
 const notice=admissionNotice;
 const {page,article}=articlePage(notice.title,()=>{location.hash='/search?'+new URLSearchParams({q:notice.exactQuery});});
 const info=el('div','wa-meta');
 const avatar=el('span','wa-account-avatar wa-publisher-avatar');
 const emblem=el('img');emblem.src=import.meta.env.BASE_URL+university.emblem;emblem.alt=university.emblemAlt;
 avatar.append(emblem);info.append(avatar,el('span','wa-account-name wa-publisher-name',university.name));

 const body=el('div','wa-article-body wa-admission-body');
 body.append(el('p','',notice.summary),el('p','wa-notice-period',notice.noticePeriod));
 const list=el('ol');
 for(const requirement of notice.requirements)list.append(el('li','',requirement));
 const roster=el('section','wa-admission-roster');
 const label=el('h2','',notice.admittedLabel);
 const names=el('ul');
 for(const name of notice.admitted)names.append(el('li','',name));
 roster.append(label,names);body.append(list,roster);
 article.append(info,body);
 return page;
}
