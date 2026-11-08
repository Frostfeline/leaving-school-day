import openingContent from '../content/wechat/chats/sister.json';
import {privateBundle} from '../utils/private-commission-content';
import {emptyPrivate,normalizePrivate,answersCorrect,tickOwner,chooseOwner} from '../../scripts/private-commission-model.mjs';
import {hermitageBundle,hermitageReady} from '../utils/hermitage-2025-content';
import {emptyHermitage,normalizeHermitage,resumeHermitageFollowup,tickHermitage} from '../../scripts/hermitage-2025-model.mjs';
import {confrontationBundle} from '../utils/sister-confrontation-content';
import type {ConfrontationProgress} from '../utils/sister-confrontation-content';
import {emptyConfrontation,normalizeConfrontation,tickConfrontation,chooseConfrontation,viewConfrontationManuscript,confrontationEntries} from '../../scripts/sister-confrontation-model.mjs';
import {bookstoreAccounts} from '../utils/story-dates';
import mailThreads from '../content/bookstore/mail-threads.json';
import archivePuzzle from '../content/memoryArchive/puzzle.json';
import {normalizeArchiveProgress} from '../../scripts/memory-archive-model.mjs';
import type {ArchiveProgress} from '../utils/memory-archive-content';

import presentation from '../content/wechat/presentation.json';
import authConfig from '../content/auth-config.json';
import student from '../content/characters.json';
import ui from '../content/oa-login.json';
import sisterDialogue from '../content/wechat/sister-reminder-2.json';
const KEY = 'leaving-school-day:state:v1';
interface Auth { studentId: string; code: string; issuedAt: number; expiresAt: number | null; consumed: boolean }
export interface LibraryPayment { id:'library-settlement'; status:'processing'|'completed'; startedAt:number; completedAt:number|null; eligibleForNE:boolean;outcome?:'ne'|'he' }
export interface BookstoreProgress{visited:boolean;searched:boolean;products:string[];messageProducts:string[];imageIds:string[]}
export interface SisterConversation {branchRepliesEnabled?:boolean;introReplyAt:number|null;questionSentAt:number|null;questionRead:boolean;choiceId:string|null;choiceAt:number|null;typingUntil:number|null;commonRepliesSent:number;readReplyCount:number;completedAt:number|null;completionRead:boolean}
export interface BookstoreMember {accountId:string|null;selectedThreadId:string|null;readThreadIds:string[]}
export interface OpeningProgress { startedAt:number|null; received:number; readCount:number; replySent:boolean }
export interface SavedWeChatReply {id:string;chatId:string;senderId:string;sourceChoiceId:string;at:number;text:string}
export interface GameState {discoveredFriendIds:string[];endingCollectionVersion?:1;ownerRewindCheckpoint?:PaymentCheckpoint|null;lastEndingId?:GameState['ending'];wechatReplies:SavedWeChatReply[];neReceiptContinuedAt:number|null; opening:OpeningProgress; privateCommission:any;hermitageRewindGranted:boolean;hermitageCheckpoint:PaymentCheckpoint|null;hermitage2025:any; ningReadMessageIds:string[];ningHistoryReadCompleted:boolean;sisterConfrontation3:ConfrontationProgress;sisterConfrontation3Queued:boolean;sisterConfrontation3Started:boolean;sisterConfrontation3Completed:boolean;sisterConfrontation3NodeId:string|null;sisterConfrontation3SelectedOptions:Record<string,string>;sisterManuscriptViewed:boolean;hermitageFollowupAvailable:boolean; archive:ArchiveProgress;archivePuzzleCompleted:boolean; bookstoreMember:BookstoreMember; sisterConversation:SisterConversation|null; seenOaDebtInquiry:boolean; sisterReminder2Queued:boolean; sisterReminder2Sent:boolean; sisterReminder2Read:boolean; sisterReminder2SentAt:number|null; version: 1; auth: Auth | null; issuedCodes: Auth[]; authenticated: boolean; authenticatedAt: number | null; readCodeId: string | null; studentInput: string; oaHomeEntered: boolean; knowLuoYaoName: boolean; addedLuoYao: boolean; addedLiTianMing: boolean; enteredInvestigation:boolean; viewedOriginalRecord:boolean; confirmedResponsibility:boolean; libraryPayment:LibraryPayment|null; ending:'ne-graduation'|'he-ai-you-suo-gui'|'be-unauthorized-tomorrow'|'te-unfinished-pact'|null; endingStartedAt:number|null; endingPresentationComplete:boolean; collectedEndings:('ne-graduation'|'he-ai-you-suo-gui'|'be-unauthorized-tomorrow'|'te-unfinished-pact')[]; timelineRevision:number; paymentCheckpoint:PaymentCheckpoint|null;bookstoreProgress:BookstoreProgress }
type PaymentCheckpoint=Omit<GameState,'collectedEndings'|'timelineRevision'|'paymentCheckpoint'|'hermitageCheckpoint'|'ownerRewindCheckpoint'|'endingCollectionVersion'>;
const empty = (): GameState => ({discoveredFriendIds:[],endingCollectionVersion:1,wechatReplies:[],opening:{startedAt:null,received:0,readCount:0,replySent:false},privateCommission:emptyPrivate(),hermitageRewindGranted:false,hermitageCheckpoint:null,hermitage2025:emptyHermitage(),ningReadMessageIds:[],ningHistoryReadCompleted:false,sisterConfrontation3:emptyConfrontation(),sisterConfrontation3Queued:false,sisterConfrontation3Started:false,sisterConfrontation3Completed:false,sisterConfrontation3NodeId:null,sisterConfrontation3SelectedOptions:{},sisterManuscriptViewed:false,hermitageFollowupAvailable:false,archive:normalizeArchiveProgress(null,archivePuzzle),archivePuzzleCompleted:false,bookstoreMember:{accountId:null,selectedThreadId:null,readThreadIds:[]},sisterConversation:null,seenOaDebtInquiry:false,sisterReminder2Queued:false,sisterReminder2Sent:false,sisterReminder2Read:false,sisterReminder2SentAt:null,version:1,auth:null,issuedCodes:[],authenticated:false,authenticatedAt:null,readCodeId:null,studentInput:'',oaHomeEntered:false,knowLuoYaoName:false,addedLuoYao:false,addedLiTianMing:false,enteredInvestigation:false,viewedOriginalRecord:false,confirmedResponsibility:false,libraryPayment:null,ending:null,endingStartedAt:null,neReceiptContinuedAt:null,endingPresentationComplete:false,collectedEndings:[],timelineRevision:0,paymentCheckpoint:null,bookstoreProgress:{visited:false,searched:false,products:[],messageProducts:[],imageIds:[]}});
export function getGameState(): GameState {
  try { return decodeGameState(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch { return empty(); }
}
function decodeGameState(data:any):GameState {
      if(data&&data.version===1&&!data.bookstorePasswordRevision){
       const s=data.sisterConfrontation3;
       const unanswered=!Object.keys(s?.selectedOptions??{}).length&&!Object.keys(data.sisterConfrontation3SelectedOptions??{}).length;
       if(!data.ending&&!s?.completedAt&&unanswered&&!normalizeArchiveProgress(data.archive,archivePuzzle).archivePuzzleCompleted&&(s?.startedAt!=null||data.ningHistoryReadCompleted||data.sisterConfrontation3Queued)){
        data.sisterConfrontation3=emptyConfrontation();data.ningReadMessageIds=[];data.ningHistoryReadCompleted=false;
        data.sisterConfrontation3Queued=false;data.sisterConfrontation3Started=false;data.sisterConfrontation3Completed=false;
        data.sisterConfrontation3NodeId=null;data.sisterConfrontation3SelectedOptions={};data.sisterManuscriptViewed=false;data.hermitageFollowupAvailable=false;
        data.bookstoreMember={accountId:null,selectedThreadId:null,readThreadIds:[]};
       }
       data.bookstorePasswordRevision=1;
      }
    if (!data || data.version!==1 || typeof data.authenticated!=='boolean') throw Error('state header: missing save, unsupported version or authenticated type');
    if (data.auth && (!/^\d{6}$/.test(data.auth.code) || typeof data.auth.studentId!=='string' || (data.auth.expiresAt!==null && !Number.isFinite(data.auth.expiresAt)) || !Number.isFinite(data.auth.issuedAt))) throw Error('auth: invalid code, studentId, expiresAt or issuedAt');
    if(!Array.isArray(data.issuedCodes))data.issuedCodes=data.auth?[data.auth]:[];
    data.issuedCodes=data.issuedCodes.filter((a:Auth)=>a && /^\d{6}$/.test(a.code) && Number.isFinite(a.issuedAt) && (a.expiresAt===null || Number.isFinite(a.expiresAt)));
    const collectedEndings:Array<'ne-graduation'|'he-ai-you-suo-gui'|'be-unauthorized-tomorrow'|'te-unfinished-pact'>=Array.isArray(data.collectedEndings)?data.collectedEndings.filter((id:string)=>['ne-graduation','he-ai-you-suo-gui','be-unauthorized-tomorrow','te-unfinished-pact'].includes(id)):[];
    if(data.endingCollectionVersion!==1){
      const proof={
        'ne-graduation':data.endingPresentationComplete===true,
        'he-ai-you-suo-gui':!!(data.privateCommission?.hePresentation?.endingViewedAt||data.hermitage2025?.endingViewedAt),
        'be-unauthorized-tomorrow':!!data.privateCommission?.be?.viewedAt,
        'te-unfinished-pact':!!data.privateCommission?.te?.castFinishedAt,
      };
      for(let i=collectedEndings.length-1;i>=0;i--)if(!proof[collectedEndings[i]])collectedEndings.splice(i,1);
    }
    data.endingCollectionVersion=1;
    // A rewind grant belongs only to an earned HE replay, never to NE.
    if(data.hermitageRewindGranted&&!data.hermitage2025?.openingConfirmedAt&&!collectedEndings.includes('he-ai-you-suo-gui')){data.hermitageRewindGranted=false;data.hermitage2025=emptyHermitage();}
    if(data.sisterConversation){const d=data.sisterConversation;data.sisterConversation={...d,questionSentAt:d.questionSentAt??(d.choiceId||d.completedAt?d.introReplyAt+presentation.newMessageIntervalMs:null),questionRead:d.questionRead??!!d.choiceId,commonRepliesSent:d.commonRepliesSent??(d.completedAt?sisterDialogue.commonReplies.length:0),readReplyCount:d.readReplyCount??(d.completionRead?sisterDialogue.commonReplies.length:0)};}
    if(data.sisterConversation){const d=data.sisterConversation,total=secondReminderReplies(d).length;if(d.choiceId&&d.commonRepliesSent>=total){d.commonRepliesSent=total;d.readReplyCount=Math.min(d.readReplyCount,total);d.completedAt??=d.typingUntil+(total-1)*presentation.newMessageIntervalMs;}}
    // Resume newly appended lines only while this conversation is still the active chapter.
    if(data.sisterConversation){const d=data.sisterConversation;if(d.choiceId&&d.completedAt!==null&&d.commonRepliesSent<secondReminderReplies(d).length&&!data.sisterConfrontation3?.startedAt&&!data.ending){d.completedAt=null;d.completionRead=false;}}
    const legacyOpening=!data.opening && !!(data.auth || data.seenOaDebtInquiry || data.sisterReminder2Sent || data.sisterConfrontation3Started || data.ending || data.bookstoreProgress?.visited);
    data.wechatReplies=Array.isArray(data.wechatReplies)?data.wechatReplies.filter((m:any,i:number,all:any[])=>m&&typeof m.id==='string'&&m.chatId==='linyuan'&&m.senderId==='linchen'&&Number.isFinite(m.at)&&typeof m.text==='string'&&all.findIndex(x=>x.id===m.id)===i):[];
    if(data.wechatReplies.some((m:any)=>m.id===presentation.opening.replyMessageId)&&data.opening)data.opening={...data.opening,received:2,readCount:2,replySent:true};
    const opening=data.opening;data.opening=opening?{startedAt:Number.isFinite(opening.startedAt)?opening.startedAt:null,received:Number.isInteger(opening.received)?Math.max(0,Math.min(2,opening.received)):0,readCount:Number.isInteger(opening.readCount)?Math.max(0,Math.min(opening.received,opening.readCount)):(opening.replySent?2:0),replySent:opening.replySent===true}:legacyOpening?{startedAt:0,received:2,readCount:2,replySent:true}:empty().opening;
    return withConfrontationState({...empty(),...data,discoveredFriendIds:Array.isArray(data.discoveredFriendIds)?data.discoveredFriendIds.filter((id:string)=>['changsizhu','huosisi'].includes(id)):[],archive:normalizeArchiveProgress(data.archive,archivePuzzle),archivePuzzleCompleted:normalizeArchiveProgress(data.archive,archivePuzzle).archivePuzzleCompleted,bookstoreMember:normalizeBookstoreMember(data.bookstoreMember),collectedEndings,timelineRevision:Number.isSafeInteger(data.timelineRevision)?data.timelineRevision:0,enteredInvestigation:!!(data.enteredInvestigation || data.viewedOriginalRecord || data.knowLuoYaoName)});
}
export function getGameStateDiagnostics(){
 try{const raw=localStorage.getItem(KEY),data=JSON.parse(raw||'null');let decodeError:string|null=null;try{decodeGameState(structuredClone(data));}catch(e){decodeError=String(e);}
 return {hasStoredSave:raw!==null,bytes:raw?.length??0,version:data?.version??null,authenticatedType:typeof data?.authenticated,decodeError,rawSecondReminder:{sent:data?.sisterReminder2Sent??null,read:data?.sisterReminder2Read??null,dialogue:data?.sisterConversation??null},rawHistory:{readCount:Array.isArray(data?.ningReadMessageIds)?data.ningReadMessageIds.length:null,completed:data?.ningHistoryReadCompleted??null,visitedThreads:data?.bookstoreMember?.readThreadIds??[]},storedKeys:data&&typeof data==='object'?Object.keys(data):[]};
 }catch(e){return {decodeError:String(e)};}
}
function commit(state:GameState){if(state.ending&&state.collectedEndings.includes(state.ending))state={...state,lastEndingId:state.ending};localStorage.setItem(KEY,JSON.stringify(state));window.dispatchEvent(new Event('game-state-change'));}
function normalizeBookstoreMember(value:unknown):BookstoreMember{
 const v=value as Partial<BookstoreMember>|null;const exists=(id:string)=>mailThreads.items.some(t=>t.id===id);const ids=(value:unknown)=>Array.isArray(value)?value.filter((id):id is string=>typeof id==='string'&&exists(id)):[];
 return {accountId:bookstoreAccounts.accounts.some(a=>a.id===v?.accountId)?v!.accountId!:null,selectedThreadId:typeof v?.selectedThreadId==='string'&&exists(v.selectedThreadId)?v.selectedThreadId:null,readThreadIds:ids(v?.readThreadIds)};
}
export function loginBookstore(username:string,password:string){
 const account=bookstoreAccounts.accounts.find(a=>a.username===username.trim()&&a.password===password);if(!account)return false;save({bookstoreMember:{...getGameState().bookstoreMember,accountId:account.id}});return true;
}
export function logoutBookstore(){save({bookstoreMember:{...getGameState().bookstoreMember,accountId:null}});}
export function selectBookstoreThread(id:string){const state=getGameState();if(state.bookstoreMember.selectedThreadId!==id&&mailThreads.items.some(t=>t.id===id&&t.accountId===state.bookstoreMember.accountId))save({bookstoreMember:{...state.bookstoreMember,selectedThreadId:id}});}
export function canReadBookstoreThread(id:string){const state=getGameState();return mailThreads.items.some(t=>t.id===id&&t.accountId===state.bookstoreMember.accountId);}
export function markBookstoreThreadRead(id:string){const s=getGameState();if(canReadBookstoreThread(id)&&!s.bookstoreMember.readThreadIds.includes(id))save({bookstoreMember:{...s.bookstoreMember,readThreadIds:[...s.bookstoreMember.readThreadIds,id]}});}
function replyHistory(state:GameState,id:string,sourceChoiceId:string,text:string,at:number){return state.wechatReplies.some(m=>m.id===id)?state.wechatReplies:[...state.wechatReplies,{id,chatId:'linyuan',senderId:'linchen',sourceChoiceId,text,at}];}
function save(patch: Partial<GameState>) {commit(withConfrontationState({...getGameState(),...patch}));}
export function subscribeGameState(fn:()=>void, signal?:AbortSignal) {
  window.addEventListener('game-state-change',fn,{signal});
  window.addEventListener('storage',event=>{if(event.key===KEY || event.key===null) fn();},{signal});
}
export function validateStudent(value:string): string | null {
  if(!value.trim())return ui.emptyStudent;
  if(!student.linchen.studentId)return ui.pendingStudent;
  if(!/^\d{12}$/.test(value.trim()))return ui.wrongStudent;
  return value.trim()===String(student.linchen.studentId) ? null : ui.unboundStudent;
}
export function rememberStudent(value:string) { save({studentInput:value}); }
export function requestLoginCode(value:string):string | null {
  const error=validateStudent(value); if(error)return error;
  const code=authConfig.verificationCode;
  const previous=getGameState();
  const now=Math.max(Date.now(),(previous.auth?.issuedAt ?? 0)+1);
  try { save({issuedCodes:[...getGameState().issuedCodes,{studentId:value.trim(),code,issuedAt:now,expiresAt:null,consumed:false}],auth:{studentId:value.trim(),code,issuedAt:now,expiresAt:null,consumed:false},authenticated:false,authenticatedAt:null,oaHomeEntered:false,studentInput:value}); return null; }catch{return ui.storageFailure;}
}
export function login(value:string,code:string):string|null {
  const error=validateStudent(value); if(error)return error;
  const auth=getGameState().auth;
  if(!auth)return ui.missingCode;
  if(auth.consumed)return ui.expiredCode;
  if(auth.studentId!==value.trim() || !/^\d{6}$/.test(code.trim()) || code.trim()!==auth.code || auth.code!==authConfig.verificationCode)return ui.wrongCode;
  try { save({auth:{...auth,consumed:true},authenticated:true,authenticatedAt:Date.now(),oaHomeEntered:false}); window.dispatchEvent(new CustomEvent('oa-login-success',{detail:{playerId:'linchen'}})); return null; }catch{return ui.storageFailure;}
}
export function serviceUnreadCount(state=getGameState()) {
 const readAt=state.readCodeId===null?-Infinity:Number(state.readCodeId);
 return state.issuedCodes.filter(a=>a.issuedAt>readAt).length;
}
export function markServiceRead() {const latest=getGameState().issuedCodes.at(-1);if(latest && getGameState().readCodeId!==String(latest.issuedAt))save({readCodeId:String(latest.issuedAt)});}
export function markOpeningRead(){const state=getGameState();if(state.opening.readCount<state.opening.received)save({opening:{...state.opening,readCount:state.opening.received}});}
export function nextOpeningAt(state=getGameState()) {
 const o=state.opening;if(o.startedAt===null||o.received>=2)return null;
 return o.startedAt+presentation.opening.initialDelayMs+(o.received?presentation.newMessageIntervalMs:0);
}
export function advanceOpening(expectedRevision=getGameState().timelineRevision){return paymentLock(()=>{
 const state=getGameState();if(state.timelineRevision!==expectedRevision||state.opening.received>=2)return;
 const startedAt=state.opening.startedAt??Date.now();
 const first=startedAt+presentation.opening.initialDelayMs;
 const received=Date.now()>=first+presentation.newMessageIntervalMs?2:Date.now()>=first?1:0;
 if(startedAt!==state.opening.startedAt||received!==state.opening.received)save({opening:{...state.opening,startedAt,received}});
});}
export function chooseOpeningReply(id:string){return paymentLock(()=>{
 const state=getGameState();if(id!==presentation.opening.replyId||state.opening.received!==2||state.opening.replySent)return false;
 const message=openingContent.messages.find(m=>m.id===presentation.opening.replyMessageId)!;save({opening:{...state.opening,replySent:true},wechatReplies:replyHistory(state,message.id,id,message.text,Date.now())});return true;
});}


export function markOAHomeEntered() { if(!getGameState().oaHomeEntered)save({oaHomeEntered:true}); }
export function revealLuoYaoName() {
 const state=getGameState();if(state.authenticated && !state.ending && (!state.knowLuoYaoName || !state.viewedOriginalRecord))save({knowLuoYaoName:true,enteredInvestigation:true,viewedOriginalRecord:true});
}
export function addKnownContact(id:string) {
 const state=getGameState();
 if(id==='luoyao'&&!state.addedLuoYao)save({addedLuoYao:true});
 if(id==='litianming'&&!state.addedLiTianMing)save({addedLiTianMing:true});
 if(['changsizhu','huosisi'].includes(id)&&!state.discoveredFriendIds.includes(id))save({discoveredFriendIds:[...state.discoveredFriendIds,id]});
}

export const PAYMENT_PROCESS_MS=2500;
// Future confrontation events must use their own evidence predicates; opening a
// contact or this first inquiry never dispatches the later confrontation.
export function beginLibraryInquiry() {
 const state=getGameState();if(!state.authenticated || state.ending)return;
 if(!state.seenOaDebtInquiry)save({seenOaDebtInquiry:true,sisterReminder2Queued:true,knowLuoYaoName:true,enteredInvestigation:true,viewedOriginalRecord:true});
}
export function sendSisterReminder2(expectedRevision=getGameState().timelineRevision){return paymentLock(()=>{
 const state=getGameState();
 if(state.timelineRevision!==expectedRevision || !state.seenOaDebtInquiry || !state.sisterReminder2Queued || state.sisterReminder2Sent)return;
 save({sisterReminder2Sent:true,sisterReminder2SentAt:Date.now()});
});}
export function markSisterReminder2Read(){
 const state=getGameState();const dialogue=state.sisterConversation;
 if(state.sisterReminder2Sent && (!state.sisterReminder2Read || (dialogue?.questionSentAt&&!dialogue.questionRead) || (dialogue&&dialogue.commonRepliesSent>dialogue.readReplyCount) || (dialogue?.completedAt!=null&&!dialogue.completionRead)))save({sisterReminder2Read:true,...(dialogue?{sisterConversation:{...dialogue,questionRead:dialogue.questionSentAt!==null,readReplyCount:dialogue.commonRepliesSent,completionRead:dialogue.completedAt!==null}}:{})});
}
export function chooseSisterReply(choiceId:string,expectedRevision=getGameState().timelineRevision){return paymentLock(()=>{
 const state=getGameState();if(state.timelineRevision!==expectedRevision || !state.sisterReminder2Sent)return false;
 const dialogue=state.sisterConversation ?? {introReplyAt:null,questionSentAt:null,questionRead:false,choiceId:null,choiceAt:null,typingUntil:null,commonRepliesSent:0,readReplyCount:0,completedAt:null,completionRead:false};
 const now=Math.max(Date.now(),(state.sisterReminder2SentAt??0)+10);
 if(choiceId===sisterDialogue.initialReply.id){if(dialogue.introReplyAt!==null)return false;save({sisterConversation:{...dialogue,introReplyAt:now},wechatReplies:replyHistory(state,sisterDialogue.initialReply.messageId,choiceId,sisterDialogue.initialReply.text,now)});return true;}
 if(dialogue.questionSentAt===null || dialogue.choiceId!==null || !sisterDialogue.detailReplies.some(r=>r.id===choiceId))return false;
 const choiceAt=Math.max(now,dialogue.questionSentAt+10);const reply=sisterDialogue.detailReplies.find(r=>r.id===choiceId)!;save({sisterConversation:{...dialogue,choiceId,choiceAt,branchRepliesEnabled:true,typingUntil:choiceAt+presentation.newMessageIntervalMs},wechatReplies:replyHistory(state,reply.messageId,choiceId,reply.text,choiceAt)});return true;
});}
export function completeSisterConversation(expectedRevision=getGameState().timelineRevision){return paymentLock(()=>{
 const state=getGameState();const dialogue=state.sisterConversation;
 if(state.timelineRevision!==expectedRevision || !state.sisterReminder2Sent || !dialogue || dialogue.completedAt!==null)return;
 const now=Date.now();
 if(dialogue.introReplyAt!==null&&dialogue.questionSentAt===null&&now>=dialogue.introReplyAt+presentation.newMessageIntervalMs){save({sisterConversation:{...dialogue,questionSentAt:dialogue.introReplyAt+presentation.newMessageIntervalMs,questionRead:false}});return;}
 if(!dialogue.choiceId || dialogue.typingUntil===null || now<dialogue.typingUntil)return;
 const replies=secondReminderReplies(dialogue);const count=Math.min(replies.length,1+Math.floor((now-dialogue.typingUntil)/presentation.newMessageIntervalMs));
 if(count>dialogue.commonRepliesSent)save({sisterConversation:{...dialogue,commonRepliesSent:count,completedAt:count===replies.length?dialogue.typingUntil+(count-1)*presentation.newMessageIntervalMs:null,completionRead:false}});
});}
export function nextSisterReplyAt(state=getGameState()){
 const d=state.sisterConversation;if(!d||d.completedAt!==null)return null;
 if(d.introReplyAt!==null&&d.questionSentAt===null)return d.introReplyAt+presentation.newMessageIntervalMs;
 return d.typingUntil!==null?d.typingUntil+d.commonRepliesSent*presentation.newMessageIntervalMs:null;
}
async function paymentLock<T>(fn:()=>T):Promise<T> {
 if(navigator.locks)return navigator.locks.request('leaving-school-day:library-payment',fn);
 return fn();
}
export function beginLibraryPayment(confirmed:boolean,expectedRevision=getGameState().timelineRevision){return paymentLock(()=>{
 const state=getGameState();
 const owner=state.privateCommission.owner;
 const informed=informedSettlementPending(state);
 const needsFinalChoice=owner.nodeId==='OWNER_FINAL_CHOICE'||!!owner.choice;
 if(state.timelineRevision!==expectedRevision||!state.authenticated||!confirmed||state.ending||(needsFinalChoice&&!informed))return false;
 if(state.libraryPayment)return true;
 save({...(!informed?{paymentCheckpoint:checkpoint(state)}:{}),confirmedResponsibility:true,libraryPayment:{id:'library-settlement',status:'processing',startedAt:Date.now(),completedAt:null,eligibleForNE:!informed,...(informed?{outcome:'he' as const}:{})}});return true;
});}
export function completeLibraryPayment(expectedRevision=getGameState().timelineRevision){return paymentLock(()=>{
 const state=getGameState();const payment=state.libraryPayment;
 if(state.timelineRevision!==expectedRevision || !state.authenticated || !state.confirmedResponsibility || !payment || state.ending || (state.privateCommission.owner.choice&&payment.outcome!=='he') || (payment.outcome==='he'&&!informedSettlementPending(state)) || payment.status==='completed' || Date.now()<payment.startedAt+PAYMENT_PROCESS_MS)return;
 if(payment.outcome==='he'){const now=Date.now();save({libraryPayment:{...payment,status:'completed',completedAt:now,eligibleForNE:false},privateCommission:{...state.privateCommission,informedCompletedAt:now,hePresentation:{...emptyHermitage(),stage:'cg',startedAt:now,cgIndex:hermitageBundle.cg.scenes.length-1,cgStartedAt:now}},ending:'he-ai-you-suo-gui'});return;}
 save({libraryPayment:{...payment,status:'completed',completedAt:Date.now(),eligibleForNE:true},ending:state.ending ?? 'ne-graduation'});
});}
export function canShowNE(state=getGameState()){return state.authenticated && state.ending==='ne-graduation' && state.confirmedResponsibility && state.libraryPayment?.status==='completed';}
export function beginEndingPresentation(){const state=getGameState();if(canShowNE(state) && state.endingStartedAt===null)save({endingStartedAt:Date.now()});}
export function continueNeReceipt(){if(canShowNE()&&getGameState().neReceiptContinuedAt===null)save({neReceiptContinuedAt:Date.now()});}
export function finishEndingPresentation(){if(canShowNE() && !getGameState().endingPresentationComplete)save({endingPresentationComplete:true});}


function checkpoint(state:GameState):PaymentCheckpoint {
 const {collectedEndings,timelineRevision,paymentCheckpoint,hermitageCheckpoint,ownerRewindCheckpoint,endingCollectionVersion,...progress}=state;
 return {...progress,confirmedResponsibility:false,libraryPayment:null,ending:null,endingStartedAt:null,neReceiptContinuedAt:null,endingPresentationComplete:false};
}
export function restorePaidEnding(){
 const state=getGameState();const payment=state.libraryPayment;
 if(payment?.outcome==='he'||(state.ending&&state.ending!=='ne-graduation')||state.privateCommission.owner.choice)return;
 if(state.authenticated && state.confirmedResponsibility && payment?.id==='library-settlement' && payment.status==='completed' && Number.isFinite(payment.completedAt) && (!state.ending || !state.paymentCheckpoint)){
  save({libraryPayment:{...payment,eligibleForNE:true},ending:state.ending ?? 'ne-graduation',paymentCheckpoint:state.paymentCheckpoint ?? checkpoint(state)});
 }
}
export function hasCollectedNE(state=getGameState()){return state.collectedEndings.includes('ne-graduation');}
export function restartGame(){
 const state=getGameState();commit({...empty(),endingCollectionVersion:1,ownerRewindCheckpoint:ownerChoiceCheckpoint(state),lastEndingId:menuEndingId(state),collectedEndings:state.collectedEndings,paymentCheckpoint:state.paymentCheckpoint,hermitageCheckpoint:state.hermitageCheckpoint??buildHermitageChoiceCheckpoint(state),timelineRevision:state.timelineRevision+1});
}
export function rewindToPayment(){
 const state=getGameState();if(!hasCollectedNE(state) || !state.paymentCheckpoint)return false;
 commit({...empty(),...state.paymentCheckpoint,confirmedResponsibility:false,libraryPayment:null,ending:null,endingStartedAt:null,neReceiptContinuedAt:null,endingPresentationComplete:false,authenticated:true,oaHomeEntered:true,endingCollectionVersion:1,ownerRewindCheckpoint:ownerChoiceCheckpoint(state),lastEndingId:menuEndingId(state),collectedEndings:state.collectedEndings,paymentCheckpoint:state.paymentCheckpoint,hermitageCheckpoint:state.hermitageCheckpoint??buildHermitageChoiceCheckpoint(state),timelineRevision:state.timelineRevision+1});return true;
}

// Older HE saves predate the branch checkpoint. Recover only the already-sent
// common conversation; discard the A choice, goodbye, CG and active settlement.
function buildHermitageChoiceCheckpoint(state:GameState):PaymentCheckpoint|null{
 if(!state.collectedEndings.includes('he-ai-you-suo-gui'))return null;
 const d=hermitageBundle.dialogue,p=state.hermitage2025,now=Date.now();
 // This is explicit replay of an earned chapter, not a new reading/completion
 // flag for sister/2021 history. Preserve the real prerequisite flags as saved.
 let replay:any={...emptyHermitage(),openingConfirmedAt:p.openingConfirmedAt??now,startedAt:p.startedAt??now,nodeId:d.entryNodeId,nextAt:now};
 const budget=d.nodes.reduce((n,node)=>n+(node.messages?.length??0),0)+d.nodes.length+2;
 for(let i=0;i<budget;i++){if(replay.waitingMessageId)replay.manualMessageId=replay.waitingMessageId;replay=tickHermitage(replay,d,Math.max(now,replay.nextAt??now));if(replay.nodeId==='H25_CHOICE')break;}
 if(replay.nodeId!=='H25_CHOICE')return null;
 replay.emitted=replay.emitted.map((m:{id:string;at:number})=>p.emitted.find((old:{id:string})=>old.id===m.id)??m);
 return {...checkpoint(state),hermitageRewindGranted:true,privateCommission:emptyPrivate(),hermitage2025:replay};
}
export function menuEndingId(state=getGameState()){
 // The active run wins over collection history. Rewinding keeps that selection.
 if(state.ending&&state.collectedEndings.includes(state.ending))return state.ending;
 if(state.lastEndingId&&state.collectedEndings.includes(state.lastEndingId))return state.lastEndingId;
 return state.collectedEndings.at(-1)??null;
}
export function canRewindHermitage(state=getGameState()){return menuEndingId(state)==='he-ai-you-suo-gui';}
export function preferHermitageRewind(state=getGameState()){return menuEndingId(state)==='he-ai-you-suo-gui';}

export function rewindToHermitageChoice(){
 const state=getGameState(),saved=state.hermitageCheckpoint??buildHermitageChoiceCheckpoint(state);if(!canRewindHermitage(state)||!saved)return false;
 commit(withConfrontationState({...empty(),...structuredClone(saved),hermitageRewindGranted:true,confirmedResponsibility:false,libraryPayment:null,ending:null,endingStartedAt:null,neReceiptContinuedAt:null,endingPresentationComplete:false,endingCollectionVersion:1,ownerRewindCheckpoint:ownerChoiceCheckpoint(state),lastEndingId:menuEndingId(state),collectedEndings:state.collectedEndings,paymentCheckpoint:state.paymentCheckpoint,hermitageCheckpoint:saved,timelineRevision:state.timelineRevision+1}));return true;
}

export function markBookstoreEvent(kind:'visited'|'searched'|'product'|'messages'|'image',id?:string){
 const progress=getGameState().bookstoreProgress;const next={...progress};
 if(kind==='visited'||kind==='searched'){if(progress[kind])return;next[kind]=true;}
 else{const key=kind==='product'?'products':kind==='messages'?'messageProducts':'imageIds';if(!id||progress[key].includes(id))return;next[key]=[...progress[key],id];}
 save({bookstoreProgress:next});
}


export function saveArchiveProgress(progress:ArchiveProgress){const archive=normalizeArchiveProgress(progress,archivePuzzle);save({archive,archivePuzzleCompleted:archive.archivePuzzleCompleted});}

function withConfrontationState(state:GameState):GameState{
 const s=normalizeConfrontation(state.sisterConfrontation3,confrontationBundle.dialogue);const reading=confrontationBundle.reading;
 const read=Array.isArray(state.ningReadMessageIds)?[...new Set(state.ningReadMessageIds.filter(id=>reading.requiredReadMessageIds.includes(id)))]:[];
 const done=!!state.ningHistoryReadCompleted||reading.requiredReadMessageIds.every(id=>read.includes(id));
 return {...state,privateCommission:normalizePrivate(state.privateCommission),hermitage2025:state.ending?normalizeHermitage(state.hermitage2025):resumeHermitageFollowup(state.hermitage2025),ningReadMessageIds:read,ningHistoryReadCompleted:done,sisterConfrontation3:s,sisterConfrontation3Queued:done&&s.startedAt===null,sisterConfrontation3Started:s.startedAt!==null,sisterConfrontation3Completed:s.completedAt!==null,sisterConfrontation3NodeId:s.nodeId,sisterConfrontation3SelectedOptions:s.selectedOptions,sisterManuscriptViewed:s.manuscriptViewedAt!==null,hermitageFollowupAvailable:s.completedAt!==null&&s.manuscriptViewedAt!==null};
}
export function markNingMessagesVisible(threadId:string,ids:string[]){
 const state=getGameState(),rule=confrontationBundle.reading;const thread=mailThreads.items.find(t=>t.id===threadId);
 if(rule.threadId!==threadId||!thread||state.bookstoreMember.accountId!==thread.accountId)return;
 const read=[...new Set([...state.ningReadMessageIds,...ids.filter(id=>rule.requiredReadMessageIds.includes(id))])];
 if(read.length!==state.ningReadMessageIds.length){save({ningReadMessageIds:read});if(!state.ningHistoryReadCompleted&&getGameState().ningHistoryReadCompleted)window.dispatchEvent(new CustomEvent(rule.completionEventId));}
}
export function secondReminderFinishedAndRead(state=getGameState()){
 const d=state.sisterConversation;return !!(state.sisterReminder2Read&&d?.completedAt!==null&&d?.completedAt!==undefined&&d.completionRead&&d.readReplyCount>=secondReminderReplies(d).length);
}
export function nextConfrontationAt(state=getGameState()){
 const s=state.sisterConfrontation3;if(s.completedAt!==null||state.ending)return null;
 if(s.startedAt!==null)return s.nextAt;
 if(!state.ningHistoryReadCompleted||!secondReminderFinishedAndRead(state))return null;
 return s.eligibleAt===null?Date.now():s.eligibleAt+confrontationBundle.dialogue.queueDelayMs;
}
export function advanceConfrontation(expectedRevision=getGameState().timelineRevision){return paymentLock(()=>{
 const state=getGameState();if(state.timelineRevision!==expectedRevision||state.ending)return;let s=state.sisterConfrontation3;const now=Date.now();
 if(s.startedAt===null){if(!state.ningHistoryReadCompleted||!secondReminderFinishedAndRead(state))return;if(s.eligibleAt===null){save({sisterConfrontation3:{...s,eligibleAt:now}});return;}if(now<s.eligibleAt+confrontationBundle.dialogue.queueDelayMs)return;s={...s,startedAt:now,nodeId:confrontationBundle.dialogue.startNodeId,nextAt:now};}
 const next=tickConfrontation(s,confrontationBundle.dialogue,now);if(JSON.stringify(next)!==JSON.stringify(state.sisterConfrontation3)){save({sisterConfrontation3:next});if(next.completedAt!==null&&state.sisterConfrontation3.completedAt===null)window.dispatchEvent(new CustomEvent('sister_confrontation_3_completed'));}
});}
export function chooseSisterConfrontation(optionId:string,expectedRevision=getGameState().timelineRevision){return paymentLock(()=>{const state=getGameState();if(state.timelineRevision!==expectedRevision||state.ending)return;const next=chooseConfrontation(state.sisterConfrontation3,confrontationBundle.dialogue,optionId,Date.now());if(JSON.stringify(next)!==JSON.stringify(state.sisterConfrontation3)){const option=confrontationBundle.dialogue.nodes.flatMap(n=>n.options??[]).find(o=>o.id===optionId)!;save({sisterConfrontation3:next,wechatReplies:replyHistory(state,option.messageId,optionId,option.text,next.emitted.find(e=>e.id===option.messageId)!.at)});}});}
export function viewSisterManuscript(){const state=getGameState();const next=viewConfrontationManuscript(state.sisterConfrontation3,confrontationBundle.dialogue,Date.now());if(JSON.stringify(next)!==JSON.stringify(state.sisterConfrontation3))save({sisterConfrontation3:next});}
export function sisterConfrontationMessages(){return confrontationEntries(getGameState().sisterConfrontation3,confrontationBundle);}
export function hasUnreadConfrontation(state=getGameState()){return confrontationEntries(state.sisterConfrontation3,confrontationBundle).some(m=>m.speakerId==='linyuan'&&!state.sisterConfrontation3.readIncomingIds.includes(m.id));}
export function markConfrontationRead(){const state=getGameState(),ids=confrontationEntries(state.sisterConfrontation3,confrontationBundle).filter(m=>m.speakerId==='linyuan').map(m=>m.id);if(ids.some(id=>!state.sisterConfrontation3.readIncomingIds.includes(id)))save({sisterConfrontation3:{...state.sisterConfrontation3,readIncomingIds:ids}});}

export function hermitage2025Available(s=getGameState()){return s.ending!=='ne-graduation'&&((s.sisterConfrontation3Completed&&s.sisterManuscriptViewed)||s.hermitageRewindGranted);}
export function privateCommissionAvailable(s=getGameState()){return hermitage2025Available(s)&&s.hermitage2025.stage==='commission';}
export function startHermitage2025(){return paymentLock(()=>{const s=getGameState();if(!hermitage2025Available(s)||!hermitageReady(hermitageBundle)||s.bookstoreMember.accountId!==hermitageBundle.dialogue.accountId||s.hermitage2025.startedAt!==null||s.ending)return;const now=Date.now();save({hermitage2025:tickHermitage({...emptyHermitage(),openingConfirmedAt:now,startedAt:now,manualMessageId:hermitageBundle.dialogue.openingMessageId,nodeId:hermitageBundle.dialogue.entryNodeId,nextAt:now},hermitageBundle.dialogue,now)});});}
export function advanceHermitage2025(expected=getGameState().timelineRevision){return paymentLock(()=>{const s=getGameState();if(s.timelineRevision!==expected||!hermitage2025Available(s)||s.bookstoreMember.accountId!==hermitageBundle.dialogue.accountId||s.hermitage2025.startedAt===null||s.hermitage2025.stage!=='chat'||s.ending)return;const next=tickHermitage(s.hermitage2025,hermitageBundle.dialogue,Date.now());if(JSON.stringify(next)!==JSON.stringify(s.hermitage2025)){save({hermitage2025:next});if(next.completedAt!==null&&s.hermitage2025.completedAt===null){for(const event of hermitageBundle.dialogue.completionEvents)window.dispatchEvent(new CustomEvent(event));if(next.stage==='commission')window.dispatchEvent(new CustomEvent('privateCommissionAccessGranted'));}}});}
export function getHePresentation(s=getGameState()):any{return s.privateCommission.informedCompletedAt?s.privateCommission.hePresentation:s.hermitage2025;}
export function canPlayHeCg(s=getGameState()){if(s.ending&&s.ending!=='he-ai-you-suo-gui')return false;if(s.privateCommission.informedCompletedAt&&s.privateCommission.owner.choice==='OWNER_OPTION_A')return true;return hermitage2025Available(s)&&s.hermitage2025.choice==='H25_OPTION_A'&&['cg','ending'].includes(s.hermitage2025.stage);}
export function advanceHeCg(expected=getGameState().timelineRevision,continueReceipt=false){return paymentLock(()=>{const s=getGameState();if(s.timelineRevision!==expected||!canPlayHeCg(s)||getHePresentation(s).stage!=='cg'||!s.authenticated)return;const p={...getHePresentation(s)},scene=hermitageBundle.cg.scenes[p.cgIndex];if(!scene)return;const now=Date.now();if(scene.view==='receipt'?!continueReceipt:continueReceipt||now<(p.cgStartedAt??now)+scene.durationMs)return;const patch:Partial<GameState>={};
 if(scene.eventId==='acknowledge-liability'){patch.confirmedResponsibility=true;patch.libraryPayment={id:'library-settlement',status:'processing',startedAt:now,completedAt:null,eligibleForNE:false,outcome:'he'};}
 if(scene.view==='payment'&&s.confirmedResponsibility&&s.libraryPayment?.outcome==='he')patch.libraryPayment={...s.libraryPayment,status:'completed',completedAt:s.libraryPayment.completedAt??now,eligibleForNE:false,outcome:'he'};
 if(scene.eventId==='settle-library'){if(!s.confirmedResponsibility||s.libraryPayment?.outcome!=='he')return;patch.libraryPayment={...s.libraryPayment,status:'completed',completedAt:s.libraryPayment.completedAt??now,eligibleForNE:false,outcome:'he'};}
 p.cgIndex++;p.cgStartedAt=now;if(p.cgIndex>=hermitageBundle.cg.scenes.length){p.cgCompletedAt=now;p.stage='ending';p.endingStartedAt=now;p.endingSceneIndex=0;p.endingSceneId=hermitageBundle.ending.scenes[0].sceneId;patch.ending='he-ai-you-suo-gui';}save({...patch,...(s.privateCommission.informedCompletedAt?{privateCommission:{...s.privateCommission,hePresentation:p}}:{hermitage2025:p})});
});}
export function setHeScene(index:number,scrollTop=0){const s=getGameState(),progress=getHePresentation(s);if(!canPlayHeCg(s)||progress.stage!=='ending')return;const last=hermitageBundle.ending.scenes.length-1;if(!Number.isInteger(index)||index<0||index>last)return;const next={...progress,endingSceneIndex:index,endingSceneId:hermitageBundle.ending.scenes[index].sceneId,endingScrollTop:scrollTop,...(index===last?{endingViewedAt:progress.endingViewedAt??Date.now()}:{})};save(s.privateCommission.informedCompletedAt?{privateCommission:{...s.privateCommission,hePresentation:next}}:{hermitage2025:next});}


export function privateAccess(s=getGameState()){return privateCommissionAvailable(s)&&s.bookstoreMember.accountId===hermitageBundle.dialogue.accountId;}
export function saveVerificationAnswers(values:string[]){if(!privateAccess())return;const answers=emptyPrivate().answers.map((_,i)=>/^\d+$/.test(values[i])?values[i]:'');save({privateCommission:{...getGameState().privateCommission,answers}});}
export function verifyPrivateCommission(){return paymentLock(()=>{const s=getGameState();if(!privateAccess(s)||!answersCorrect(s.privateCommission.answers,privateBundle.verification))return false;if(!s.privateCommission.verifiedAt)save({privateCommission:{...s.privateCommission,verifiedAt:Date.now()}});return true;});}
export function ownerAccess(s=getGameState()){return privateAccess(s)&&!!s.privateCommission.verifiedAt;}
export function startOwnerConversation(){return paymentLock(()=>{const s=getGameState();if(!ownerAccess(s)||s.privateCommission.owner.startedAt!==null||s.ending)return;const now=Date.now();save({privateCommission:{...s.privateCommission,owner:tickOwner({...emptyHermitage(),openingConfirmedAt:now,startedAt:now,nodeId:privateBundle.dialogue.entryNodeId,nextAt:now},privateBundle.dialogue,now,false)}});});}
export function advanceOwnerConversation(expected=getGameState().timelineRevision){return paymentLock(()=>{const s=getGameState(),p=s.privateCommission;if(s.timelineRevision!==expected||!ownerAccess(s)||s.ending||p.owner.startedAt===null||s.libraryPayment?.status==='processing')return;const owner=tickOwner(p.owner,privateBundle.dialogue,Date.now(),!!p.archiveReadAt);if(JSON.stringify(owner)===JSON.stringify(p.owner))return;const patch:Partial<GameState>={privateCommission:{...p,owner}};if(owner.stage==='invitation'&&owner.finalChoiceVersion===2){patch.ending='te-unfinished-pact';}if(owner.stage==='be'){patch.ending='be-unauthorized-tomorrow';}save(patch);});}
export function chooseOwnerReply(id:string,expected=getGameState().timelineRevision){return paymentLock(()=>{const s=getGameState(),p=s.privateCommission;if(s.timelineRevision!==expected||!ownerAccess(s)||!p.archiveReadAt||s.ending||s.libraryPayment)return;const owner=chooseOwner(p.owner,privateBundle.dialogue,id,Date.now());if(JSON.stringify(owner)!==JSON.stringify(p.owner))save({privateCommission:{...p,owner,ownerCheckpoint:structuredClone(p.owner)}});});}
export function ownerArchiveAvailable(s=getGameState()){return ownerAccess(s)&&(!!s.privateCommission.archiveOpenedAt||privateBundle.dialogue.nodes.find(n=>n.nodeId===s.privateCommission.owner.nodeId)?.nodeType==='archive');}
export function openOwnerArchive(){const s=getGameState();if(ownerArchiveAvailable(s)&&!s.privateCommission.archiveOpenedAt)save({privateCommission:{...s.privateCommission,archiveOpenedAt:Date.now()}});}
export function readOwnerArchive(reachedEnd:boolean){const s=getGameState(),p=s.privateCommission;if(!reachedEnd||!ownerArchiveAvailable(s)||!p.archiveOpenedAt||p.archiveReadAt)return;save({privateCommission:{...p,archiveReadAt:Date.now(),owner:p.owner.completedAt===null?{...p.owner,nextAt:Date.now()}:p.owner}});}
export function ownerInvitationAvailable(s=getGameState()){return ownerAccess(s)&&s.privateCommission.owner.stage==='invitation'&&s.ending!=='te-unfinished-pact';}
export function viewOwnerInvitation(){const s=getGameState();if(ownerInvitationAvailable(s)&&!s.privateCommission.invitationViewedAt)save({privateCommission:{...s.privateCommission,invitationViewedAt:Date.now()}});}
export function informedSettlementPending(s=getGameState()){return ownerAccess(s)&&s.privateCommission.owner.choice==='OWNER_OPTION_A'&&s.privateCommission.owner.stage==='oa'&&!!s.privateCommission.archiveReadAt&&!s.privateCommission.informedCompletedAt;}
export function beAvailable(s=getGameState()){return s.ending==='be-unauthorized-tomorrow'&&s.privateCommission.owner.stage==='be';}
export function saveBeScene(sceneId:string,scrollTop:number){const s=getGameState();if(!beAvailable(s)||!privateBundle.ending.scenes.some(scene=>scene.sceneId===sceneId))return;save({privateCommission:{...s.privateCommission,be:{...s.privateCommission.be,sceneId,scrollTop,...(sceneId===privateBundle.ending.scenes.at(-1)!.sceneId?{viewedAt:s.privateCommission.be.viewedAt??Date.now()}:{})}}});}
function ownerChoiceCheckpoint(state:GameState):PaymentCheckpoint|null{
 if(state.ownerRewindCheckpoint)return state.ownerRewindCheckpoint;
 if(!state.privateCommission.ownerCheckpoint)return null;
 return {...checkpoint(state),privateCommission:{...state.privateCommission,owner:structuredClone(state.privateCommission.ownerCheckpoint),be:emptyPrivate().be,te:emptyPrivate().te,invitationViewedAt:null,informedCompletedAt:null,hePresentation:emptyHermitage()}};
}
export function canRewindOwnerChoice(state=getGameState()){
 const ending=menuEndingId(state);
 return ending!==null&&ending!=='ne-graduation'&&!!ownerChoiceCheckpoint(state);
}
export function rewindOwnerChoice(){
 const state=getGameState(),saved=ownerChoiceCheckpoint(state);
 if(!saved||!canRewindOwnerChoice(state))return false;
 commit(withConfrontationState({...state,...structuredClone(saved),endingCollectionVersion:1,ownerRewindCheckpoint:saved,lastEndingId:menuEndingId(state),timelineRevision:state.timelineRevision+1}));
 return true;
}
export function collectEnding(id:NonNullable<GameState['ending']>){
 const state=getGameState();
 if(state.ending!==id||state.collectedEndings.includes(id))return false;
 const ownerRewindCheckpoint=id!=='ne-graduation'&&state.privateCommission.ownerCheckpoint
  ? ownerChoiceCheckpoint({...state,ownerRewindCheckpoint:null})
  : state.ownerRewindCheckpoint;
 save({endingCollectionVersion:1,collectedEndings:[...state.collectedEndings,id],lastEndingId:id,ownerRewindCheckpoint});
 return true;
}


export function secondReminderReplies(d:SisterConversation){const branch=sisterDialogue.branchReplies[d.choiceId as keyof typeof sisterDialogue.branchReplies];return d.branchRepliesEnabled&&branch?[branch,...sisterDialogue.commonReplies]:sisterDialogue.commonReplies;}

export function sendPendingDialogue(kind:'sister'|'hermitage'|'owner'){const s=getGameState();const p:any=kind==='sister'?s.sisterConfrontation3:kind==='hermitage'?s.hermitage2025:s.privateCommission.owner;if(!p.waitingMessageId||s.ending)return;const next={...p,manualMessageId:p.waitingMessageId,waitingMessageId:null,nextAt:Date.now()};if(kind==='sister')save({sisterConfrontation3:next});else if(kind==='hermitage')save({hermitage2025:next});else save({privateCommission:{...s.privateCommission,owner:next}});}

export function saveTrueCast(finished=false){
 const state=getGameState();
 if(state.ending!=='te-unfinished-pact')return;
 const progress=state.privateCommission.te;
 const now=Date.now();
 save({privateCommission:{...state.privateCommission,te:{castStartedAt:progress.castStartedAt??now,castFinishedAt:finished?progress.castFinishedAt??now:progress.castFinishedAt}}});
}

/** Recover a run that paid after taking the retired Ning-to-OA route. */
export function recoverRetiredHermitageRoute(){
 return paymentLock(()=>{
  const state=getGameState();
  const progress=state.hermitage2025;
  const unlocked=(state.sisterConfrontation3Completed&&state.sisterManuscriptViewed)||state.hermitageRewindGranted;
  if(state.ending!=='ne-graduation'||!unlocked||!(progress.stage==='oa'||progress.choice==='H25_OPTION_A'))return false;
  save({...checkpoint(state),lastEndingId:state.ending,hermitage2025:resumeHermitageFollowup(progress),timelineRevision:state.timelineRevision+1});
  return true;
 });
}
