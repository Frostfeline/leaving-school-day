import {stableChatFooter} from '../components/StableChatFooter';
import {dialogueSend} from '../components/DialogueSend';
import {el} from '../utils/dom';
import {privateBundle as b,privateText,privateSpeaker,privateContactAvatar} from '../utils/private-commission-content';
import {ownerEntries,verificationFields} from '../../scripts/private-commission-model.mjs';
import {getGameState,privateAccess,ownerAccess,saveVerificationAnswers,verifyPrivateCommission,startOwnerConversation,advanceOwnerConversation,chooseOwnerReply,ownerArchiveAvailable,openOwnerArchive,readOwnerArchive,ownerInvitationAvailable,viewOwnerInvitation,subscribeGameState} from '../state/game-state';
import {libraryValue} from '../utils/library-content';
import {bookstoreAccounts,bookstoreMemberName} from '../utils/bookstore-mail-content';
import {Avatar} from '../components/Avatar';
import '../styles/private-commission.css';
export function PrivateCommissionScreen(route:string,go:(to:string)=>void,login:(route:string,button?:HTMLElement)=>void){
 const host=el('section','bs-private'),abort=new AbortController(),revision=getGameState().timelineRevision;const s=getGameState();const a=(text:string,to:string)=>{const link=el('a','bs-h25-entry',text);link.href=to;return link;};
 const denied=()=>host.append(el('h1','',b.verification.title),el('p','',b.ui.locked),a(b.ui.backNing,'#/bookstore/mail?thread=hermitage-history'));
 if(s.bookstoreMember.accountId!=='luoyao-bookstore'){host.append(el('h1','',b.verification.title),el('p','',b.ui.loginRequired));const button=el('button','bs-member-primary',b.ui.login);button.onclick=()=>login(route,button);host.append(button);return host;}
 if(!privateAccess(s)){denied();return host;}
 if(route==='#/bookstore/private-commission'){
  host.classList.add('bs-private-paper');host.append(el('h1','',b.verification.title),...b.verification.description.map(p=>el('p','',p)));
  if(!['borrow-life','jisui-2016'].every(id=>s.openedResearchIds.includes(id))){const hint=el('aside','private-reading-hint',b.verification.missingReadingHint);hint.setAttribute('role','note');host.append(hint);}
  const form=el('form','private-verification');form.noValidate=true;const inputs:HTMLInputElement[]=[];const status=el('p');status.setAttribute('role','status');
  for(const q of b.verification.questions){
   const question=el('section','private-verification-question');
   question.append(el('h2','',q.label),el('p','private-riddle',q.riddleText));
   if(q.promptText)question.append(el('p','',q.promptText));
   if(q.description)question.append(el('p','',q.description));
   const fields=el('div','private-verification-fields');
   for(const {unit} of verificationFields(q)){
    const field=el('label'),input=el('input');
    input.type='text';input.inputMode='numeric';input.pattern='[0-9]+';input.autocomplete='off';
    input.setAttribute('aria-label',unit?q.label+'（'+unit+'）':q.label);
    input.dataset.questionId=q.questionId;input.value=s.privateCommission.answers[inputs.length];
    inputs.push(input);field.append(input);
    if(unit)field.append(el('span','',unit));
    fields.append(field);
   }
   question.append(fields);form.append(question);
  }
  const button=el('button','bs-member-primary',b.ui.submit);button.type='submit';const success=el('section','private-success');success.append(...b.verification.successMessages.map(t=>el('p','',t)),a(b.ui.enterOwner,b.verification.nextRoute));
  const sync=()=>{const p=getGameState().privateCommission;button.disabled=inputs.some(input=>!/^\d+$/.test(input.value))||!!p.verifiedAt;success.hidden=!p.verifiedAt;if(p.verifiedAt)status.textContent=b.ui.verified;};
  for(const input of inputs)input.oninput=()=>{input.value=input.value.normalize('NFKC').trim();saveVerificationAnswers(inputs.map(i=>i.value));sync();};
  form.onsubmit=async e=>{e.preventDefault();saveVerificationAnswers(inputs.map(i=>i.value));const result=await verifyPrivateCommission();status.textContent=result?b.ui.verified:b.verification.failureMessage;sync();};form.append(button,status);host.append(form,success);subscribeGameState(sync,abort.signal);host.addEventListener('screen-dispose',()=>abort.abort());sync();return host;
 }
 if(!ownerAccess()){denied();return host;}
 if(route===b.ui.archiveRoute){
  if(!ownerArchiveAvailable()){denied();return host;}openOwnerArchive();host.classList.add('bs-private-paper');host.append(el('h1','',b.archive.title));const fields=el('dl','private-fields');for(const f of b.archive.fields){const row=el('div');row.append(el('dt','',f.label),el('dd','','valueRef' in f&&typeof f.valueRef==='string'?libraryValue(f.valueRef):f.characterRef?privateSpeaker(f.characterRef):f.text));fields.append(row);}host.append(fields,el('hr'),el('h2','',b.archive.heading));let last:HTMLElement|undefined;for(const m of b.archive.messages){const row=el('article','private-archive-message');row.dataset.archiveMessageId=m.messageId;row.append(el('strong','',m.speakerId==='owner'?b.ui.archiveOwnerName:privateSpeaker(m.speakerId)),el('p','',privateText(m.text)));host.append(row);last=row;}
  let reached=false;const read=el('button','bs-member-primary',b.ui.archiveRead),back=el('button','bs-h25-entry',b.ui.backOwner),note=el('p','',b.ui.archiveNeedEnd);read.disabled=!getGameState().privateCommission.archiveReadAt;back.disabled=read.disabled;const confirmRead=(returning:boolean)=>{if(!reached&&!getGameState().privateCommission.archiveReadAt)return;readOwnerArchive(reached||!!getGameState().privateCommission.archiveReadAt);note.textContent=b.ui.archiveRead;if(returning)go(b.ui.ownerRoute);};read.onclick=()=>confirmRead(false);back.onclick=()=>confirmRead(true);host.append(note,read,back);
  const observer=new IntersectionObserver(entries=>{if(!document.hidden&&entries.some(e=>e.isIntersecting&&e.intersectionRatio>=.7)){reached=true;read.disabled=false;back.disabled=false;}},{threshold:[0,.7,1]});requestAnimationFrame(()=>{if(last&&host.isConnected)observer.observe(last);});host.addEventListener('screen-dispose',()=>observer.disconnect());return host;
 }
 if(route===b.ui.invitationRoute){if(!ownerInvitationAvailable()){denied();return host;}viewOwnerInvitation();host.classList.add('bs-private-paper');host.append(el('h1','',b.invitation.title));const fields=el('dl','private-fields');for(const f of b.invitation.fields){const row=el('div');row.append(el('dt','',f.label),el('dd','',f.text));fields.append(row);}host.append(fields,a(b.ui.backOwner,b.ui.ownerRoute));return host;}
 const introNode=b.dialogue.nodes.find(node=>node.nodeId===b.dialogue.entryNodeId);
 const introMessages=new Set([...(introNode?.messages??[]),...(introNode?.legacyMessages??[])].map(message=>message.messageId));
 const account=bookstoreAccounts.accounts.find(item=>item.id===s.bookstoreMember.accountId)!;
 const layout=el('div','bs-mail-layout bs-private-chat'),reader=el('section','bs-mail-reader');
 layout.append(reader);host.append(layout);let timer:ReturnType<typeof setTimeout>|undefined;
 function render(){clearTimeout(timer);const old=reader.querySelector<HTMLElement>('.bs-mail-scroll'),top=old?.scrollTop??0,bottom=!old||old.scrollHeight-old.scrollTop-old.clientHeight<70,p=getGameState().privateCommission;reader.replaceChildren();const header=el('header','bs-mail-thread-heading');header.append(el('h2','',b.ui.ownerTitle));reader.append(header);const scroll=el('div','bs-mail-scroll');scroll.tabIndex=0;reader.append(scroll);
  const archiveLink=ownerArchiveAvailable()?a(b.ui.openArchive,b.ui.archiveRoute):null;
  if(archiveLink)archiveLink.classList.add('bs-mail-inline-link');
  for(const m of ownerEntries(p.owner,b.dialogue)){
   if(archiveLink&&!archiveLink.parentNode&&!introMessages.has(m.id))scroll.append(archiveLink);
   if(m.speakerId==='system'){scroll.append(el('p','bs-h25-system',privateText(m.text)));continue;}
   const self=m.speakerId==='linchen';
   const row=el('article','bs-mail-letter'+(self?' bs-mail-self':''));
   row.dataset.ownerMessageId=m.id;
   const body=el('div','bs-mail-message-body');
   body.append(el('span','bs-mail-sender',self?bookstoreMemberName(account.id):privateSpeaker(m.speakerId)),el('p','bs-mail-text',privateText(m.text)));
   const avatar=self?Avatar(account.characterId):el('img','wc-avatar private-contact-avatar');
   if(!self){avatar.src=import.meta.env.BASE_URL+privateContactAvatar;avatar.alt='';avatar.width=40;avatar.height=40;}
   row.append(avatar,body);scroll.append(row);
  }
  if(archiveLink&&!archiveLink.parentNode)scroll.append(archiveLink);
  const pendingSend=dialogueSend('owner',p.owner,b.dialogue,privateText);if(pendingSend){const composer=el('section','bs-h25-choices');composer.append(pendingSend);reader.append(composer);}const node=b.dialogue.nodes.find(n=>n.nodeId===p.owner.nodeId);
  if(node?.nodeType==='choice'&&!p.owner.choice){const choices=el('section','bs-h25-choices');for(const o of node.options??[]){const button=el('button','',o.text);button.type='button';button.dataset.ownerOption=o.id;button.onclick=()=>{choices.replaceChildren();choices.hidden=true;void chooseOwnerReply(o.id,revision);};choices.append(button);}reader.append(choices);}
  if(p.owner.stage==='oa'){const link=a(b.ui.openOa,b.ui.oaRoute);link.classList.add('bs-mail-inline-link');scroll.append(link);}if(ownerInvitationAvailable())scroll.append(a(b.ui.openInvitation,b.ui.invitationRoute));
  const state=getGameState();
  let endingRoute:string|undefined;
  if(p.owner.stage==='be'){
   if(p.be.viewedAt&&state.collectedEndings.includes('be-unauthorized-tomorrow'))scroll.append(a(b.ending.finalLabel,'#/endings/be'));
   else endingRoute=b.ui.beRoute;
  }else if(p.owner.stage==='invitation'&&state.ending===b.trueEnding.endingId){
   endingRoute=b.ui.teRoute;
  }
  if(endingRoute){
   const route=endingRoute;
   const prompt=el('p','bs-h25-system');
   const link=el('a','bs-mail-ending-link',b.ui.enterEnding);link.href=route;
   prompt.append(link);reader.append(prompt);
   scroll.onclick=event=>{
    if(event.target instanceof Element&&event.target.closest('a, button'))return;
    if(window.getSelection()?.isCollapsed===false)return;
    go(route);
   };
  }
  stableChatFooter(reader,scroll);scroll.scrollTop=bottom?scroll.scrollHeight:top;if(p.owner.startedAt===null)queueMicrotask(()=>{if(host.isConnected)void startOwnerConversation();});else if(p.owner.completedAt===null&&(p.owner.nextAt!==null||node?.nodeType==='archive'&&p.archiveReadAt))timer=setTimeout(()=>void advanceOwnerConversation(revision),Math.max(0,(p.owner.nextAt??Date.now())-Date.now())+5);
 }
 subscribeGameState(()=>{if(host.isConnected)render();},abort.signal);host.addEventListener('screen-dispose',()=>{abort.abort();clearTimeout(timer);});render();return host;
}
