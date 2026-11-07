import {getGameState} from '../state/game-state';
import {hermitageBundle} from './hermitage-2025-content';
import record from '../content/oa-library-record.json';
import books from '../content/bookstore/books.json';
import {characterName} from './wechat-content';
export interface RecordField {id:string;label:string;valueRef?:string;value?:string;emphasis?:boolean;helpId?:string}
export function libraryValue(ref:string):string {
 const data=record.data;const book=books.items.find(b=>b.id===data.bookId);
 switch(ref){
  case 'collectionCode':return data.collectionCode.status==='confirmed' && data.collectionCode.value ? data.collectionCode.value : record.pendingConfirmation;
  case 'originalBorrower':return characterName(data.originalBorrowerId);
  case 'responsiblePerson':return characterName(data.responsiblePersonId);
  case 'bookTitle':return book?.title || record.pendingValue;
  case 'isbn':case 'author':case 'publisher':case 'publishDate':case 'classification':return book?.[ref] || record.pendingValue;
  case 'listPrice':return book?.listPrice===null||book?.listPrice===undefined?record.pendingValue:`¥${book.listPrice.toFixed(2)}`;
  case 'borrowedAt':return data.borrowedAt?new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'long',day:'numeric',timeZone:'Asia/Shanghai'}).format(new Date(data.borrowedAt+'T00:00:00+08:00')):record.pendingValue;
  case 'status':return getGameState().libraryPayment?.status==='completed'?hermitageBundle.cg.settledStatus:data.status;
  case 'amount':case 'matterType':return data[ref];
  default:throw new Error(`oa-library-record.json: unknown valueRef ${ref}`);
 }
}
