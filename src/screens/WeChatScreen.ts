import {appendWeChatText} from '../components/WeChatEmoji';
import {ContactSearchResults} from '../components/ContactSearchResults';
import {dialogueSend} from '../components/DialogueSend';
import {showPdfPreview} from '../components/PdfPreview';
import presentation from '../content/wechat/presentation.json';
import {appendLinkedText,messagePlaybackState} from '../utils/wechat-playback';
import {sisterUnreadCount} from '../utils/wechat-content';
import {advanceOpening,nextOpeningAt,chooseOpeningReply,markOpeningRead,serviceUnreadCount} from '../state/game-state';
import {showMessageTime,chatMessages} from '../utils/wechat-content';
import {plainText} from '../utils/dom';
import {confrontationBundle} from '../utils/sister-confrontation-content';
import {chooseSisterConfrontation,hasUnreadConfrontation,markConfrontationRead,viewSisterManuscript} from '../state/game-state';
import {chatImageButton} from '../components/ChatImagePreview';
import '../styles/sister-confrontation.css';
import { routeUrl, routes } from '../utils/routes';
import { addKnownContact, getGameState, markServiceRead, markSisterReminder2Read, sendSisterReminder2, chooseSisterReply, completeSisterConversation, nextSisterReplyAt, subscribeGameState } from '../state/game-state';
import { config, wechat } from '../utils/content';
import { el } from '../utils/dom';
import searchUI from '../content/wechat/search-ui.json';
import sisterDialogue from '../content/wechat/sister-reminder-2.json';
import {webSearchRoute} from './WebSearchScreen';
import { Avatar, ChatAvatar } from '../components/Avatar';
import { hidden, visibleChats, chats, sortedMessages, characterName, messageTime, historyMessageTime, searchableChats } from '../utils/wechat-content';
import '../styles/wechat.css';
export interface WeChatContext { conversationId: keyof typeof config.characters; playerId: keyof typeof config.characters }
export function WeChatScreen(context: WeChatContext): HTMLElement {
  const screen = el('section', 'wc-window');
  screen.setAttribute('aria-label', wechat.moduleName);
  screen.style.setProperty('--wc-arrival-duration',presentation.animation.durationMs+'ms');screen.style.setProperty('--wc-arrival-offset',presentation.animation.offsetPx+'px');
  let selectedId: string = context.conversationId;
  try { const revision=String(getGameState().timelineRevision);if(sessionStorage.getItem('wechat:timeline')!==revision){sessionStorage.removeItem('wechat:selected');sessionStorage.removeItem('wechat:search');sessionStorage.setItem('wechat:timeline',revision);} const saved=sessionStorage.getItem('wechat:selected'); if(visibleChats().some(c=>c.id===saved)) selectedId=saved!; } catch {}
  const abort = new AbortController();
  let dialogueTimer:ReturnType<typeof setTimeout>|undefined;let renderGeneration=0;const scrollPositions=new Map<string,number>();
  screen.addEventListener('screen-dispose',()=>{abort.abort();clearTimeout(dialogueTimer);});
  let search = '';
  try{search=sessionStorage.getItem('wechat:search')??'';}catch{}
  const rail = el('aside', 'wc-rail');
  const profile = Avatar(context.playerId); profile.title = characterName(context.playerId);
  const messagesIcon = el('div', 'wc-nav-active');
  messagesIcon.setAttribute('role', 'img'); messagesIcon.setAttribute('aria-label', wechat.messagesLabel);
  messagesIcon.append(el('span', 'wc-chat-icon'));
  const railUnread=el('span','wc-rail-unread');railUnread.hidden=true;messagesIcon.append(railUnread);
  rail.append(profile, messagesIcon);
  const sidebar = el('aside', 'wc-sidebar');
  const searchWrap = el('div', 'wc-search-wrap');
  const searchInput = el('input', 'wc-search');
  searchInput.type = 'search'; searchInput.placeholder = wechat.searchPlaceholder;
  searchInput.setAttribute('aria-label', wechat.searchLabel);
  searchInput.value=search;searchWrap.append(searchInput);
  const list = el('nav', 'wc-list'); list.setAttribute('aria-label', wechat.chatsLabel);
  sidebar.append(searchWrap, list);
  const conversation = el('section', 'wc-conversation');
  const header = el('header', 'wc-header');
  const mobileBack = el('button', 'wc-mobile-back', wechat.mobileBack);
  mobileBack.type = 'button'; mobileBack.onclick = () => { screen.classList.add('wc-show-list'); searchInput.focus(); };
  const heading = el('h1', 'wc-heading'); heading.id = 'game-heading'; heading.tabIndex = -1;
  const newMessages=el('button','wc-new-messages',sisterDialogue.newMessagesLabel);newMessages.type='button';newMessages.hidden=true;
  header.append(mobileBack, heading,newMessages);
  let renderedChatId='';let renderedMessageIds=new Set<string>();const animateUntil=new Map<string,number>();
  const history = el('div', 'wc-history'); history.tabIndex = 0; history.setAttribute('role', 'region'); history.setAttribute('aria-label', wechat.historyLabel);
  const composer = el('div', 'wc-composer');
  const input = el('textarea', 'wc-input'); input.placeholder = wechat.inputPlaceholder; input.disabled = true; input.setAttribute('aria-label', wechat.inputLabel);
  const composerFoot = el('div', 'wc-composer-foot');
  const webSearchButton=el('button','wc-open-search');webSearchButton.type='button';
  webSearchButton.setAttribute('aria-label',searchUI.webHeading);webSearchButton.title=searchUI.webHeading;
  const magnifier=el('span','wc-magnifier');magnifier.setAttribute('aria-hidden','true');
  webSearchButton.append(magnifier);
  const send = el('button', 'wc-send', wechat.send); send.disabled = true; send.type = 'button';
  rail.append(webSearchButton);
  const mobileWebSearch=el('button','wc-open-search wc-mobile-search');mobileWebSearch.type='button';mobileWebSearch.setAttribute('aria-label',searchUI.webHeading);mobileWebSearch.title=searchUI.webHeading;
  const mobileMagnifier=el('span','wc-magnifier');mobileMagnifier.setAttribute('aria-hidden','true');mobileWebSearch.append(mobileMagnifier);searchWrap.append(mobileWebSearch);
  const phaseNote=el('span','wc-phase-note',wechat.phaseNote);composerFoot.append(phaseNote,send);
  const replyChoices=el('section','wc-reply-choices');replyChoices.hidden=true;replyChoices.setAttribute('aria-label',sisterDialogue.choicesLabel);
  composer.append(replyChoices,input,composerFoot);
  conversation.append(header, history, composer);
  webSearchButton.onclick=()=>{let query='';try{query=sessionStorage.getItem('web-search:last-query')??'';}catch{}window.open(new URL(webSearchRoute(query),location.href).href,'_blank','noopener,noreferrer');};
  mobileWebSearch.onclick=webSearchButton.onclick;
  function markCurrentRead(){if(document.hidden||!document.hasFocus()||(screen.classList.contains('wc-show-list')&&matchMedia('(max-width:600px)').matches))return;if(selectedId==='university-service'&&newMessages.hidden&&history.scrollHeight-history.scrollTop-history.clientHeight<60)markServiceRead();if(selectedId==='linyuan'&&newMessages.hidden){markOpeningRead();markSisterReminder2Read();markConfrontationRead();}}
  function selectChat(chatId:string,messageId?:string){
    if(selectedId!==chatId)scrollPositions.set(selectedId,history.scrollTop);
    newMessages.hidden=true;

    addKnownContact(chatId);selectedId=chatId;
    try{sessionStorage.setItem('wechat:selected',selectedId);}catch{}
    renderConversation();if(chatId==='university-service')history.scrollTop=history.scrollHeight;renderList();screen.classList.remove('wc-show-list');heading.focus();markCurrentRead();
    if(chatId===sisterDialogue.chatId&&getGameState().sisterReminder2Sent)history.scrollTop=history.scrollHeight;
    window.dispatchEvent(new Event('wechat-chat-selected'));
    if(messageId){const row=Array.from(history.querySelectorAll<HTMLElement>('[data-message-id]')).find(r=>r.dataset.messageId===messageId);if(row){row.classList.add('wc-message-match');row.scrollIntoView({block:'center'});}}
  }
  function hideReplies(){replyChoices.hidden=true;input.hidden=false;conversation.classList.remove('wc-has-replies');}
  function renderList() {
    const unread=sisterUnreadCount();railUnread.hidden=!unread;railUnread.textContent=String(unread);railUnread.setAttribute('aria-label',presentation.unreadCountLabel.replace('{count}',String(unread)));
    list.replaceChildren();const querying=!!search.trim();
    const contacts=querying?ContactSearchResults(search,selectChat):null;
    if(contacts)list.append(contacts);
    else if(querying)list.append(el('h2','wc-search-heading',searchUI.contactsHeading));
    const visible=visibleChats(search).filter(chat=>!contacts?.querySelector('[data-contact-id="'+chat.id+'"]'));
    for(const chat of visible){
      const item=el('button','wc-chat-item');item.type='button';item.dataset.chatId=chat.id;item.setAttribute('aria-current',String(chat.id===selectedId));
      const details=el('div','wc-chat-details');const top=el('div','wc-chat-top');const messages=sortedMessages(chat.contentId);const last=messages.at(-1);
      top.append(el('span','wc-chat-name',chat.label),el('span','wc-list-time',last?messageTime(last.timestamp):''));
      const state=getGameState();
      if((chat.id==='university-service'&&serviceUnreadCount(state)>0) || (chat.id==='linyuan'&&hasUnreadConfrontation(state)) || (chat.id==='linyuan'&&state.sisterReminder2Sent&&(!state.sisterReminder2Read || (state.sisterConversation&&((state.sisterConversation.questionSentAt&&!state.sisterConversation.questionRead)||state.sisterConversation.commonRepliesSent>state.sisterConversation.readReplyCount))))){const count=chat.id==='university-service'?serviceUnreadCount(state):sisterUnreadCount();const badge=el('span','wc-unread',count?String(count):'');badge.setAttribute('aria-label',count?presentation.unreadCountLabel.replace('{count}',String(count)):wechat.unreadLabel);details.append(badge);}
      details.append(top,el('p','wc-preview',querying&&chat.id===hidden.id?searchUI.nickname.replace('{name}',characterName(chat.avatarId)):plainText(last?.text??'')));
      item.append(ChatAvatar(chat),details);item.onclick=()=>selectChat(chat.id);list.append(item);
    }
    if(!visible.length&&!contacts)list.append(el('p','wc-empty',querying?searchUI.noContacts:wechat.noResults));
  }
  function renderConversation() {
    const generation=++renderGeneration;const previousTop=history.scrollTop;
    const chat = searchableChats().find(item => item.id === selectedId) ?? chats[0];
    selectedId = chat.id; screen.dataset.conversationId = selectedId;
    heading.textContent = chat.label;
    heading.title = chat.label;
    phaseNote.hidden=!wechat.showDevelopmentNotes||chat.id===hidden.id||(chat.id==='linyuan'&&getGameState().sisterConfrontation3Started);
    history.replaceChildren();
    if(wechat.showDevelopmentNotes&&chat.id!==hidden.id&&!(chat.id==='linyuan'&&getGameState().sisterConfrontation3Started))history.append(el('p', 'wc-prototype-note', wechat.developmentLabel));
    const messages=sortedMessages(chat.contentId);
    const sameChat=renderedChatId===chat.id;if(!sameChat)animateUntil.clear();
    replyChoices.replaceChildren();replyChoices.hidden=true;input.hidden=false;conversation.classList.remove('wc-has-replies');
    if(chat.id===hidden.id && !messages.length)history.append(el('p','wc-system',hidden.emptyText));
    let previousTimestamp='';
    if(chat.kind==='group')history.append(el('p','wc-system wc-history-start',presentation.historyStartText));
    if(chat.id==='linyuan'&&!messages.length){const stamp=chatMessages.sister.messages[0].timestamp;const time=el('time','wc-message-time',historyMessageTime(stamp));time.dateTime=stamp;history.append(time);previousTimestamp=stamp;}
    for (const message of messages) {
      if(showMessageTime(message.timestamp,previousTimestamp)){
        const time=el('time','wc-message-time',historyMessageTime(message.timestamp));time.dateTime=message.timestamp;
        history.append(time);previousTimestamp=message.timestamp;
      }
      if (message.type === 'system') {const note=el('p','wc-system',message.text);note.dataset.messageId=message.id;history.append(note);continue;}
      const outgoing = message.senderId === context.playerId;
      const row = el('div', `wc-message${outgoing ? ' wc-outgoing' : ''}`); row.dataset.messageId = message.id;
      if(sameChat&&!outgoing&&!renderedMessageIds.has(message.id))animateUntil.set(message.id,Date.now()+presentation.animation.durationMs);if((animateUntil.get(message.id)??0)>Date.now()){row.classList.add('wc-message-new');row.style.setProperty('--wc-arrival-duration',Math.max(1,animateUntil.get(message.id)!-Date.now())+'ms');}
      const body = el('div', 'wc-message-body');
      if (chat.kind === 'group' && !outgoing) body.append(el('p', 'wc-sender', characterName(message.senderId)));
      const bubble=el('div','wc-bubble');
      const card=message.type==='link'&&message.routeId==='memory-archive';
      if(message.type==='call'){const icon=el('span','','☎ ');icon.setAttribute('aria-hidden','true');bubble.append(icon,el('span','',message.text));}else if(message.type==='image'&&message.attachmentId){
        const attachment=confrontationBundle.attachments.items.find(item=>item.id===message.attachmentId);
        if(attachment)bubble.append(chatImageButton(screen,attachment,viewSisterManuscript));
        else{
          const archived=chatMessages[chat.contentId].attachments?.find(item=>item.id===message.attachmentId);
          if(archived?.src){
            const button=chatImageButton(screen,{src:archived.src,title:message.text,alt:message.text});
            button.classList.add('wc-chat-image-full');
            bubble.append(button);
          }
        }
      }else if(message.type==='file'){const data=chatMessages[chat.contentId] as {attachments?:Array<{id:string;fileName:string;src:string|null;placeholder:boolean}>};const attachment=data.attachments?.find(a=>a.id===message.attachmentId);if(attachment){const file=el('button','wc-file-card');file.type='button';file.append(el('span','wc-pdf-icon','PDF'),el('span','',attachment.fileName));file.onclick=()=>{if(attachment.src){showPdfPreview(screen,{fileName:attachment.fileName,src:attachment.src},file);return;}const dialog=el('dialog','wc-file-dialog');const close=el('button','',presentation.pdfPlaceholderClose);close.onclick=()=>dialog.close();dialog.append(el('h2','',attachment.fileName),el('p','',presentation.pdfPlaceholderText),close);dialog.onclose=()=>dialog.remove();screen.append(dialog);dialog.showModal();};bubble.append(file);}}else if(!card&&message.type!=='link'){if(message.inlineLinks?.length)appendLinkedText(bubble,message.text,message.inlineLinks);else appendWeChatText(bubble,message.text);}
      if(message.type==='link'&&message.routeId&&Object.hasOwn(routes,message.routeId)){const link=el('a',card?'wc-link-card':'',message.linkLabel??message.text);link.href=routeUrl(message.routeId as keyof typeof routes);link.target='_blank';link.rel='noopener noreferrer';if(card)link.href=new URL(routes['memory-archive']+'?'+new URLSearchParams({chat:chat.id,source:message.id}),location.href).href;bubble.append(link);}
      body.append(bubble);
      row.append(Avatar(message.senderId), body); history.append(row);
    }
    if((chatMessages[chat.contentId] as {showHistoryEnd?:boolean}).showHistoryEnd)history.append(el('p','wc-system',presentation.historyEndText));
    if(chat.id==='linyuan'&&!getGameState().sisterReminder2Sent&&!getGameState().sisterConfrontation3Started){
      const opening=getGameState().opening;
      if(opening.received===2&&!opening.replySent){replyChoices.hidden=false;input.hidden=true;conversation.classList.add('wc-has-replies');const reply=chatMessages.sister.messages.find(m=>m.id===presentation.opening.replyMessageId)!;const button=el('button','',reply.text);button.type='button';button.dataset.replyId=presentation.opening.replyId;button.onclick=()=>{button.disabled=true;hideReplies();void chooseOpeningReply(presentation.opening.replyId).catch(error=>{renderConversation();console.error(error);});};replyChoices.append(button);}
    }
    if(chat.id===sisterDialogue.chatId&&getGameState().sisterReminder2Sent){
      const state=getGameState();const dialogue=state.sisterConversation;
      if(!dialogue?.completedAt&&!dialogue?.choiceId&&(!dialogue||dialogue.introReplyAt===null||dialogue.questionSentAt!==null)){
        const choices=replyChoices;choices.hidden=false;input.hidden=true;conversation.classList.add('wc-has-replies');choices.append(el('p','',sisterDialogue.choicesLabel));
        const replies=dialogue?.introReplyAt?sisterDialogue.detailReplies:[sisterDialogue.initialReply];
        for(const reply of replies){const button=el('button','',reply.text);button.type='button';button.dataset.replyId=reply.id;button.onclick=()=>{button.disabled=true;hideReplies();void chooseSisterReply(reply.id).then(()=>{history.scrollTop=history.scrollHeight;}).catch(error=>{renderConversation();console.error(error);});};choices.append(button);}
      }
    }
    if(chat.id==='linyuan'&&getGameState().sisterConfrontation3Started){
      const state=getGameState(),progress=state.sisterConfrontation3,node=confrontationBundle.dialogue.nodes.find(n=>n.id===progress.nodeId);
      const pendingSend=dialogueSend('sister',state.sisterConfrontation3,confrontationBundle.dialogue);if(pendingSend){replyChoices.append(pendingSend);replyChoices.hidden=false;input.hidden=true;conversation.classList.add('wc-has-replies');}if(node?.type==='choice'&&!state.sisterConfrontation3Completed){replyChoices.replaceChildren(el('p','',confrontationBundle.ui.choices));replyChoices.hidden=false;input.hidden=true;conversation.classList.add('wc-has-replies');for(const option of (node.options??[]).filter(o=>!o.disabled)){const b=el('button','',option.text);b.type='button';b.dataset.s3Option=option.id;b.onclick=()=>{b.disabled=true;replyChoices.hidden=true;replyChoices.replaceChildren();input.hidden=false;conversation.classList.remove('wc-has-replies');void chooseSisterConfrontation(option.id).catch(error=>{renderConversation();replyChoices.append(el('p','',confrontationBundle.ui.storageError));console.error(error);});};replyChoices.append(b);}}
      if(state.hermitageFollowupAvailable){const a=el('a','wc-followup',confrontationBundle.ui.followup);a.href='#/bookstore/mail?thread=hermitage-history&stage=followup';a.target='_blank';a.rel='noopener noreferrer';history.append(a);}
    }
    const hasChoices=!replyChoices.hidden;
    const animations=Array.from(history.querySelectorAll('.wc-message-new .wc-bubble')).flatMap(node=>node.getAnimations()).filter(a=>a.playState==='running'||a.pending);
    const phase=messagePlaybackState(!!history.querySelector('.wc-typing'),animations.length>0,hasChoices);
    screen.dataset.playbackState=phase;
    if(hasChoices){
      replyChoices.hidden=true;input.hidden=false;conversation.classList.remove('wc-has-replies');
      void Promise.allSettled(animations.map(a=>a.finished)).then(()=>new Promise(resolve=>setTimeout(resolve,presentation.choicePauseMs))).then(()=>{if(!abort.signal.aborted&&generation===renderGeneration){replyChoices.hidden=false;input.hidden=true;conversation.classList.add('wc-has-replies');screen.dataset.playbackState='awaitingChoice';}});
    }
    if(sameChat)for(const message of messages.filter(m=>m.senderId!==context.playerId&&!renderedMessageIds.has(m.id)))screen.dispatchEvent(new CustomEvent('wechat-message-received',{bubbles:true,detail:{messageId:message.id,sound:presentation.sound}}));
    renderedChatId=chat.id;renderedMessageIds=new Set(messages.map(m=>m.id));
    history.scrollTop=sameChat?previousTop:(scrollPositions.get(chat.id)??history.scrollHeight);
    if(chat.id===hidden.id)requestAnimationFrame(()=>{if(screen.isConnected&&selectedId===chat.id){history.scrollTop=history.scrollHeight;}});
  }
  function scheduleDialogue(){
    clearTimeout(dialogueTimer);const state=getGameState();const now=Date.now();
    const candidates=[nextSisterReplyAt(state),nextOpeningAt(state)];
    const due=candidates.filter((t):t is number=>t!==null);if(!due.length)return;
    const revision=state.timelineRevision;dialogueTimer=setTimeout(()=>{void (async()=>{
      await advanceOpening(revision);await completeSisterConversation(revision);
      if(abort.signal.aborted)return;
      if(selectedId==='linyuan'){const top=history.scrollTop;const bottom=history.scrollHeight-top-history.clientHeight<60;renderConversation();history.scrollTop=bottom?history.scrollHeight:top;}
      scheduleDialogue();
    })().catch(console.error);},Math.max(0,Math.min(...due)-now));
  }
  const showLatest=()=>{history.scrollTop=history.scrollHeight;newMessages.hidden=true;markCurrentRead();};
  newMessages.onclick=showLatest;
  history.addEventListener('scroll',()=>{if(history.scrollHeight-history.scrollTop-history.clientHeight<35){newMessages.hidden=true;markCurrentRead();}},{signal:abort.signal});
  searchInput.oninput = () => { search = searchInput.value;try{sessionStorage.setItem('wechat:search',search);}catch{}renderList(); };
  screen.append(rail, sidebar, conversation); renderList(); renderConversation();
  window.addEventListener('wechat-open-sister',()=>selectChat(sisterDialogue.chatId),{signal:abort.signal});
  subscribeGameState(()=>{
    if(!screen.isConnected)return;
    const nearBottom=history.scrollHeight-history.scrollTop-history.clientHeight<60;const top=history.scrollTop;
    const chat=searchableChats().find(c=>c.id===selectedId);const incoming=chat?sortedMessages(chat.contentId).some(m=>m.senderId!==context.playerId&&!renderedMessageIds.has(m.id)):false;
    renderList();
    if(selectedId==='university-service'||selectedId==='linyuan'){
      renderConversation();history.scrollTop=nearBottom?history.scrollHeight:top;
      if(incoming&&!nearBottom)newMessages.hidden=false;
      markCurrentRead();
    }
    scheduleDialogue();
  },abort.signal);
  document.addEventListener('visibilitychange',markCurrentRead,{signal:abort.signal});
  window.addEventListener('focus',markCurrentRead,{signal:abort.signal});
  const resumeReminder=()=>{if(!document.hidden)void sendSisterReminder2(getGameState().timelineRevision).catch(console.error);};
  document.addEventListener('visibilitychange',resumeReminder,{signal:abort.signal});
  window.addEventListener('focus',resumeReminder,{signal:abort.signal});
  queueMicrotask(()=>{if(screen.isConnected){void advanceOpening().then(()=>{if(!abort.signal.aborted)scheduleDialogue();}).catch(console.error);resumeReminder();markCurrentRead();scheduleDialogue();if(selectedId===sisterDialogue.chatId&&getGameState().sisterReminder2Sent)history.scrollTop=history.scrollHeight;}});
  return screen;
}
