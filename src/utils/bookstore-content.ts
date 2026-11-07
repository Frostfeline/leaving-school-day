import site from '../content/bookstore/site.json';
import books from '../content/bookstore/books.json';
import fragments from '../content/bookstore/xusuan-zalu.json';
import sellers from '../content/bookstore/sellers.json';
import messages from '../content/bookstore/messages.json';
import {characterName} from './wechat-content';
import {normalizeIsbn,normalizeSearch,matchesSearch} from './search-normalize';
export interface BookImage {id:string;src:string;alt:string;placeholder?:boolean;watermark?:string}
export interface BookField {id:string;label:string;valueRef?:string;value?:string}
export interface Book {id:string;enabled:boolean;dataStatus:string;title:string|null;isbn:string|null;author:string|null;publisher:string|null;publishYear:number|null;publishDate:string|null;listPrice:number|null;classification:string|null;binding:string|null;condition:string|null;price:number|null;status:string;sellerId:string;listedAt:string|null;searchKeywords:string[];images:BookImage[];description:string[];conditionParagraphs:string[];versionParagraphs:string[];priceText?:string;listPriceText?:string;paper?:string;volumeCount?:string;category?:string;bookGroupId?:string;era?:string;copyEra?:string;edition?:string;extent?:string;summary?:string;metadata?:BookField[];resultFieldIds?:string[];resultFieldLabels?:Record<string,string>;stockNote?:string;detailHeading?:string;copyScope?:string;features?:{comments:boolean;purchase:boolean;showPrice:boolean;imageViewer:boolean;shopLink:boolean}}
export interface Seller {id:string;name:string;avatar:string;avatarAlt:string;paragraphs:string[];staffIds:string[];levelDiamonds?:number;statistics?:string[];accountStatus?:string;statusText?:string}
export interface MessageAuthor {id:string;name?:string;characterId?:string;shopId?:string;role?:string;publicNameRef?:string}
export interface PublicMessage {id:string;productId:string;authorId:string;timestamp:string|null;relativeTimeRef?:string;displayTime?:string;order?:number;text:string;replyTo:string|null}
export interface BookstoreContent {site:typeof site;books:{items:Book[]};sellers:{shops:Seller[];authors:MessageAuthor[]};messages:{items:PublicMessage[]}}
const base:BookstoreContent={site,books:{items:[...books.items,...fragments.items]},sellers,messages};let draft:BookstoreContent|undefined;
export function getEditableBookstoreContent():BookstoreContent{return structuredClone(base);}
export function getBookstoreContent(){return import.meta.env.DEV && draft?draft:base;}
export function setBookstoreDraft(data?:BookstoreContent){if(import.meta.env.DEV)draft=data;}
export const isbnKey=normalizeIsbn;
export const normalizeBookQuery=(query:string)=>normalizeSearch(query).replace(/[《》]/g,'').trim();
export function searchBooks(query:string){const q=normalizeBookQuery(query);if(!q)return [];return getBookstoreContent().books.items.filter(book=>book.enabled && (matchesSearch(q,[book.title??'',...book.searchKeywords].map(normalizeBookQuery)) || (!!book.isbn && isbnKey(book.isbn)===isbnKey(q))));}
export function bookStatus(book:Book){const ui=getBookstoreContent().site;return book.status==='out-of-stock'?ui.outOfStock:ui.sold;}
export function bookFieldValue(book:Book,field:BookField){if(field.valueRef==='status')return bookStatus(book);if(field.valueRef==='sellerName')return getBookstoreContent().sellers.shops.find(s=>s.id===book.sellerId)!.name;return field.valueRef?String((book as unknown as Record<string,unknown>)[field.valueRef]??getBookstoreContent().site.pending):field.value!;}
export function bookAuthor(id:string){const a=getBookstoreContent().sellers.authors.find(a=>a.id===id)!;return a.characterId?characterName(a.characterId):a.name!;}
export function publicBookAuthor(id:string){const data=getBookstoreContent();const a=data.sellers.authors.find(a=>a.id===id)!;return a.publicNameRef==='shop'?data.sellers.shops.find(s=>s.id===a.shopId)!.name:bookAuthor(id);}
export function publicMessageTime(message:PublicMessage){if(message.relativeTimeRef)return String((getBookstoreContent().site as unknown as Record<string,string>)[message.relativeTimeRef]);return message.timestamp?new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Shanghai'}).format(new Date(message.timestamp)):message.displayTime!;}
export function sortPublicMessages(rows:PublicMessage[]){const positions=new Map(rows.map((m,i)=>[m.id,i]));return [...rows].sort((a,b)=>a.timestamp&&b.timestamp?Date.parse(a.timestamp)-Date.parse(b.timestamp):(a.order??positions.get(a.id)!)-(b.order??positions.get(b.id)!));}
export function bookRoute(id:string,query='',tab='details'){return `#/bookstore/books/${encodeURIComponent(id)}?${new URLSearchParams({q:query,tab})}`;}
export function searchRoute(query:string){return `#/bookstore/search?${new URLSearchParams({q:query})}`;}
export function shopRoute(id:string,query=''){return `#/bookstore/shops/${encodeURIComponent(id)}?${new URLSearchParams({q:query})}`;}

export function exportBookstoreFile(data:BookstoreContent,key:string){if(key==='books')return {items:data.books.items.filter(b=>b.bookGroupId!=='xusuan-zalu')};if(key==='xusuan-zalu')return {bookGroupId:'xusuan-zalu',items:data.books.items.filter(b=>b.bookGroupId==='xusuan-zalu')};return data[key as keyof BookstoreContent];}
