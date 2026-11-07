import {holdPlayer,readingDelay} from './dialogue-pacing.mjs';
export const hermitagePaths={dialogue:'bookstore/dialogues/hermitage-2025',ending:'endings/he-ai-you-suo-gui',cg:'endings/he-payment-cg',commission:'bookstore/private-commission-entry',ui:'bookstore/hermitage-2025-ui'};
export function hermitageReady(bundle){return bundle.dialogue.reviewStatus==='confirmed'&&bundle.ending.reviewStatus==='confirmed';}
export function validateHermitage(b){
 const fail=p=>{throw Error('Hermitage2025: '+p);},text=(v,p)=>{if(typeof v!=='string'||!v.trim())fail(p);};
 for(const k of Object.keys(hermitagePaths))if(b[k]?.schemaVersion!==1)fail(k+'.schemaVersion');
 const d=b.dialogue,ids=new Set(),messages=new Set();
 if(d.threadId!=='hermitage-history'||d.accountId!=='luoyao-bookstore')fail('dialogue account/thread');
 if(!Array.isArray(d.completionEvents)||!d.completionEvents.length||!d.completionEvents.every(e=>e==='hermitage2025Completed'))fail('completionEvents');
 if(!['confirmed','awaiting-author'].includes(d.reviewStatus))fail('reviewStatus');
 if(!Number.isFinite(d.messageIntervalMs)||d.messageIntervalMs<100||d.messageIntervalMs>10000)fail('messageIntervalMs');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(d.date)||!Number.isFinite(Date.parse(d.date)))fail('dialogue date');
 if(!Array.isArray(d.nodes)||!d.nodes.length)fail('nodes');
 const message=m=>{text(m.messageId,'messageId');if(messages.has(m.messageId))fail('duplicate messageId');messages.add(m.messageId);if(!['linchen','ning','system'].includes(m.speakerId))fail('speakerId');if(d.reviewStatus==='confirmed'||m.reviewStatus==='confirmed')text(m.text,m.messageId+'.text');};
 for(const n of d.nodes){text(n.nodeId,'nodeId');if(ids.has(n.nodeId))fail('duplicate nodeId');ids.add(n.nodeId);if(!['messages','system','pause','action'].includes(n.nodeType))fail('nodeType');for(const m of n.messages??[])message(m);if(n.nodeType==='pause'&&(!Number.isFinite(n.durationMs)||n.durationMs<0||n.durationMs>15000))fail('pause.durationMs');if(n.nodeType==='action'&&n.actionId!=='grant-private-commission')fail('actionId');}
 if(d.openingMessageId!==d.nodes.find(n=>n.nodeId===d.entryNodeId)?.messages?.[0]?.messageId||d.nodes.find(n=>n.nodeId===d.entryNodeId)?.messages?.[0]?.speakerId!=='linchen')fail('openingMessageId');
 if(!ids.has(d.entryNodeId))fail('entryNodeId');
 const visited=new Set();
 let node=d.nodes.find(n=>n.nodeId===d.entryNodeId);
 while(node){
  if(visited.has(node.nodeId))fail('cycle');
  visited.add(node.nodeId);
  if(node.nodeType==='action')break;
  node=d.nodes.find(n=>n.nodeId===node.nextNodeId);
 }
 if(node?.actionId!=='grant-private-commission'||visited.size!==ids.size)fail('commission route must be linear and complete');
 if(d.reviewStatus==='confirmed'&&(!d.nodes.find(n=>n.nodeId===d.entryNodeId)?.messages?.length||!d.nodes.some(n=>n.nodeId==='H25_B_INQUIRY'&&n.messages?.length)))fail('complete authored introduction and B dialogue required');
 const cg=b.cg;if(cg.targetEndingId!==b.ending.endingId||cg.amountRef!=='amount'||!Number.isFinite(cg.fadeMs)||cg.fadeMs<0||cg.fadeMs>3000)fail('CG references/fade');
 if(cg.scenes?.length!==5||new Set(cg.scenes.map(s=>s.id)).size!==5)fail('CG scenes');
 const views=new Set(['record','acknowledge','payment','success','receipt']);for(const s of cg.scenes){if(s.fieldRefs&&(!Array.isArray(s.fieldRefs)||!s.fieldRefs.every(ref=>['collectionCode','bookTitle','isbn','responsiblePerson','amount','status'].includes(ref))))fail('CG field reference');if(!views.delete(s.view))fail('CG view');text(s.text,'CG.text');if(!Number.isFinite(s.durationMs)||s.durationMs<100||s.durationMs>30000)fail('CG.duration');if(s.backgroundSrc&&(!/^assets\/[\w/.-]+\.(png|jpe?g|webp|svg)$/.test(s.backgroundSrc)||s.backgroundSrc.includes('..')))fail('CG resource');}
 // Reordering is supported within the story's irreversible event order.
 for(const scene of cg.scenes){const expected=scene.view==='acknowledge'?'acknowledge-liability':scene.view==='success'?'settle-library':null;if(scene.eventId!==expected)fail('CG key event');}
 const index=v=>cg.scenes.findIndex(s=>s.view===v);if(index('record')>index('payment')||index('receipt')!==cg.scenes.length-1)fail('CG overview/receipt sequence');if(index('acknowledge')>index('payment')||index('payment')>index('success')||index('success')>index('receipt'))fail('CG responsibility/payment/receipt order');
 const scenes=b.ending.scenes;if(!Array.isArray(scenes)||!scenes.length||!['2025-06-25','2025-06-28'].every(date=>scenes.some(s=>s.date===date)))fail('HE scenes/dates');
 if(!Array.isArray(b.ending.assets))fail('HE assets');const assetIds=new Set();for(const asset of b.ending.assets){text(asset.id,'asset.id');text(asset.alt,'asset.alt');if(assetIds.has(asset.id)||!/^assets\/[\w/.-]+\.(png|jpe?g|webp|svg)$/.test(asset.src)||asset.src.includes('..'))fail('HE asset path or ID');assetIds.add(asset.id);}
 const blockIds=new Set(),sceneIds=new Set();for(const scene of scenes){if(scene.recapMessageId&&!messages.has(scene.recapMessageId))fail('HE recap message');if(!Number.isFinite(scene.transition?.fadeMs)||scene.transition.fadeMs<0||scene.transition.fadeMs>5000)fail('HE transition');text(scene.sceneId,'sceneId');if(sceneIds.has(scene.sceneId))fail('duplicate sceneId');sceneIds.add(scene.sceneId);if(!Array.isArray(scene.blocks)||!scene.blocks.length)fail('HE blocks');for(const block of scene.blocks){text(block.id,'block.id');text(block.text,'block.text');if(blockIds.has(block.id)||!['narration','dialogue','flashbackQuote','sceneDivider','endingTitle','epigraph'].includes(block.type))fail('HE block');blockIds.add(block.id);if(block.type==='dialogue'&&!['linchen','linyuan','luoyao'].includes(block.speakerId))fail('HE speaker');}if(scene.nextSceneId!==null&&!scenes.some(s=>s.sceneId===scene.nextSceneId))fail('HE next scene');if(scene.backgroundAssetId&&!b.ending.assets.some(a=>a.id===scene.backgroundAssetId))fail('HE background reference');}
 if(!Array.isArray(d.triggerConfig?.requiredFlags)||JSON.stringify([...d.triggerConfig.requiredFlags].sort())!==JSON.stringify(['sisterConfrontation3Completed','sisterManuscriptViewed'].sort()))fail('trigger flags');
 for(const [i,scene]of scenes.entries())if(scene.nextSceneId!==(scenes[i+1]?.sceneId??null))fail('HE scene sequence');
 if(b.commission.route!=='#/bookstore/private-commission')fail('commission route');
 for(const k of ['title','finalLabel','returnHome'])text(b.ending[k],'HE.'+k);for(const k of ['paragraphDelayMs','fadeMs'])if(!Number.isFinite(b.ending[k])||b.ending[k]<0||b.ending[k]>5000)fail('HE timing');
 for(const value of Object.values(b.ui))if(typeof value==='string')text(value,'UI');return true;
}
export const emptyHermitage=()=>({openingConfirmedAt:null,nodeId:null,emitted:[],choice:null,startedAt:null,completedAt:null,nextAt:null,stage:'chat',cgIndex:0,cgStartedAt:null,cgCompletedAt:null,endingStartedAt:null,endingViewedAt:null});
export function normalizeHermitage(value){if(value&&typeof value==='object'&&!Object.hasOwn(value,'openingConfirmedAt')&&value.startedAt!==null&&value.startedAt!==undefined&&!value.choice&&value.stage==='chat')return emptyHermitage();const s={...emptyHermitage(),...(value&&typeof value==='object'?value:{})};if(s.choice&&!Object.hasOwn(value,'openingConfirmedAt'))s.openingConfirmedAt=s.startedAt; if(!Array.isArray(s.emitted))s.emitted=[];if(!['chat','cg','ending','commission','oa'].includes(s.stage))s.stage='chat';return s;}
export function resumeHermitageFollowup(value){
 const progress=normalizeHermitage(value);
 if(progress.stage==='oa'||(progress.stage==='chat'&&progress.choice==='H25_OPTION_A')){
  const emitted=progress.emitted.filter(message=>message.id!=='h25-choice-a'&&!message.id.startsWith('h25-a-'));
  return {...progress,stage:'chat',nodeId:'H25_CHOICE',choice:null,completedAt:null,nextAt:0,waitingMessageId:null,manualMessageId:null,emitted};
 }
 if(progress.stage==='chat'&&progress.nodeId==='H25_CHOICE'&&progress.nextAt===null&&!progress.waitingMessageId){
  return {...progress,nextAt:0};
 }
 return progress;
}
export function tickHermitage(value,d,now){const s=structuredClone(normalizeHermitage(value));if(s.completedAt!==null||s.nextAt!==null&&s.nextAt>now)return s;for(let guard=0;guard<d.nodes.length+1;guard++){const n=d.nodes.find(n=>n.nodeId===s.nodeId);if(!n)return s;if(['messages','system'].includes(n.nodeType)){const m=n.messages.find(m=>!s.emitted.some(e=>e.id===m.messageId));if(m){if(holdPlayer(s,d,m))return s;s.emitted.push({id:m.messageId,at:now});s.nextAt=now+readingDelay(d,m);return s;}s.nodeId=n.nextNodeId;continue;}if(n.nodeType==='pause'){if(s.pauseNode!==n.nodeId){s.pauseNode=n.nodeId;s.nextAt=now+n.durationMs;return s;}s.nodeId=n.nextNodeId;continue;}if(n.nodeType==='action'){s.completedAt=now;s.stage='commission';s.nextAt=null;return s;}return s;}return s;}
export function chooseHermitage(value,d,id,now){const s=structuredClone(normalizeHermitage(value)),n=d.nodes.find(n=>n.nodeId===s.nodeId),o=n?.options?.find(o=>o.id===id);if(s.choice||n?.nodeType!=='choice'||!o||s.completedAt!==null)return s;s.choice=id;s.emitted.push({id:o.messageId,at:now});s.nodeId=o.nextNodeId;s.nextAt=now+d.messageIntervalMs;return s;}
export function hermitageEntries(s,d){const map=new Map(d.nodes.flatMap(n=>[...(n.legacyMessages??[]),...(n.messages??n.options??[])].map(m=>[m.messageId,m])));return s.emitted.filter(e=>map.has(e.id)).map(e=>({...map.get(e.id),id:e.id,at:e.at}));}
