import {showChatImage} from './ChatImagePreview';
import {confrontationBundle} from '../utils/sister-confrontation-content';
import type {ConfrontationBundle} from '../utils/sister-confrontation-content';
export function showSisterManuscript(parent:HTMLElement,id:string,onViewed:()=>void,bundle:ConfrontationBundle=confrontationBundle){
 const attachment=bundle.attachments.items.find(item=>item.id===id);
 if(attachment)showChatImage(parent,attachment,onViewed,bundle.ui);
}
