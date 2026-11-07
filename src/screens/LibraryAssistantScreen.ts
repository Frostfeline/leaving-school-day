import {OAFrame,LibraryFields} from '../components/OAFrame';
import ui from '../content/oa-library-assistant.json';
import record from '../content/oa-library-record.json';
import university from '../content/university.json';
import {libraryValue} from '../utils/library-content';
import {el} from '../utils/dom';
import {beginLibraryInquiry,sendSisterReminder2,getGameState} from '../state/game-state';
import '../styles/library-assistant.css';

export function LibraryAssistantScreen(){
 const {main,content}=OAFrame();const abort=new AbortController();
 const heading=el('header','la-heading');heading.append(el('h1','',ui.title.replace('{university}',university.name)),el('p','',ui.subtitle));
 const thread=el('section','la-thread');thread.setAttribute('aria-label',ui.conversationLabel);
 const bot=(paragraphs:string[])=>{const message=el('article','la-answer');message.append(el('h2','',ui.botName));for(const p of paragraphs)message.append(el('p','',p.replaceAll('{originalBorrower}',libraryValue('originalBorrower')).replaceAll('{responsiblePerson}',libraryValue('responsiblePerson'))));return message;};
 const initial=bot([ui.greeting]);initial.append(el('h3','la-record-heading',ui.recordHeading),LibraryFields(ui.fields));thread.append(initial);
 const answers=el('div','la-answers');answers.setAttribute('aria-live','polite');thread.append(answers);
 const options=el('section','la-options');options.append(el('h2','',ui.questionsHeading));const buttons=el('div','la-questions');
 for(const question of ui.questions){const button=el('button','oa-button oa-button-secondary',question.label);button.type='button';button.dataset.questionId=question.id;button.onclick=()=>{
  const group=el('section','la-exchange');group.append(el('p','la-question',question.label));const response=bot(question.paragraphs);
  if(question.showFullRecord)response.append(LibraryFields(record.investigation.fields));
  group.append(response);answers.replaceChildren(group);for(const b of Array.from(buttons.querySelectorAll('button')))b.setAttribute('aria-pressed',String(b===button));main.dataset.activeLibraryServicePanel=question.id;try{sessionStorage.setItem('oa:library-panel',question.id);}catch{}
 };buttons.append(button);}
 options.append(buttons);try{const saved=sessionStorage.getItem('oa:library-panel');buttons.querySelector<HTMLButtonElement>(`[data-question-id="${saved}"]`)?.click();}catch{}const back=el('a','oa-button oa-button-secondary',ui.backSummary);back.href='#/oa/notices/library-exception';content.append(heading,thread,options,back);
 let timer:ReturnType<typeof setTimeout>|undefined;const revision=getGameState().timelineRevision;
 const flush=()=>{void sendSisterReminder2(revision).catch(console.error);};
 const observer=new IntersectionObserver(entries=>{if(document.hidden||!entries.some(e=>e.isIntersecting)||sessionStorage.getItem('oa:inquiry-clicked')!=='1')return;beginLibraryInquiry();timer=setTimeout(flush,1500);observer.disconnect();},{threshold:.5});requestAnimationFrame(()=>{if(main.isConnected)observer.observe(initial);});main.addEventListener('screen-dispose',()=>observer.disconnect());
 document.addEventListener('visibilitychange',()=>{if(document.hidden)flush();},{signal:abort.signal});
 window.addEventListener('pagehide',flush,{signal:abort.signal});
 main.addEventListener('screen-dispose',()=>{clearTimeout(timer);abort.abort();flush();});
 return main;
}
