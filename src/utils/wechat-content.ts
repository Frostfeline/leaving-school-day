import {confrontationBundle} from './sister-confrontation-content';
import presentation from '../content/wechat/presentation.json';
import hidden from '../content/wechat/hidden-contact.json';
import liTianMing from '../content/wechat/chats/li-tian-ming.json';
import luoYao from '../content/wechat/chats/luo-yao.json';
import university from '../content/university.json';
import oa from '../content/oa-login.json';
import { getGameState,sisterConfrontationMessages,secondReminderReplies } from '../state/game-state';
import chats from '../content/wechat/chat-list.json';
import characters from '../content/wechat/characters.json';
import sister from '../content/wechat/chats/sister.json';
import classGroup from '../content/wechat/chats/class-group.json';
import service from '../content/wechat/chats/university-service.json';
import market from '../content/wechat/chats/flea-market.json';
import { config } from './content';
import reminder from '../content/wechat/sister-reminder-2.json';
import {matchesSearch} from './search-normalize';
export interface ChatMessage { id: string; senderId: string; timestamp: string; type: string; text: string; linkLabel?: string; routeId?: string;attachmentId?:string;inlineLinks?:Array<{id:string;text:string;routeId:string}> }
export interface Character {wechatId?:string;wechatNickname?:string;relationship?:string; name?: string; nameRef?: string; chatNameRef?: string; remark?:string; avatar: string }
export const chatMessages: Record<string, { messages: ChatMessage[]; attachments?: Array<{id:string;src?:string|null}> }> = { 'li-tian-ming':liTianMing, 'luo-yao':luoYao, sister, 'class-group': classGroup, 'university-service': service, 'flea-market': market };
export const characterData: Record<string, Character> = characters;
chats.find(c=>c.id==='university-service')!.label=university.serviceName;
characterData['university-service'].name=university.serviceName;
export { chats };
export function characterName(id: string) {
  const character = characterData[id];
  if(character.chatNameRef)return chats.find(chat=>chat.id===character.chatNameRef)!.label;
  return character.nameRef ? config.characters[character.nameRef as keyof typeof config.characters].name : character.name!;
}
export function sortedMessages(contentId: string) {
 const state=getGameState();
 const runtime: ChatMessage[] = contentId === 'university-service' ? state.issuedCodes.map(auth=>({id:'oa-code-'+auth.issuedAt,senderId:'university-service',timestamp:storyTimestamp(auth.issuedAt),type:'text',text:oa.messageTemplate.replace('{code}',auth.code)})) : [];
 if(contentId===chats.find(c=>c.id===reminder.chatId)?.contentId && state.sisterReminder2Sent && state.sisterReminder2SentAt!==null){
  const add=(m:{id:string;senderId:string;text:string},at:number)=>runtime.push({...m,type:'text',timestamp:storyTimestamp(at)});
  reminder.messages.forEach((m,i)=>add(m,state.sisterReminder2SentAt!+i));const dialogue=state.sisterConversation;
  if(dialogue?.introReplyAt!==null&&dialogue?.introReplyAt!==undefined)add({...reminder.initialReply,id:reminder.initialReply.messageId},dialogue.introReplyAt);
  if(dialogue?.questionSentAt!==null&&dialogue?.questionSentAt!==undefined)add(reminder.question,dialogue.questionSentAt);
  const choice=reminder.detailReplies.find(r=>r.id===dialogue?.choiceId);if(choice&&dialogue?.choiceAt!==null&&dialogue?.choiceAt!==undefined)add({...choice,id:choice.messageId},dialogue.choiceAt);
  if(dialogue?.typingUntil!==null&&dialogue?.typingUntil!==undefined)secondReminderReplies(dialogue).slice(0,dialogue.commonRepliesSent).forEach((m,i)=>add(m,dialogue.typingUntil!+i*presentation.newMessageIntervalMs));
 }
 if(contentId===chats.find(c=>c.id===reminder.chatId)?.contentId)runtime.push(...sisterConfrontationMessages().map(m=>({id:m.id,senderId:m.speakerId,timestamp:storyTimestamp(Date.parse(m.timestamp)),type:m.type,text:m.text,...(m.attachmentId?{attachmentId:m.attachmentId}:{})})));
 const original=chatMessages[contentId].messages;
 let base=contentId==='sister'?original.filter((m,i)=>i<2?i<state.opening.received:state.opening.replySent):original;
 if(contentId==='sister'){
  const known=[...original,...reminder.messages,reminder.initialReply,...reminder.detailReplies,...confrontationBundle.dialogue.nodes.flatMap(n=>n.options??[])];
  for(const saved of state.wechatReplies){if(base.some(m=>m.id===saved.id)||runtime.some(m=>m.id===saved.id))continue;const authored=known.find(m=>('messageId'in m?m.messageId:m.id)===saved.id);const restored:ChatMessage={id:saved.id,senderId:saved.senderId,timestamp:storyTimestamp(saved.at),type:'text',text:authored?.text??saved.text};if(saved.sourceChoiceId===presentation.opening.replyId)base=[...base,restored];else runtime.push(restored);}
 }
 // Preserve authored order within shared timestamp groups. Runtime IDs keep their real issuance time.
 return [...base].sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp)).concat(runtime);
}
export function messageTime(timestamp: string) {
  if(timestamp.length===10)return '';
  return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Shanghai' }).format(new Date(timestamp));
}

