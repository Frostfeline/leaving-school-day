import {OAPaymentDetails} from '../components/OAPaymentDetails';
import ui from '../content/oa-payment.json';
import university from '../content/university.json';
import {OAFrame,LibraryFields} from '../components/OAFrame';
import {el} from '../utils/dom';
import {libraryValue} from '../utils/library-content';
import {getGameState,beginLibraryPayment,completeLibraryPayment,subscribeGameState,PAYMENT_PROCESS_MS,canShowNE} from '../state/game-state';
import '../styles/oa-payment.css';
export function OAPaymentScreen(){
 const timelineRevision=getGameState().timelineRevision;
 const {main,content}=OAFrame();main.classList.add('oa-payment-page');
 const article=OAPaymentDetails();
 const form=el('form','oa-payment-form');const label=el('label','oa-payment-consent');const checkbox=el('input');checkbox.type='checkbox';checkbox.id='payment-consent';label.append(checkbox,el('span','',ui.confirmation));
 const button=el('button','oa-button oa-button-primary',ui.pay.replace('{amount}',libraryValue('amount')));button.type='submit';button.disabled=true;
 const status=el('p','oa-payment-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const back=el('a','oa-back-home',ui.backSummary);back.href='#/oa/notices/library-exception';
 form.append(label,button);article.append(form,status,back,...ui.paragraphs.map(p=>el('p','oa-payment-disclaimer',p)));content.append(article);
 const abort=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;let transitioning=false;
 function clearTimer(){clearTimeout(timer);timer=undefined;}
 checkbox.onchange=()=>{button.disabled=!checkbox.checked;};
 async function finish(){try{await completeLibraryPayment(timelineRevision);}catch{status.textContent=ui.storageFailure;}}
 function renderState(){
  const state=getGameState();const payment=state.libraryPayment;
  if(!payment)return;
  checkbox.checked=state.confirmedResponsibility;checkbox.disabled=true;button.disabled=true;
  if(payment.status==='processing'){
   button.textContent=ui.processing;status.textContent='';back.hidden=true;
   if(!timer)timer=setTimeout(()=>{timer=undefined;void finish();},Math.max(0,payment.startedAt+PAYMENT_PROCESS_MS-Date.now())+5);
  }else{
   if(!transitioning)clearTimer();form.hidden=true;status.textContent=ui.success;
   if(canShowNE(state)||(payment.outcome==='he'&&state.privateCommission.informedCompletedAt)){
    back.hidden=true;
    if(!transitioning){transitioning=true;timer=setTimeout(()=>{main.classList.add('oa-payment-fade');timer=setTimeout(()=>{if(main.isConnected)location.replace(payment.outcome==='he'?'#/ending/he/payment':'#/ending/ne');},650);},900);}
   }else{back.hidden=false;status.append(el('span','oa-payment-unassigned',ui.unassignedOutcome));}
  }
 }
 form.onsubmit=async event=>{event.preventDefault();if(!checkbox.checked || button.disabled)return;button.disabled=true;checkbox.disabled=true;button.textContent=ui.processing;try{if(!await beginLibraryPayment(checkbox.checked,timelineRevision)){checkbox.disabled=false;button.disabled=!checkbox.checked;button.textContent=ui.pay.replace('{amount}',libraryValue('amount'));return;}renderState();}catch{checkbox.disabled=false;button.disabled=!checkbox.checked;button.textContent=ui.pay.replace('{amount}',libraryValue('amount'));status.textContent=ui.storageFailure;}};
 subscribeGameState(()=>{if(main.isConnected)renderState();},abort.signal);
 main.addEventListener('screen-dispose',()=>{abort.abort();clearTimer();});
 renderState();return main;
}
