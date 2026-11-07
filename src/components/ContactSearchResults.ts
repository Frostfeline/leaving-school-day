import {el} from '../utils/dom';
import {Avatar} from './Avatar';
import {characterData,characterName,contactName,visibleChats} from '../utils/wechat-content';
import {config} from '../utils/content';
import {addKnownContact,getGameState} from '../state/game-state';
import ui from '../content/wechat/search-ui.json';

export function ContactSearchResults(query:string,select?: (id:string)=>void){
 if(!query.trim())return null;
 const contacts=visibleChats(query).filter(chat=>characterData[chat.avatarId].relationship==='friend');
 if(!contacts.length)return null;
 const section=el('section','web-contact-results');section.setAttribute('aria-label',ui.contactsHeading);
 section.append(el('h2','',ui.contactsHeading));
 for(const chat of contacts){
  const person=characterData[chat.avatarId];
  const card=el('a','web-contact-card');card.dataset.contactId=chat.id;
  card.href='#/game/'+config.initialModule+'/'+config.initialConversationId;
  const details=el('span','web-contact-details');
  details.append(el('strong','',contactName(chat.avatarId)),el('span','',ui.contactWechatName.replace('{name}',person.wechatNickname??characterName(chat.avatarId))));
  if(person.wechatId)details.append(el('span','',ui.contactWechatId.replace('{id}',person.wechatId)));
  card.append(Avatar(chat.avatarId),details,el('span','web-contact-status',ui.friendStatus));
  card.onclick=event=>{
   if(select){event.preventDefault();select(chat.id);return;}
   addKnownContact(chat.id);
   sessionStorage.setItem('wechat:timeline',String(getGameState().timelineRevision));
   sessionStorage.setItem('wechat:selected',chat.id);
   sessionStorage.removeItem('wechat:search');
  };
  section.append(card);
 }
 return section;
}
