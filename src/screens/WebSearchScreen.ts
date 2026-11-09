import {ContactSearchResults} from '../components/ContactSearchResults';
import {el} from '../utils/dom';
import ui from '../content/wechat/search-ui.json';
import {config} from '../utils/content';
import {searchWeb,webEntry,webTarget} from '../utils/web-search';
import {getBookstoreContent} from '../utils/bookstore-content';
import {FictionPromotionCard} from '../components/FictionPromotionCard';
import '../styles/web-search.css';

export const webSearchRoute=(query='')=>`#/search?${new URLSearchParams({q:query.trim()})}`;
export function WebSearchScreen(route:string){
 const page=el('main','web-search-page');const wrap=el('div','web-search-wrap');const query=new URLSearchParams(route.split('?')[1]).get('q')??'';
 const header=el('header','web-search-header');const home=el('a','web-search-brand',ui.webHeading);home.href=webSearchRoute();const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');for(const [tag,attrs] of [['circle',{cx:'10.5',cy:'10.5',r:'6.5'}],['path',{d:'M16 16l5 5'}]] as const){const part=document.createElementNS(icon.namespaceURI,tag);for(const [key,value] of Object.entries(attrs))part.setAttribute(key,value);icon.append(part);}home.prepend(icon);const back=el('a','web-search-back',ui.backChat);back.href=`#/game/${config.initialModule}/${config.initialConversationId}`;header.append(home,back);wrap.append(header);
 const link=(text:string,target:string)=>{const a=el('a','',text);a.href=new URL(target,location.href).href;a.target='_blank';a.rel='noopener noreferrer';return a;};
 if(route.startsWith('#/search/documents/')){
  let result;try{result=webEntry(decodeURIComponent(route.split('?')[0].slice('#/search/documents/'.length)));}catch{}
  const article=el('article','wc-web-document');if(!result)article.append(el('p','',ui.documentUnavailable));else{
   article.append(el('h1','',result.title),el('p','wc-web-source',ui.sourceLabel.replace('{source}',result.source)),el('p','',result.summary));
   if(result.book){const data=getBookstoreContent();article.append(el('h2','',ui.bibliographyHeading));const list=el('dl','wc-book-metadata');for(const field of ['author','publisher','publishDate','isbn','classification','listPrice'] as const){const raw=result.book[field];if(raw!==null){const row=el('div');row.append(el('dt','',data.site.fields[field]),el('dd','',field==='listPrice'?data.site.priceFormat.replace('{price}',Number(raw).toFixed(2)):String(raw)));list.append(row);}}article.append(list);}
   for(const p of result.entry.paragraphs??[])article.append(el('p','',p));
  }wrap.append(article);
 }else{
  const form=el('form','wc-web-search-form');const input=el('input');input.type='search';input.value=query;input.placeholder=ui.searchLabel;input.setAttribute('aria-label',ui.searchLabel);const submit=el('button','',ui.submit);submit.type='submit';form.append(input,submit);form.onsubmit=e=>{e.preventDefault();location.hash=webSearchRoute(input.value).slice(1);};
  const results=el('section','wc-web-results');results.setAttribute('aria-label',ui.webRegion);results.append(form,el('p','wc-web-query',query.trim()?ui.resultsFor.replace('{query}',query):ui.searchPrompt));
  if(!query.trim()){const guide=el('aside','web-search-guide');guide.append(el('h2','',ui.guide.title),el('p','',ui.guide.intro),el('p','',ui.guide.lead));const list=el('ul');for(const item of ui.guide.items)list.append(el('li','',item));guide.append(list,el('p','',ui.guide.tip));results.append(guide);}
  const contacts=ContactSearchResults(query);if(contacts)results.append(contacts);
  const rows=searchWeb(query);for(const result of rows){if(result.novel){results.append(FictionPromotionCard(result.novel,result.entry.id));continue;}const row=el('article','wc-web-result');row.dataset.resultId=result.entry.id;if(result.entry.badge)row.append(el('span','wc-web-result-badge',result.entry.badge));row.append(link(result.title,webTarget(result,query)),el('p','wc-web-source',ui.sourceLabel.replace('{source}',result.source)),el('p','',result.summary));if(result.book?.isbn)row.append(el('p','wc-web-isbn',`${getBookstoreContent().site.fields.isbn}：${result.book.isbn}`));results.append(row);}
  if(query.trim()&&!rows.length&&!contacts)results.append(el('p','wc-empty',ui.noWebResults));wrap.append(results);
  try{sessionStorage.setItem('web-search:last-query',query);}catch{}
 }
 page.append(wrap);return page;
}
