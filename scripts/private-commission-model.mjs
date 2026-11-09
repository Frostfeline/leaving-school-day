import {holdPlayer,readingDelay} from './dialogue-pacing.mjs';
import {emptyHermitage,normalizeHermitage,hermitageEntries,chooseHermitage} from './hermitage-2025-model.mjs';
export const privatePaths={verification:'bookstore/private/verification',dialogue:'bookstore/private/owner-dialogue-2025',archive:'bookstore/private/commission-archive-2021',invitation:'bookstore/private/invitation',ending:'endings/be-unauthorized-tomorrow',trueEnding:'endings/te-unfinished-pact',cast:'endings/te-cast',ui:'bookstore/private/ui'};
export const emptyPrivate=()=>({answers:['','','',''],verifiedAt:null,owner:emptyHermitage(),archiveOpenedAt:null,archiveReadAt:null,invitationViewedAt:null,informedCompletedAt:null,hePresentation:emptyHermitage(),be:{sceneId:null,scrollTop:0,viewedAt:null},ownerCheckpoint:null,te:{castStartedAt:null,castFinishedAt:null}});
export function normalizePrivate(value){const p={...emptyPrivate(),...(value&&typeof value==='object'?value:{})};const stored=Array.isArray(p.answers)?p.answers:[];const fields=stored.length===3?[stored[0],'','',stored[2]]:stored;p.answers=emptyPrivate().answers.map((_,i)=>typeof fields[i]==='string'&&/^\d+$/.test(fields[i])?fields[i]:'');p.owner=normalizeOwner(p.owner);p.hePresentation=normalizeHermitage(p.hePresentation);p.be={...emptyPrivate().be,...p.be};p.te={...emptyPrivate().te,...p.te};return p;}
export const OWNER_BE_EXIT_MESSAGE_ID='owner_branch_b-final-25';
const usesSlowPlayback=p=>!!p.finalChoiceVersion&&['OWNER_BRANCH_B','OWNER_BRANCH_C'].includes(p.nodeId);
export function normalizeOwner(value){
 const p=normalizeHermitage(value);
 if(['oa','invitation','be'].includes(value?.stage))p.stage=value.stage;
 // Resume older saves that paused at a line now set to play automatically.
 const removedPrompt=['owner_branch_b-final-10','owner-c-21','owner-c-22','owner-c-23'].includes(p.waitingMessageId);
 if(removedPrompt||usesSlowPlayback(p)&&p.waitingMessageId&&p.waitingMessageId!==OWNER_BE_EXIT_MESSAGE_ID){
  p.waitingMessageId=null;
  p.nextAt=0;
 }
 return p;
}
export const verificationFields=q=>q.answerParts??[{answer:q.answer,unit:''}];
export function answersCorrect(answers,verification){
 const fields=verification.questions.flatMap(verificationFields);
 return Array.isArray(answers)&&answers.length===fields.length&&fields.every(({answer},i)=>answers[i]===answer);
}
export function tickOwner(value,d,now,archiveRead=false){
 const p=structuredClone(normalizeOwner(value));
 if(p.completedAt!==null||p.nextAt!==null&&p.nextAt>now)return p;
 for(let i=0;i<=d.nodes.length;i++){
  const n=d.nodes.find(n=>n.nodeId===p.nodeId);
  if(!n)return p;
  if(n.nodeType==='choice'){p.nextAt=null;return p;}
  if(n.nodeType==='archive'){if(!archiveRead){p.nextAt=null;return p;}p.nodeId=n.nextNodeId;continue;}
  if(n.nodeType==='messages'){
   const legacyBranch=!p.finalChoiceVersion&&p.choice&&n.nodeId==='OWNER_BRANCH_'+p.choice.at(-1);
   const messages=legacyBranch&&n.legacyMessages?.length?n.legacyMessages:n.messages;
   const index=messages.findIndex(m=>!p.emitted.some(e=>e.id===m.messageId));
   if(index<0){p.nodeId=n.nextNodeId;continue;}
   const m=messages[index], slow=usesSlowPlayback(p), exit=m.messageId===OWNER_BE_EXIT_MESSAGE_ID;
   if(slow){
    if(exit&&p.manualMessageId!==m.messageId){p.waitingMessageId=m.messageId;p.nextAt=null;return p;}
    p.waitingMessageId=null;
   }else if(holdPlayer(p,d,m))return p;
   const nextSpeaker=messages[index+1]?.speakerId;
   const pause=nextSpeaker===m.speakerId?0:nextSpeaker==='owner'?1900:1300;
   const slowDelay=Math.round(Math.max(3300,Math.min(9500,2000+[...m.text].length*70))*(m.speakerId==='owner'?(d.npcDelayMultiplier??1):1))+pause;
   p.emitted.push({id:m.messageId,at:now});
   p.nextAt=now+(slow?(exit?1200:slowDelay):readingDelay(d,m));
   return p;
  }
  if(n.nodeType==='action'){
   const action=!p.finalChoiceVersion&&p.choice==='OWNER_OPTION_B'?'grant-invitation':!p.finalChoiceVersion&&p.choice==='OWNER_OPTION_C'?'begin-be':n.actionId;
   p.stage=action==='informed-settlement'?'oa':action==='grant-invitation'?'invitation':'be';
   p.completedAt=now;
   p.nextAt=null;
   return p;
  }
 }
 return p;
}
export function ownerEntries(progress,dialogue){
 const entries=hermitageEntries(progress,dialogue);
 if(progress.finalChoiceVersion||!progress.choice)return entries;
 const option=dialogue.nodes.flatMap(node=>node.options??[]).find(option=>option.id===progress.choice);
 return option?.legacyText?entries.map(message=>message.id===option.messageId?{...message,text:option.legacyText}:message):entries;
}
export function chooseOwner(value,d,id,now){
 const p=normalizeOwner(value);
 if(p.choice||p.completedAt!==null)return p;
 const chosen=chooseHermitage(p,d,id,now);
 if(!chosen.choice)return chosen;
 chosen.finalChoiceVersion=2;
 if(usesSlowPlayback(chosen))chosen.nextAt=now+4600;
 return chosen;
}
export function validatePrivate(b,wechatMessages=[]){
 const fail=p=>{throw Error('private-commission: '+p);},text=(v,p)=>{if(typeof v!=='string'||!v.trim())fail(p);};for(const key of Object.keys(privatePaths))if(b[key]?.schemaVersion!==1)fail(key+'.schemaVersion');
 const v=b.verification;if(!Array.isArray(v.description)||!v.description.length)fail('verification.description');if(!Array.isArray(b.archive.fields)||!b.archive.fields.length||!Array.isArray(b.invitation.fields)||!b.invitation.fields.length)fail('archive/invitation.fields');for(const f of [...b.archive.fields,...b.invitation.fields]){text(f.label,'field.label');if(!f.characterRef&&!f.valueRef)text(f.text,'field.text');if(f.characterRef&&!['linchen','luoyao'].includes(f.characterRef))fail('field.characterRef');}if(v.questions?.length!==3||new Set(v.questions.map(q=>q.questionId)).size!==3)fail('questions');for(const q of v.questions){for(const k of ['questionId','label','riddleText'])text(q[k],'question.'+k);if(q.promptText!==''||!q.description)text(q.promptText,'question.promptText');if(q.answerParts!==undefined&&(!Array.isArray(q.answerParts)||q.answerParts.length!==2||q.answerParts.some(part=>typeof part?.unit!=='string'||!part.unit.trim())))fail('answer parts');if(verificationFields(q).some(part=>typeof part.answer!=='string'||!/^\d+$/.test(part.answer))||!Array.isArray(q.evidenceRefs)||!q.evidenceRefs.length||!q.evidenceRefs.every(id=>['oa-library-record','sister-confrontation-3','sister-manuscript','memory-archive','hermitage-history'].includes(id)))fail('answer/evidence');}
 if(v.questions.flatMap(verificationFields).length!==emptyPrivate().answers.length)fail('verification field count');
 for(const k of ['title','recordId','failureMessage'])text(v[k],'verification.'+k);if(v.nextRoute!=='#/bookstore/private/owner')fail('verification route');
 const d=b.dialogue,ids=new Set(),messages=new Set();for(const n of d.nodes){text(n.nodeId,'nodeId');if(ids.has(n.nodeId))fail('duplicate nodeId');ids.add(n.nodeId);if(!['messages','archive','choice','action'].includes(n.nodeType))fail('nodeType');for(const m of n.messages??n.options??[]){text(m.messageId,'messageId');text(m.text,'text');if(messages.has(m.messageId)||!['owner','linchen','system'].includes(m.speakerId))fail('message id/speaker');messages.add(m.messageId);}if(n.nodeType==='choice'&&(n.options.length!==3||new Set(n.options.map(o=>o.id)).size!==3))fail('ABC options');}
 if(!Number.isFinite(d.messageIntervalMs)||d.messageIntervalMs<100||d.messageIntervalMs>10000)fail('messageIntervalMs');if(d.nodes.filter(n=>n.nodeType==='choice').length!==1||d.nodes.filter(n=>n.nodeType==='archive').length!==1)fail('choice/archive gate');
 const seen=new Set(),outcomes=new Map([['OWNER_OPTION_A','informed-settlement'],['OWNER_OPTION_B','begin-be'],['OWNER_OPTION_C','grant-invitation']]);function walk(id,path,read,choice){const n=d.nodes.find(n=>n.nodeId===id);if(!n||path.has(id))fail('missing node/cycle '+id);seen.add(id);const next=new Set([...path,id]);if(n.nodeType==='archive'){if(n.requiredArchiveId!==b.archive.archiveId)fail('archive reference');read=true;}if(n.nodeType==='action'){if(!read||outcomes.get(choice)!==n.actionId)fail('outcome/archive gate');return;}if(n.nodeType==='choice'){if(!read)fail('choice before archive');for(const o of n.options){if(!outcomes.has(o.id))fail('optionId');walk(o.nextNodeId,next,read,o.id);}}else walk(n.nextNodeId,next,read,choice);}walk(d.entryNodeId,new Set(),false,null);if(seen.size!==ids.size)fail('unreachable nodes');
 if(b.archive.requireEnd!==true||!Array.isArray(b.archive.messages)||!b.archive.messages.length)fail('archive reading gate');const archiveIds=new Set();for(const m of b.archive.messages){text(m.messageId,'archive.messageId');text(m.text,'archive.text');if(archiveIds.has(m.messageId)||!['luoyao','owner'].includes(m.speakerId))fail('archive identity');archiveIds.add(m.messageId);}for(const f of b.archive.fields){if(f.valueRef&&f.valueRef!=='collectionCode')fail('shared record ref');}
 for(const ending of [b.ending,b.trueEnding]){
 const scenes=ending.scenes;if(!Array.isArray(scenes)||!scenes.length)fail('BE scenes');const sceneIds=new Set(),blockIds=new Set();for(const [i,s]of scenes.entries()){text(s.sceneId,'sceneId');if(sceneIds.has(s.sceneId)||s.nextSceneId!==(scenes[i+1]?.sceneId??null))fail('BE scene sequence');sceneIds.add(s.sceneId);if(!Array.isArray(s.blocks)||!s.blocks.length)fail('BE blocks');for(const m of s.blocks){text(m.id,'BE block id');if(!['narration','dialogue','flashbackQuote','sceneDivider','endingTitle','epigraph','silence','messageReference'].includes(m.type))fail('BE block.type');if(blockIds.has(m.id))fail('duplicate BE block');blockIds.add(m.id);if(m.type==='messageReference'){if(m.source!=='wechat'||!wechatMessages.some(w=>w.id===m.messageId))fail('WeChat reference');}else text(m.text,'BE text');if(m.speakerId&&!['linchen','linyuan','luoyao','owner'].includes(m.speakerId))fail('BE speaker');}for(const id of s.recapMessageIds??[])if(!messages.has(id))fail('BE recap');}
 }
 text(b.trueEnding.enterCast,'trueEnding.enterCast');text(b.trueEnding.replayCast,'trueEnding.replayCast');text(b.trueEnding.returnHome,'trueEnding.returnHome');
 text(b.cast.title,'CAST title');text(b.cast.closing,'CAST closing');if(!Number.isFinite(b.cast.pixelsPerSecond)||b.cast.pixelsPerSecond<1||!Number.isFinite(b.cast.holdMs)||b.cast.holdMs<1000||!b.cast.groups?.length)fail('CAST timing/groups');for(const group of b.cast.groups){text(group.title,'CAST group');if(!group.people?.length)fail('CAST people');for(const person of group.people){text(person.name,'CAST name');if(typeof person.note!=='string')fail('CAST note');}}
 for(const k of ['title','finalLabel','continue','returnHome'])text(b.ending[k],'ending.'+k);for(const k of ['paragraphDelayMs','fadeMs'])if(!Number.isFinite(b.ending[k])||b.ending[k]<0||b.ending[k]>5000)fail('ending timing');for(const scene of b.ending.scenes){if(!Number.isFinite(scene.transition?.fadeMs)||scene.transition.fadeMs<0||scene.transition.fadeMs>5000)fail('scene timing');if(scene.backgroundAssetId&&!(b.ending.assets??[]).some(a=>a.id===scene.backgroundAssetId))fail('background ref');}for(const t of v.description??[])text(t,'verification.description');if(!v.successMessages?.length)fail('verification.successMessages');for(const t of v.successMessages)text(t,'verification.successMessages');for(const k of ['ownerTitle','ownerName','submit','enterOwner','verified','openArchive','archiveRead','backOwner','openOa','openInvitation','locked','loginRequired','login','backNing','recordLabel','archiveNeedEnd','date','account'])text(b.ui[k],'ui.'+k);for(const route of ['ownerRoute','archiveRoute','invitationRoute','oaRoute','beRoute'])if(b.ui[route]!==({ownerRoute:'#/bookstore/private/owner',archiveRoute:'#/bookstore/private/archive',invitationRoute:'#/bookstore/private/invitation',oaRoute:'#/oa/notices/library-exception',beRoute:'#/ending/be'})[route])fail('route '+route);text(b.ui.archiveOwnerName,'archive owner');if(b.ui.teRoute!=='#/ending/te')fail('TE route');if(b.ui.informedEndingId!=='he-ai-you-suo-gui')fail('informed ending');
 const cues=new Set();for(const cue of b.ending.musicCues??[]){text(cue.id,'music.id');if(cues.has(cue.id)||!/^assets\/[\w/.-]+\.(mp3|ogg|wav)$/.test(cue.src)||cue.src.includes('..')||!Number.isFinite(cue.volume)||cue.volume<0||cue.volume>1||typeof cue.loop!=='boolean')fail('music cue');cues.add(cue.id);}for(const scene of b.ending.scenes){if(scene.musicCueId&&!cues.has(scene.musicCueId))fail('music ref');for(const block of scene.blocks)if(block.type==='silence'&&(!Number.isFinite(block.durationMs)||block.durationMs<0||block.durationMs>10000))fail('silence duration');}for(const asset of [...(b.ending.assets??[])])if(!/^assets\/[\w/.-]+\.(png|jpe?g|webp|svg|mp3|ogg|wav)$/.test(asset.src)||asset.src.includes('..'))fail('asset path');return true;
}
