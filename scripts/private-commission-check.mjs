import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readPrivateFiles,validatePrivateFiles} from './validate-private-commission.mjs';
import {emptyPrivate,tickOwner,chooseOwner,ownerEntries,validatePrivate,answersCorrect,normalizePrivate} from './private-commission-model.mjs';
const b=readPrivateFiles(),wx=JSON.parse(readFileSync('src/content/wechat/chats/luo-yao.json','utf8')).messages;
validatePrivateFiles();
assert(answersCorrect(['3','4','14','0'],b.verification));
assert(!answersCorrect(['3','1475','0'],b.verification));
assert(!answersCorrect(['3','14','4','0'],b.verification));
const legacy=normalizePrivate({answers:['2','1475','0'],verifiedAt:1234});
assert.deepEqual(legacy.answers,['2','','','0']);
assert.equal(legacy.verifiedAt,1234);
let now=1000,p={...emptyPrivate().owner,openingConfirmedAt:1,startedAt:1,nodeId:b.dialogue.entryNodeId,nextAt:1};
for(let i=0;i<100;i++){now+=12000;if(p.waitingMessageId)p.manualMessageId=p.waitingMessageId;p=tickOwner(p,b.dialogue,now,false);}
assert.equal(p.nodeId,'OWNER_ARCHIVE_GATE');assert.equal(p.emitted.length,b.dialogue.nodes[0].messages.length);assert.equal(p.choice,null);
for(let i=0;i<100;i++){now+=12000;if(p.waitingMessageId)p.manualMessageId=p.waitingMessageId;p=tickOwner(p,b.dialogue,now,true);}
assert.equal(p.nodeId,'OWNER_FINAL_CHOICE');
for(const [choice,stage]of [['A','oa'],['B','be'],['C','invitation']]){let q=chooseOwner(p,b.dialogue,'OWNER_OPTION_'+choice,now);assert.equal(q.emitted.length,p.emitted.length+1);assert.deepEqual(chooseOwner(q,b.dialogue,'OWNER_OPTION_B',now),q);for(let i=0;i<100;i++){now+=12000;if(q.waitingMessageId)q.manualMessageId=q.waitingMessageId;q=tickOwner(JSON.parse(JSON.stringify(q)),b.dialogue,now,true);}assert.equal(q.stage,stage);assert.deepEqual(tickOwner(q,b.dialogue,now+5000,true),q);assert.equal(new Set(q.emitted.map(m=>m.id)).size,q.emitted.length);assert.equal(normalizePrivate({owner:q}).owner.stage,stage);assert(ownerEntries(q,b.dialogue).length>p.emitted.length);}
for(const [choice,stage] of [['B','invitation'],['C','be']]){
 let old=chooseOwner(p,b.dialogue,'OWNER_OPTION_'+choice,now);
 delete old.finalChoiceVersion;
 for(let i=0;i<120;i++){
  now+=12000;
  if(old.waitingMessageId)old.manualMessageId=old.waitingMessageId;
  old=tickOwner(JSON.parse(JSON.stringify(old)),b.dialogue,now,true);
 }
 assert.equal(old.stage,stage);
 const option=b.dialogue.nodes.find(n=>n.nodeId==='OWNER_FINAL_CHOICE').options.find(o=>o.id===old.choice);
 assert.equal(ownerEntries(old,b.dialogue).find(m=>m.id===option.messageId).text,option.legacyText);
}
const invalid=[x=>x.verification.questions[1].answerParts[1].answer='天',x=>x.verification.questions[0].evidenceRefs=['unapproved'],x=>x.dialogue.nodes[0].nextNodeId='missing',x=>x.dialogue.nodes[2].nextNodeId=x.dialogue.entryNodeId,x=>x.dialogue.nodes.find(n=>n.nodeId==='OWNER_END_A').actionId='begin-be',x=>x.dialogue.nodes[0].messages[0].speakerId='ning',x=>x.dialogue.nodes[0].messages.push(x.dialogue.nodes[0].messages[0]),x=>x.archive.requireEnd=false,x=>x.ending.scenes[0].blocks[0].text='',x=>x.ending.scenes[0].backgroundAssetId='missing',x=>x.ending.scenes[0].nextSceneId='missing',x=>x.ending.assets.push({id:'bad',src:'../../file.png'}),x=>x.cast.groups[0].people[0].name='',x=>x.ui.informedEndingId='ne-graduation'];
for(const change of invalid){const x=structuredClone(b);change(x);assert.throws(()=>validatePrivate(x,wx));}
console.log('PASS private model: archive gate, configurable answers, ABC routes, single choice, no duplicate emissions, JSON restore, '+invalid.length+' invalid schema/reference/branch/resource cases');
