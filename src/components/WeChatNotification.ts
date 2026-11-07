import {el,plainText} from '../utils/dom';
import {getGameState,subscribeGameState,sisterConfrontationMessages} from '../state/game-state';
import {chats,sisterUnreadCount} from '../utils/wechat-content';
import reminder from '../content/wechat/sister-reminder-2.json';
import ui from '../content/wechat/desktop-notification.json';
import '../styles/wechat-notification.css';

function icon(){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 32 32');svg.setAttribute('aria-hidden','true');
 for(const [tag,attrs] of [['path',{d:'M4 5h16a6 6 0 0 1 6 6v6a6 6 0 0 1-6 6h-7l-6 4 1-5a6 6 0 0 1-4-6z',fill:'currentColor'}],['circle',{cx:'11',cy:'13',r:'1.6',fill:'white'}],['circle',{cx:'20',cy:'13',r:'1.6',fill:'white'}]] as const){const n=document.createElementNS(svg.namespaceURI,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);svg.append(n);}return svg;
}

/** Observe actual delivery transitions, never replay a saved delivery on mount. */
export function startWeChatNotification(){
 const layer=el('aside','game-wechat-notifications');layer.setAttribute('aria-label',ui.appName);
 const toast=el('div','game-wechat-toast');toast.hidden=true;
 const text=el('span','game-wechat-toast-copy');text.setAttribute('role','status');text.append(el('span','game-wechat-toast-app',ui.appName),el('strong','',chats.find(c=>c.id===reminder.chatId)!.label));
 text.append(el('span','game-wechat-preview',plainText(reminder.messages[0].text)));toast.append(icon(),text,el('span','game-wechat-time',ui.justNow));
 const close=el('button','game-wechat-toast-close','×');close.type='button';close.setAttribute('aria-label',ui.close);close.onclick=()=>{toast.hidden=true;};toast.append(close);
 layer.append(toast);document.body.append(layer);
 let previous=getGameState();
 const allowed=()=>!location.hash.includes('editor')&&!location.hash.startsWith('#/dev/')&&!/^#\/endings?\//.test(location.hash)&&!getGameState().ending&&location.hash!==''&&location.hash!=='#/';
 const update=()=>{
  const state=getGameState();const sameTimeline=state.timelineRevision===previous.timelineRevision;const oldIds=new Set(previous.sisterConfrontation3.emitted.map(m=>m.id));const newMessages=sameTimeline?sisterConfrontationMessages().filter(m=>m.speakerId==='linyuan'&&!oldIds.has(m.id)):[];const reminderDelivered=sameTimeline&&!previous.sisterReminder2Sent&&state.sisterReminder2Sent;const delivered=reminderDelivered||newMessages.length>0;previous=state;if(delivered){const preview=toast.querySelector('.game-wechat-preview');if(preview)preview.textContent=plainText(newMessages.at(-1)?.text??reminder.messages[0].text);}
  const count=sisterUnreadCount();layer.hidden=!allowed();
  const chat=document.querySelector<HTMLElement>('.wc-window');const sisterVisible=!document.hidden&&document.hasFocus()&&chat?.dataset.conversationId===reminder.chatId&&!chat.classList.contains('wc-show-list');
  if(!sameTimeline)toast.hidden=true;
  if(delivered&&count&&!sisterVisible&&!document.hidden&&!layer.hidden)toast.hidden=false;
 };
 subscribeGameState(update);window.addEventListener('hashchange',()=>queueMicrotask(update));document.addEventListener('visibilitychange',update);window.addEventListener('wechat-chat-selected',update);update();
 return ()=>layer.remove();
}
