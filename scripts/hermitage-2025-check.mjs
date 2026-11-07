import assert from 'node:assert/strict';
import {readingDelay} from './dialogue-pacing.mjs';
import {readHermitageFiles,validateHermitageFiles} from './validate-hermitage-2025.mjs';
import {emptyHermitage,tickHermitage,resumeHermitageFollowup,hermitageEntries,validateHermitage,normalizeHermitage} from './hermitage-2025-model.mjs';
const b=readHermitageFiles();validateHermitageFiles();
let progress={...emptyHermitage(),openingConfirmedAt:1,startedAt:1,nodeId:b.dialogue.entryNodeId,nextAt:1};
for(let i=1;i<200&&progress.completedAt===null;i++){
  if(progress.waitingMessageId)progress.manualMessageId=progress.waitingMessageId;
  progress=JSON.parse(JSON.stringify(tickHermitage(progress,b.dialogue,i*10000)));
}
assert.equal(progress.stage,'commission');
assert.equal(progress.choice,null);
assert.equal(new Set(progress.emitted.map(message=>message.id)).size,progress.emitted.length);
const entries=hermitageEntries(progress,b.dialogue);
assert.deepEqual(entries.filter(message=>message.id==='h25-choice-b').map(message=>message.text),['是的，我还有一件小事没有弄明白']);
assert(entries.some(message=>message.text==='林先生，店主同意了。'));
assert(entries.some(message=>message.text.endsWith('麻烦您通过左侧的新私聊与店主联系。')));
const consecutive=entries.find((message,i)=>message.speakerId==='linchen'&&entries[i+1]?.speakerId==='linchen');
assert.equal(readingDelay(b.dialogue,consecutive),2800);
const reply=entries.find(message=>message.speakerId==='ning');
assert(readingDelay(b.dialogue,reply)>readingDelay({...b.dialogue,npcDelayMultiplier:1},reply));
assert.deepEqual(tickHermitage(progress,b.dialogue,1e9),progress);
const retired=resumeHermitageFollowup({...progress,stage:'oa',choice:'H25_OPTION_A',emitted:[{id:'h25-start-01',at:1},{id:'h25-choice-a',at:2}]});
assert.equal(retired.nodeId,'H25_CHOICE');
assert.equal(retired.completedAt,null);
assert.equal(retired.nextAt,0);
assert.deepEqual(retired.emitted,[{id:'h25-start-01',at:1}]);
for(const mutate of [d=>d.dialogue.nodes[0].nextNodeId='missing',d=>d.dialogue.nodes[0].nextNodeId='H25_START',d=>d.dialogue.nodes[1].nextNodeId='missing',d=>d.cg.scenes[1].eventId=null,d=>d.cg.scenes.reverse(),d=>d.commission.route='https://example.com',d=>d.ending.scenes[0].nextSceneId='bad',d=>d.dialogue.nodes[0].messages[0].speakerId='owner',d=>d.cg.scenes[0].backgroundSrc='../secret.png']){const d=structuredClone(b);mutate(d);assert.throws(()=>validateHermitage(d));}
assert.equal(b.dialogue.nodes.flatMap(n=>n.messages??[]).length,37);assert.equal(b.ending.scenes.flatMap(s=>s.blocks).length,28);
assert(b.ending.scenes[1].blocks.some(p=>p.text.includes('鲜花和毕业照')));assert(b.ending.scenes[0].blocks.some(p=>p.text.includes('晚一点也没关系。')));assert.equal(b.ending.scenes.at(-1).blocks.at(-1).text,'Good End｜爱有所归');
console.log('PASS linear commission route, 37 authored messages and legacy recovery, 28 Good End blocks / 2 scenes, save roundtrip/dedup/pause; 9 invalid graph/route/speaker/payment-event cases rejected');

const legacy={...emptyHermitage(),startedAt:1,nodeId:'H25_CHOICE',nextAt:null,emitted:[{id:'h25-start-01',at:1}]};delete legacy.openingConfirmedAt;assert.equal(normalizeHermitage(legacy).startedAt,null);const chosen={...legacy,choice:'H25_OPTION_B',nodeId:'H25_B_INQUIRY'};assert.equal(normalizeHermitage(chosen).choice,'H25_OPTION_B');assert.equal(normalizeHermitage(chosen).emitted.length,1);console.log('PASS legacy unchosen autoplay returns to explicit opening; chosen branch progress preserved');