export function historyMessageTime(timestamp:string){
 const date=new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'long',day:'numeric',timeZone:'Asia/Shanghai'}).format(new Date(timestamp));
 return [date,messageTime(timestamp)].filter(Boolean).join(' ');
}
export {hidden};
export function contactName(id:string){return characterData[id]?.remark || characterName(id);}
export function searchableChats(){return [...chats,{...hidden,label:contactName(hidden.avatarId)}];}
export function visibleChats(search='') {
 const query=search.trim();
 if(query)return searchableChats().filter(chat=>matchesSearch(query,[chat.label,characterName(chat.avatarId),characterData[chat.avatarId].wechatNickname??'']));
 const state=getGameState();
 return searchableChats().filter(chat=>{
  if(chat.id===hidden.id)return state.addedLuoYao;
  if(chat.id==='litianming')return state.addedLiTianMing;
  return true;
 });
}
export function searchChatMessages(query:string){
 return searchableChats().flatMap(chat=>sortedMessages(chat.contentId).filter(message=>matchesSearch(query,[message.text,message.linkLabel??''])).map(message=>({chat,message})));
}

/** Story-time display only. Authentication IDs, validity and saved runtime times remain unchanged. */
export function storyTimestamp(at:number){
 const clock=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,timeZone:'Asia/Shanghai'}).format(new Date(at));
 return presentation.storyDate+'T'+clock+'+08:00';
}
export function showMessageTime(timestamp:string,lastDisplayed:string){
 if(!lastDisplayed)return true;
 return timestamp.slice(0,10)!==lastDisplayed.slice(0,10)||Date.parse(timestamp)-Date.parse(lastDisplayed)>=presentation.timeSeparatorMs;
}
export function sisterUnreadCount(){const s=getGameState(),d=s.sisterConversation,incoming=new Set(sisterConfrontationMessages().filter(m=>m.speakerId==='linyuan').map(m=>m.id));return Math.max(0,s.opening.received-s.opening.readCount)+Number(s.sisterReminder2Sent&&!s.sisterReminder2Read)+(d?Number(d.questionSentAt!==null&&!d.questionRead)+Math.max(0,d.commonRepliesSent-d.readReplyCount):0)+s.sisterConfrontation3.emitted.filter(m=>!s.sisterConfrontation3.readIncomingIds.includes(m.id)&&incoming.has(m.id)).length;}
