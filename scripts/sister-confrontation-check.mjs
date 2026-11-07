import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateConfrontationFiles} from './validate-sister-confrontation.mjs';
import {validateConfrontation,emptyConfrontation,tickConfrontation,chooseConfrontation,viewConfrontationManuscript,confrontationEntries,normalizeConfrontation} from './sister-confrontation-model.mjs';
const bundle=validateConfrontationFiles(),d=bundle.dialogue,mail=JSON.parse(readFileSync('src/content/bookstore/mail-messages.json','utf8')).items;
assert.equal(d.nodes.length,20);assert.equal(d.nodes.flatMap(n=>n.messages??[]).length,52);assert.equal(d.nodes.flatMap(n=>n.options??[]).length,9);
if(process.env.SISTER_SOURCE_PATH){
const source=readFileSync(process.env.SISTER_SOURCE_PATH,'utf8').replaceAll('\r\n','\n');
for(const node of d.nodes){const start=source.indexOf('【节点 '+node.id+'】');const rest=source.slice(start);const end=rest.slice(1).indexOf('【节点 ');const block=end<0?rest:rest.slice(0,end+1);if(node.messages){const expected=[...block.matchAll(/(?:^|\n)(林鸢|林琛)：\n([^\n]+)/g)].map(m=>({speakerId:m[1]==='林鸢'?'linyuan':'linchen',text:m[2]}));assert.deepEqual(node.messages.map(m=>({speakerId:m.speakerId,text:m.text})),expected);}if(node.options){const expected=[...block.matchAll(/选项 ([ABC])：\n([^\n]+)\n\nnextNodeId: (S3_\w+)/g)].map(m=>({text:m[2],nextNodeId:m[3]}));assert.deepEqual(node.options.map(o=>({text:o.text,nextNodeId:o.nextNodeId})),expected);}}
}
const interrupted={...emptyConfrontation(),nodeId:'S3_AFTER_MANUSCRIPT',startedAt:1,waitingMessageId:'s3_after_manuscript-08',nextAt:null,emitted:['01','02','05','03'].map(id=>({id:'s3_after_manuscript-'+id,nodeId:'S3_AFTER_MANUSCRIPT',at:1}))};
const resumed=tickConfrontation(interrupted,d,2);
assert.equal(resumed.waitingMessageId,null);
assert.equal(resumed.emitted.at(-1).id,'s3_after_manuscript-04');
assert.equal(confrontationEntries(resumed,bundle).at(-1).text,'小琛，如果你还是想弄清楚，就去问问那家旧书店吧。');
assert(resumed.nextAt>2+Math.min(12000,1200+[...confrontationEntries(resumed,bundle).at(-1).text].length*95));
let routes=0;
for(const a of [0,1,2])for(const b of [0,1])for(const c of [0,1]){
 const selections=[a,b,c];let round=0,now=10000,s={...emptyConfrontation(),nodeId:d.startNodeId,startedAt:now,nextAt:now},opened=false;
 for(let i=0;i<200&&s.completedAt===null;i++){
  if(s.waitingMessageId)s.manualMessageId=s.waitingMessageId;
  now=Math.max(now+1,s.nextAt??0);s=tickConfrontation(s,d,now);assert.deepEqual(normalizeConfrontation(JSON.parse(JSON.stringify(s)),d),s);const n=d.nodes.find(n=>n.id===s.nodeId);
  if(n.type==='choice'&&s.nextAt===null){const choice=n.options[selections[round++]];s=chooseConfrontation(s,d,choice.id,++now);const repeat=chooseConfrontation(s,d,choice.id,++now);assert.deepEqual(repeat,s);}
  if(n.type==='attachment'&&s.emitted.some(m=>m.id===n.messageId)&&s.nextAt===null&&!opened){for(let j=0;j<3;j++){s=tickConfrontation(s,d,now+=5000);assert.equal(s.nodeId,'S3_MANUSCRIPT');assert(!s.visitedNodes.includes('S3_AFTER_MANUSCRIPT'));}s=viewConfrontationManuscript(s,d,++now);opened=true;assert(s.manuscriptViewedAt!==null);}
 }
 assert.equal(round,3);assert(s.completedAt!==null);for(const id of ['S3_COMMON_1','S3_COMMON_2','S3_COMMON_3','S3_MANUSCRIPT','S3_AFTER_MANUSCRIPT','S3_END_MESSAGES','S3_COMPLETE'])assert.equal(s.visitedNodes.filter(n=>n===id).length,1);assert.equal(new Set(s.emitted.map(m=>m.id)).size,s.emitted.length);assert.deepEqual(tickConfrontation(s,d,now+999999),s);assert.deepEqual(normalizeConfrontation(JSON.parse(JSON.stringify(s)),d),s);
 const edited=structuredClone(bundle);edited.dialogue.nodes[0].messages[0].text='JSON编辑检查。';assert.equal(confrontationEntries(s,edited)[0].text,'JSON编辑检查。');assert.equal(normalizeConfrontation(s,edited.dialogue).completedAt,s.completedAt);routes++;
}
for(const mutate of [b=>b.dialogue.nodes.push(b.dialogue.nodes[0]),b=>b.dialogue.nodes[0].messages[1].messageId=b.dialogue.nodes[0].messages[0].messageId,b=>b.dialogue.nodes[0].messages[0].speakerId='missing',b=>b.dialogue.nodes[0].nextNodeId='missing',b=>b.dialogue.nodes[0].nextNodeId='S3_INTRO',b=>b.dialogue.nodes.find(n=>n.id==='S3_CHOICE_1').options[0].nextNodeId='S3_COMPLETE',b=>b.dialogue.nodes.find(n=>n.id==='S3_MANUSCRIPT').requireOpenBeforeNext=false,b=>b.dialogue.nodes.find(n=>n.id==='S3_COMMON_3').nextNodeId='S3_AFTER_MANUSCRIPT',b=>b.reading.requiredReadMessageIds.push('missing'),b=>b.reading.lastRequiredMessageId='missing',b=>b.dialogue.nodes.find(n=>n.type==='attachment').attachmentId='missing',b=>b.attachments.items[0].paragraphs=[]]){const changed=structuredClone(bundle);mutate(changed);assert.throws(()=>validateConfrontation(changed,mail));}
console.log('PASS authored 52 messages/7 active options (2 legacy options retained); all',routes,'combinations reach every common segment and S3_COMPLETE, gated manuscript, no duplicate/replay, save roundtrip, content-only edits; 12 invalid graph/ID/speaker/gate/reference cases rejected');
