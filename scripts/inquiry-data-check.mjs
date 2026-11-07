import {readInvestigationFiles,validateInvestigation} from './validate-investigation.mjs';
import assert from 'node:assert/strict';
const data=readInvestigationFiles();validateInvestigation(data);
for(const mutate of [
 d=>d.index.excludedKinds=[],
 d=>d.assistant.questions.push({...d.assistant.questions[0]}),
 d=>d.assistant.fields[0].valueRef='unknown',
 d=>d.assistant.questions[0].paragraphs=[],
 d=>d.reminder.messages[0].senderId='missing',
 d=>d.reminder.messages[0].id=d.staticMessages[0].id,
 d=>d.ui.webSearch='no-variable',
 d=>d.index.entries.find(e=>e.kind==='book').bookId='missing',
 d=>d.index.entries.find(e=>e.kind==='website').routeId='https://real-site.invalid',
 d=>d.index.entries.push({id:'forum-test',kind:'document',title:'测试资料',source:'测试',summary:'测试摘要',keywords:[],paragraphs:[]})
]){const copy=structuredClone(data);mutate(copy);assert.throws(()=>validateInvestigation(copy),/src\/content\//);}
console.log('PASS investigation content: 10 invalid scope/ID/reference/answer/message/template/target/document cases rejected');
