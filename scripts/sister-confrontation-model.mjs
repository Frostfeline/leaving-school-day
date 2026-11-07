import {holdPlayer,readingDelay} from './dialogue-pacing.mjs';
export function validateConfrontation(bundle,mailMessages){
 const {dialogue,attachments,reading,ui}=bundle;const fail=(path,why)=>{throw Error('sister-confrontation/'+path+': '+why)};
 const text=(v,p)=>{if(typeof v!=='string'||!v.trim())fail(p,'必须填写文字')};
 const unique=(items,p)=>{if(!Array.isArray(items))fail(p,'必须为数组');const ids=new Set();for(const item of items){text(item.id,p+'.id');if(ids.has(item.id))fail(p+'.'+item.id,'重复ID');ids.add(item.id)};return ids;};
 for(const [key,value]of Object.entries(bundle))if(value.schemaVersion!==1)fail(key+'.schemaVersion','不支持的版本');
 for(const key of ['id','title','startNodeId','endNodeId','attachmentGateNodeId'])text(dialogue[key],'dialogue.'+key);
 for(const key of ['messageIntervalMs','queueDelayMs'])if(!Number.isFinite(dialogue[key])||dialogue[key]<100||dialogue[key]>60000)fail('dialogue.'+key,'间隔需要在100—60000毫秒');
 text(dialogue.trigger?.historyCompletionEventId,'trigger.historyCompletionEventId');if(dialogue.trigger?.secondReminderEventId!=='sister-reminder-2-completed-read')fail('trigger.secondReminderEventId','未注册的前置事件');
 if(reading.threadId!=='hermitage-history'||reading.completionEventId!==dialogue.trigger.historyCompletionEventId)fail('reading','会话或完成事件引用无效');
 if(!Array.isArray(reading.requiredReadMessageIds)||!reading.requiredReadMessageIds.length||new Set(reading.requiredReadMessageIds).size!==reading.requiredReadMessageIds.length||!reading.requiredReadMessageIds.includes(reading.lastRequiredMessageId))fail('reading.requiredReadMessageIds','主线消息ID重复、缺失或末条无效');
 if(mailMessages)for(const id of reading.requiredReadMessageIds)if(!mailMessages.some(m=>m.id===id&&m.threadId===reading.threadId))fail('reading.'+id,'历史消息不存在');
 if(!Number.isFinite(reading.visibleDwellMs)||reading.visibleDwellMs<200||reading.visibleDwellMs>5000)fail('reading.visibleDwellMs','阅读停留时间无效');
 const attachmentIds=unique(attachments.items,'attachments');for(const a of attachments.items){for(const key of ['fileName','title','src','alt'])text(a[key],'attachments.'+a.id+'.'+key);if(!/^assets\/images\/[-a-zA-Z0-9_/.]+\.(png|jpe?g|webp|svg)$/i.test(a.src)||a.src.includes('..'))fail(a.id+'.src','需要站内图片路径');if(!Array.isArray(a.paragraphs)||!a.paragraphs.length)fail(a.id+'.paragraphs','正文不能为空');a.paragraphs.forEach(p=>text(p,a.id+'.paragraphs'));}
 const nodes=dialogue.nodes,ids=unique(nodes,'nodes'),messageIds=new Set(),optionIds=new Set();
 for(const id of [dialogue.startNodeId,dialogue.endNodeId,dialogue.attachmentGateNodeId,'S3_COMMON_1','S3_COMMON_2','S3_COMMON_3','S3_END_MESSAGES'])if(!ids.has(id))fail(id,'必须保留关键节点');
 if(dialogue.endNodeId!=='S3_COMPLETE'||dialogue.attachmentGateNodeId!=='S3_MANUSCRIPT')fail('dialogue','终点和证据节点必须保留');
 const message=(m,p)=>{text(m.messageId,p+'.messageId');if(messageIds.has(m.messageId))fail(p+'.messageId','消息ID重复');messageIds.add(m.messageId);if(!['linyuan','linchen'].includes(m.speakerId))fail(p+'.speakerId','人物不存在');text(m.text,p+'.text');};
 for(const n of nodes){
  if(!['messages','choice','attachment','end'].includes(n.type))fail(n.id+'.type','无效节点类型');
  if(n.type==='messages'){if(!Array.isArray(n.messages)||(!n.messages.length&&!['S3_BRANCH_2B','S3_BRANCH_2C','S3_BRANCH_3B','S3_BRANCH_3C','S3_END_MESSAGES'].includes(n.id)))fail(n.id+'.messages','至少一条消息');n.messages.forEach(m=>message(m,n.id));}
  if(n.type==='choice'){if(n.options?.length!==3||n.options.filter(o=>!o.disabled).length!==(n.id==='S3_CHOICE_1'?3:2))fail(n.id+'.options','需要3/2/2可用选项并保留旧ID');unique(n.options,n.id+'.options');for(const o of n.options){if(optionIds.has(o.id))fail(n.id+'.options','选项ID重复');optionIds.add(o.id);message(o,n.id+'.'+o.id);if(o.speakerId!=='linchen'||!ids.has(o.nextNodeId))fail(n.id+'.options','选项说话者或目标无效');}}
  else if(n.type!=='end'&&!ids.has(n.nextNodeId))fail(n.id+'.nextNodeId','目标不存在');
  if(n.type==='attachment'){if(!attachmentIds.has(n.attachmentId)||n.speakerId!=='linyuan')fail(n.id+'.attachmentId','附件或发送者无效');message({...n,text:n.attachmentId},n.id);}
  if(n.type==='end'&&(n.id!==dialogue.endNodeId||!Array.isArray(n.completionEvents)||!n.completionEvents.includes('sister_confrontation_3_completed')))fail(n.id,'完成事件无效');
 }
 const gate=nodes.find(n=>n.id===dialogue.attachmentGateNodeId);if(gate.type!=='attachment'||gate.requireOpenBeforeNext!==true)fail(gate.id,'不得取消附件阅读门槛');
 const required=['S3_COMMON_1','S3_COMMON_2','S3_COMMON_3',gate.id,'S3_END_MESSAGES'];const reachable=new Set();
 function visit(id,path){if(path.includes(id))fail(id,'意外循环');const n=nodes.find(n=>n.id===id);reachable.add(id);const next=[...path,id];if(n.type==='end'){if(required.some(key=>!next.includes(key)))fail(id,'有分支绕过共同剧情或证据');return;}for(const target of n.type==='choice'?n.options.map(o=>o.nextNodeId):[n.nextNodeId])visit(target,next);}
 visit(dialogue.startNodeId,[]);if(reachable.size!==nodes.length)fail('nodes','存在无法从起点进入的节点');
 for(const key of ['choices','close','openImage','placeholder','missingImage','followup','followupAvailable','storageError'])text(ui[key],'ui.'+key);
 for(const key of ['followupTitle','followupPlaceholder','followupLocked','backHistory'])text(ui[key],'ui.'+key);
 for(const key of ['title','notice','node','flow','preview','text','speaker','add','remove','removeConfirm','up','down','option','target','next','attachment','fileName','titleLabel','src','alt','paragraphs','requireOpen','reading','required','last','event','trigger','historyEvent','secondEvent','interval','queue','saveDraft','saveProject','export','import','restore','restoreConfirm','importConfirm','draftSaved','unsaved','saved','invalid','failure','newText','resetPreview','continuePreview','openPreview','complete','waiting','current','upload','backup'])text(ui.editor?.[key],'ui.editor.'+key);
 for(const key of ['backEditor','auto','pause','startHere','type','previewNotice','interfaceText'])text(ui.editor?.[key],'ui.editor.'+key);
 return bundle;
}
/** @returns {import('../src/utils/sister-confrontation-content').ConfrontationProgress} */
export function emptyConfrontation(){return {nodeId:null,emitted:[],selectedOptions:{},visitedNodes:[],startedAt:null,completedAt:null,nextAt:null,eligibleAt:null,manuscriptViewedAt:null,readIncomingIds:[]};}
/** @returns {import('../src/utils/sister-confrontation-content').ConfrontationProgress} */
export function normalizeConfrontation(value,dialogue){
 const base=emptyConfrontation();if(!value||typeof value!=='object')return base;
 const known=new Set(dialogue.nodes.flatMap(n=>n.type==='messages'?[...n.messages,...(n.legacyMessages??[])].map(m=>m.messageId):n.type==='choice'?n.options.map(o=>o.messageId):n.type==='attachment'?[n.messageId]:[]));
 const currentId=id=>id==='s3_after_manuscript-10'?'s3_after_manuscript-04':id;
 const emitted=Array.isArray(value.emitted)?value.emitted.map(m=>({...m,id:currentId(m.id)})).filter((m,i,all)=>known.has(m.id)&&Number.isFinite(m.at)&&all.findIndex(x=>x.id===m.id)===i):[];
 const choices={};for(const n of dialogue.nodes.filter(n=>n.type==='choice'))if(n.options.some(o=>o.id===value.selectedOptions?.[n.id]))choices[n.id]=value.selectedOptions[n.id];
 const numeric=k=>Number.isFinite(value[k])?value[k]:null;
 return {...base,manualMessageId:value.manualMessageId??null,waitingMessageId:known.has(value.waitingMessageId)?value.waitingMessageId:null,nodeId:dialogue.nodes.some(n=>n.id===value.nodeId)?value.nodeId:numeric('startedAt')!==null?dialogue.startNodeId:null,emitted,selectedOptions:choices,visitedNodes:Array.isArray(value.visitedNodes)?value.visitedNodes.filter(id=>dialogue.nodes.some(n=>n.id===id)):[],startedAt:numeric('startedAt'),completedAt:numeric('completedAt'),nextAt:value.waitingMessageId&&!known.has(value.waitingMessageId)?0:numeric('nextAt'),eligibleAt:numeric('eligibleAt'),manuscriptViewedAt:numeric('manuscriptViewedAt'),readIncomingIds:Array.isArray(value.readIncomingIds)?[...new Set(value.readIncomingIds.map(currentId).filter(id=>known.has(id)))]:[]};
}
/** @returns {import('../src/utils/sister-confrontation-content').ConfrontationProgress} */
export function tickConfrontation(value,dialogue,now){
 const s=normalizeConfrontation(value,dialogue);if(s.startedAt===null||s.completedAt!==null||(s.nextAt!==null&&s.nextAt>now))return s;
 const emit=(id,nodeId)=>{if(!s.emitted.some(m=>m.id===id))s.emitted.push({id,nodeId,at:now});s.nextAt=now+dialogue.messageIntervalMs;};
 for(let guard=0;guard<dialogue.nodes.length+1;guard++){
  const node=dialogue.nodes.find(n=>n.id===s.nodeId);if(!node)return s;if(!s.visitedNodes.includes(node.id))s.visitedNodes.push(node.id);
  if(node.type==='choice'){const chosen=node.options.find(o=>o.id===s.selectedOptions[node.id]);if(chosen){s.nodeId=chosen.nextNodeId;continue;}s.nextAt=null;return s;}
  if(node.type==='messages'){const next=node.messages.find(m=>!s.emitted.some(e=>e.id===m.messageId));if(next){if(holdPlayer(s,dialogue,next))return s;emit(next.messageId,node.id);s.nextAt=now+readingDelay(dialogue,next);return s;}s.nodeId=node.nextNodeId;continue;}
  if(node.type==='attachment'){if(!s.emitted.some(m=>m.id===node.messageId)){emit(node.messageId,node.id);return s;}if(node.requireOpenBeforeNext&&s.manuscriptViewedAt===null){s.nextAt=null;return s;}s.nodeId=node.nextNodeId;continue;}
  s.completedAt=now;s.nextAt=null;return s;
 }return s;
}
/** @returns {import('../src/utils/sister-confrontation-content').ConfrontationProgress} */
export function chooseConfrontation(value,dialogue,optionId,now){const s=normalizeConfrontation(value,dialogue),node=dialogue.nodes.find(n=>n.id===s.nodeId);if(s.completedAt!==null||node?.type!=='choice'||s.selectedOptions[node.id])return s;const option=node.options.find(o=>o.id===optionId);if(!option||option.disabled)return s;s.selectedOptions[node.id]=option.id;s.emitted.push({id:option.messageId,nodeId:node.id,at:now});s.nodeId=option.nextNodeId;s.nextAt=now+dialogue.messageIntervalMs;return s;}
/** @returns {import('../src/utils/sister-confrontation-content').ConfrontationProgress} */
export function viewConfrontationManuscript(value,dialogue,now){const s=normalizeConfrontation(value,dialogue),gate=dialogue.nodes.find(n=>n.id===dialogue.attachmentGateNodeId);if(s.emitted.some(m=>m.id===gate.messageId)&&s.manuscriptViewedAt===null){s.manuscriptViewedAt=now;s.nextAt=now+dialogue.messageIntervalMs;}return s;}
/** @returns {Array<{id:string;nodeId:string;speakerId:string;timestamp:string;text:string;type:string;attachmentId?:string}>} */
export function confrontationEntries(value,bundle){const s=normalizeConfrontation(value,bundle.dialogue);const map=new Map();for(const n of bundle.dialogue.nodes){for(const m of [...(n.legacyMessages??[]),...(n.messages??n.options??[])])map.set(m.messageId,{...m,type:'text'});if(n.type==='attachment'){const a=bundle.attachments.items.find(a=>a.id===n.attachmentId);map.set(n.messageId,{speakerId:n.speakerId,text:a.fileName,type:'image',attachmentId:a.id});}}return s.emitted.map(e=>({...map.get(e.id),id:e.id,timestamp:new Date(e.at).toISOString(),nodeId:e.nodeId}));}
