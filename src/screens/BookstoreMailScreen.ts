import {privateBundle,privateContactAvatar} from '../utils/private-commission-content';
import {stableChatFooter} from '../components/StableChatFooter';
import {dialogueSend} from '../components/DialogueSend';
import {hermitageBundle,hermitageReady} from '../utils/hermitage-2025-content';
import {hermitageEntries} from '../../scripts/hermitage-2025-model.mjs';
import {hermitage2025Available,startHermitage2025,advanceHermitage2025,recoverRetiredHermitageRoute,privateCommissionAvailable} from '../state/game-state';
import '../styles/hermitage-2025.css';
import {el} from '../utils/dom';
import {mailUI as ui,mailThreads,mailMessages,bookstoreAccounts,bookstoreMemberName,mailRoute} from '../utils/bookstore-mail-content';
import {getBookstoreContent} from '../utils/bookstore-content';
import {characterData} from '../utils/wechat-content';
import {observeNingHistory} from '../utils/ning-reading-observer';
import {confrontationBundle} from '../utils/sister-confrontation-content';
import {getGameState,selectBookstoreThread,markBookstoreThreadRead,subscribeGameState} from '../state/game-state';

export function BookstoreMailScreen(route:string,go:(route:string)=>void,openLogin:(route:string,button?:HTMLElement)=>void){
 const page=el('section','bs-mail-center');const abort=new AbortController();const params=new URLSearchParams(route.split('?')[1]);const requestedFolder=params.get('folder');const folder=requestedFolder==='sent'?'inbox':requestedFolder??(params.has('thread')?'inbox':'system');const returnFolder=params.get('returnFolder')==='system'?'system':'inbox';let signature='';let stopReading=()=>{};let storyTimer:ReturnType<typeof setTimeout>|undefined;const revision=getGameState().timelineRevision;const signatureFor=()=>JSON.stringify([getGameState().bookstoreMember,getGameState().hermitage2025,hermitage2025Available(),privateCommissionAvailable()]);
 const button=(text:string,fn:()=>void,className='')=>{const b=el('button',className,text);b.type='button';b.onclick=fn;return b;};
 const groupsFor=(id:string)=>mailThreads.groups.filter(g=>g.threadId===id).sort((a,b)=>(a.date+'T'+a.time).localeCompare(b.date+'T'+b.time));
 const avatar=(src:string)=>{const image=el('img','bs-mail-avatar');image.src=import.meta.env.BASE_URL+src.replace(/^\//,'');image.alt='';return image;};
 function render(){
  stopReading();clearTimeout(storyTimer);
  const oldScroll=page.querySelector<HTMLElement>('.bs-mail-scroll');const previous=oldScroll?.scrollTop??0;const wasBottom=!!oldScroll&&oldScroll.scrollHeight-oldScroll.scrollTop-oldScroll.clientHeight<60;
  page.replaceChildren();const member=getGameState().bookstoreMember;signature=signatureFor();const id=member.accountId;
  if(!id){const prompt=el('div','bs-mail-locked');const b=button(ui.title,()=>openLogin(route,b),'bs-member-primary');prompt.append(el('h1','',ui.title),el('p','',ui.loginRequired),b);page.append(prompt);return;}
  const available=mailThreads.items.filter(t=>t.accountId===id);const thread=available.find(t=>t.id===params.get('thread'));const data=getBookstoreContent();
  const layout=el('div','bs-mail-layout');const side=el('aside','bs-mail-sidebar');side.append(el('h1','bs-mail-heading',ui.title));const nav=el('nav');nav.setAttribute('aria-label',ui.navigation);
  for(const item of ui.folders){const b=button(item.label,()=>go(`#/bookstore/mail?${new URLSearchParams({folder:item.id})}`));b.setAttribute('aria-current',String(folder===item.id));nav.append(b);}side.append(nav,el('h2','',ui.contactsHeading));
  for(const t of available){
   const shop=data.sellers.shops.find(s=>s.id===t.shopId)!;const b=button('',()=>go(mailRoute(t.id)+'&returnFolder='+folder),'bs-mail-contact');b.dataset.threadId=t.id;b.setAttribute('aria-current',String(t.id===thread?.id&&folder!=='system'));
   const info=el('span','bs-mail-contact-info');info.append(el('strong','',shop.name));const groups=groupsFor(t.id);const latest=groups.at(-1);const message=mailMessages.items.find(m=>m.id===latest?.messageIds.at(-1));
   const recent=t.id===hermitageBundle.dialogue.threadId?hermitageEntries(getGameState().hermitage2025,hermitageBundle.dialogue).filter((message:{id:string})=>message.id!=='h25-system-entry').at(-1):null;const recentDate=recent?hermitageBundle.dialogue.date:latest?.date;if(recentDate){const time=el('time','',recentDate);time.dateTime=recentDate;info.append(time);}if(recent||t.summary||message)info.append(el('small','',recent?.text??t.summary??message!.text));
   if(t.unread&&!member.readThreadIds.includes(t.id))info.append(el('small','',ui.unread));b.append(avatar(shop.avatar),info);side.append(b);
  }
  if(privateCommissionAvailable()){
   const entry=el('a','bs-mail-contact bs-mail-private-contact');entry.href=hermitageBundle.commission.route;
   const date=hermitageBundle.dialogue.date;
   const time=el('time','',date);time.dateTime=date;
   const info=el('span','bs-mail-contact-info');info.append(el('strong','',privateBundle.ui.ownerName),time,el('small','',hermitageBundle.ui.privateEntry));
   const image=avatar(privateContactAvatar);image.classList.add('private-contact-avatar');
   entry.append(image,info);side.append(entry);
  }
  const reader=el('section','bs-mail-reader');layout.append(side,reader);page.append(layout);
  if(folder==='system'){reader.append(el('p','bs-mail-empty',ui.noSystem));return;}if(!thread){for(const t of available){const shop=data.sellers.shops.find(s=>s.id===t.shopId)!;const entry=button(shop.name,()=>go(mailRoute(t.id)+'&returnFolder=inbox'),'bs-mail-inbox-entry');entry.dataset.inboxThread=t.id;reader.append(entry);}if(!available.length)reader.append(el('p','bs-mail-empty',ui.empty));return;}
  if(route.split('?')[0]==='#/bookstore/private-commission'){
   const c=hermitageBundle.commission;reader.append(el('h1','',c.title));if(privateCommissionAvailable()){reader.append(...c.paragraphs.map(p=>el('p','',p)),el('p','bs-mail-empty',c.pending));}else reader.append(el('p','bs-mail-empty',confrontationBundle.ui.followupLocked));reader.append(button(c.back,()=>go(mailRoute(thread.id))));return;
  }
  const shop=data.sellers.shops.find(s=>s.id===thread.shopId)!;const title=el('header','bs-mail-thread-heading');const heading=el('div');heading.append(el('h2','',shop.name));heading.append(button(ui.backToFolder,()=>go('#/bookstore/mail?folder='+returnFolder),'bs-mail-return'));title.append(avatar(shop.avatar),heading);if(hermitage2025Available()&&thread.id===hermitageBundle.dialogue.threadId)title.append(el('p','bs-mail-era',hermitageBundle.ui.date));reader.append(title);
  const scroll=el('div','bs-mail-scroll');scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label',ui.year.replace('{year}',thread.timeRange));reader.append(scroll);
  const account=bookstoreAccounts.accounts.find(a=>a.id===id)!;let count=0;
  for(const group of groupsFor(thread.id)){
   const rows=group.messageIds.map(messageId=>mailMessages.items.find(m=>m.id===messageId)!);if(!rows.length)continue;
   const block=el('section','bs-mail-group');block.dataset.groupId=group.id;const label=el('h3','bs-mail-group-date');const [year,month,day]=group.date.split('-');const time=el('time','',ui.groupDateFormat.replace('{year}',year).replace('{month}',String(Number(month))).replace('{day}',String(Number(day))).replace('{time}',group.time));time.dateTime=group.date+'T'+group.time+':00+08:00';label.append(time);block.append(label);
   let previousSender='';
   for(const message of rows){
    const self=message.senderId===id;const letter=el('article','bs-mail-letter'+(self?' bs-mail-self':'')+(previousSender===message.senderId?' bs-mail-consecutive':''));letter.dataset.mailId=message.id;letter.dataset.senderId=message.senderId;
    const body=el('div','bs-mail-message-body');body.append(el('span','bs-mail-sender',self?ui.self.replace('{name}',bookstoreMemberName(id)):shop.name),el('p','bs-mail-text',message.text));letter.append(avatar(self?characterData[account.characterId].avatar:shop.avatar),body);block.append(letter);previousSender=message.senderId;count++;
   }scroll.append(block);
  }
  if(thread.id===hermitageBundle.dialogue.threadId&&folder==='inbox'&&hermitage2025Available()){
   const b=hermitageBundle,p=getGameState().hermitage2025;
   if(!hermitageReady(b))scroll.append(el('p','bs-mail-empty',b.ui.pending));else{
    scroll.append(el('h3','bs-mail-group-date',b.ui.date));for(const m of hermitageEntries(p,b.dialogue)){const self=m.speakerId==='linchen';if(m.speakerId==='system'){if(m.id!=='h25-system-entry')scroll.append(el('p','bs-h25-system',m.text));continue;}const row=el('article','bs-mail-letter'+(self?' bs-mail-self':''));row.dataset.h25Id=m.id;const body=el('div','bs-mail-message-body');body.append(el('span','bs-mail-sender',self?bookstoreMemberName(id)+'（我）':shop.name),el('p','bs-mail-text',m.text));row.append(avatar(self?characterData[bookstoreAccounts.accounts.find(a=>a.id===id)!.characterId].avatar:shop.avatar),body);scroll.append(row);}
    const current=b.dialogue.nodes.find(n=>n.nodeId===p.nodeId);if(current?.nodeType==='pause'&&current.text)scroll.append(el('p','bs-h25-system',current.text));
    if(p.stage==='cg')queueMicrotask(()=>{if(page.isConnected)location.hash='/ending/he/payment';});
    if(p.stage==='ending'){const link=el('a','bs-h25-entry',b.ending.finalLabel);link.href='#/endings/he';scroll.append(link);}

    if(p.startedAt===null){const opening=b.dialogue.nodes.flatMap(n=>n.messages??[]).find(m=>m.messageId===b.dialogue.openingMessageId)!;const composer=el('section','bs-h25-choices');const sendOpening=button(opening.text,()=>{sendOpening.disabled=true;void startHermitage2025().catch(()=>{sendOpening.disabled=false;});});sendOpening.dataset.h25Opening=opening.messageId;composer.append(sendOpening);reader.append(composer);}
    const pendingSend=dialogueSend('hermitage',p,b.dialogue);if(pendingSend){const composer=el('section','bs-h25-choices');composer.append(pendingSend);reader.append(composer);}if(p.stage==='chat'&&p.nextAt!==null)storyTimer=setTimeout(()=>void advanceHermitage2025(revision),Math.max(0,p.nextAt-Date.now())+5);
   }
  }
  if(!count)scroll.append(el('p','bs-mail-empty',ui.empty));
  if(hermitage2025Available()&&thread.id===hermitageBundle.dialogue.threadId&&folder==='inbox'){
    const progress=getGameState().hermitage2025;
    if(!reader.querySelector('.bs-h25-choices'))reader.append(el('p','bs-h25-system',progress.startedAt===null?hermitageBundle.ui.awaitingOpening:progress.completedAt===null?hermitageBundle.ui.inProgress:hermitageBundle.ui.conversationComplete));
    stableChatFooter(reader,scroll);
  }else{
    reader.append(el('p','bs-mail-history-note',ui.readonly));
  }
  const restoreScroll=()=>{scroll.scrollTop=wasBottom||(!oldScroll&&hermitage2025Available())?scroll.scrollHeight:previous;};
  if(scroll.isConnected)restoreScroll();
  queueMicrotask(()=>{
    if(abort.signal.aborted||!scroll.isConnected)return;
    if(!oldScroll)restoreScroll();
    if(folder==='inbox')stopReading=observeNingHistory(scroll,thread.id);
  });
  queueMicrotask(()=>{if(page.isConnected){selectBookstoreThread(thread.id);if(count)markBookstoreThreadRead(thread.id);}});
 }
 subscribeGameState(()=>{if(signature!==signatureFor())render();},abort.signal);page.addEventListener('screen-dispose',()=>{stopReading();clearTimeout(storyTimer);abort.abort();});render();
 if(params.get('stage')==='recover'&&params.get('thread')===hermitageBundle.dialogue.threadId){
  queueMicrotask(async()=>{
   if(page.isConnected&&await recoverRetiredHermitageRoute())go(mailRoute(hermitageBundle.dialogue.threadId)+'&stage=followup');
  });
 }
 return page;
}
