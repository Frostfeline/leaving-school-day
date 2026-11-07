import index from '../content/search/search-index.json';
import {getBookstoreContent,bookRoute,type Book} from './bookstore-content';
import {matchesSearch,normalizeIsbn,normalizeSearch} from './search-normalize';
import {forumThread,forumSite,forumRoute} from './forum-content';
import {fortuneSite,FORTUNE_ROUTE} from './fortune-content';
import {searchableArticles,type SearchableArticle} from './wechat-article-content';
import {fictionNovels,fictionSite,fictionSearchTitle,fictionRoute,type Novel} from './fiction-content';
export interface SearchEntry {id:string;kind:string;novelId?:string;bookId?:string;threadId?:string;articleId?:string;title?:string;titleRef?:string;source?:string;sourceRef?:string;summary?:string;keywords:string[];routeId?:string;paragraphs?:string[];badge?:string}
export interface WebResult {entry:SearchEntry;novel?:Novel;book?:Book;article?:SearchableArticle;title:string;source:string;summary:string}
export function resolveWebEntry(entry:SearchEntry):WebResult|undefined {
 if(index.excludedKinds.includes(entry.kind))return;
 const data=getBookstoreContent();const book=entry.bookId?data.books.items.find(b=>b.enabled&&b.id===entry.bookId):undefined;if(entry.bookId&&!book)return;
 if(entry.kind==='fiction-promotion'){const novel=fictionNovels.find(n=>n.id===entry.novelId);if(!novel)return;return {entry,novel,title:fictionSearchTitle(novel),source:fictionSite.name,summary:novel.description};}
 if(entry.kind==='wechat-article'){const article=searchableArticles.find(item=>item.id===entry.articleId);if(!article)return;return {entry,article,title:article.title,source:article.source,summary:article.summary};}
 if(entry.kind==='forum-thread'){if(entry.threadId!==forumThread.id)return;return {entry,title:forumThread.title,source:forumSite.name,summary:entry.summary??''};}
 if(entry.kind==='fortune-match')return {entry,title:entry.title!,source:fortuneSite.name,summary:entry.summary??''};
 return {entry,book,title:book?.title ?? (entry.titleRef==='bookstoreName'?data.site.name:entry.title??''),source:entry.sourceRef==='bookstoreName'?data.site.name:entry.source??'',summary:entry.summary??''};
}
export function searchWeb(query:string){
 const normalized=normalizeSearch(query);
 if(!normalized)return [];
 return (index.entries as SearchEntry[]).map(resolveWebEntry).filter((r):r is WebResult=>!!r).filter(r=>{
  if(r.article?.exactQuery)return normalized===normalizeSearch(r.article.exactQuery);
  if(r.article?.excludedExactQueries?.some(word=>normalizeSearch(word)===normalized))return false;
  return matchesSearch(query,[r.title,r.source,...r.entry.keywords,...(r.novel?.searchKeywords??[]),...(r.article?.keywords??[]),...(r.book?.searchKeywords??[])]) || (!!r.book?.isbn && normalizeIsbn(query)===normalizeIsbn(r.book.isbn));
 });
}
export function webEntry(id:string){const entry=(index.entries as SearchEntry[]).find(e=>e.id===id);return entry?resolveWebEntry(entry):undefined;}
export function webTarget(result:WebResult,query:string){
 if(result.novel)return fictionRoute(result.novel);
 if(result.article)return result.article.route;
 if(result.entry.kind==='fortune-match')return FORTUNE_ROUTE;
 if(result.entry.kind==='forum-thread')return forumRoute(result.entry.threadId!);
 if(result.entry.kind==='bookstore-product')return bookRoute(result.book!.id,query);
 if(result.entry.kind==='website')return '#/bookstore';
 return `#/search/documents/${encodeURIComponent(result.entry.id)}`;
}
