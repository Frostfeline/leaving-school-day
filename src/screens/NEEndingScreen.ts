import {showEndingUnlock} from '../components/EndingUnlock';
import {GraduationReceipt} from '../components/GraduationReceipt';
import ending from '../content/ending-ne.json';
import university from '../content/university.json';
import student from '../content/characters.json';
import {config,intro} from '../utils/content';
import {el} from '../utils/dom';
import {getGameState,collectEnding,beginEndingPresentation,finishEndingPresentation,continueNeReceipt} from '../state/game-state';
import '../styles/ending.css';

export function NEEndingScreen(review=false){
 const main=el('main','ne-ending');
 const receipt=GraduationReceipt();
 const narrative=el('article','ne-narrative');narrative.hidden=true;
 const statuses=el('div','ne-status-lines');statuses.append(...ending.statusLines.map(t=>el('p','',t)));
 const paragraphs=ending.paragraphs.map(p=>el('p','',p));const closing=el('p','ne-closing',ending.closing.replace('{name}',config.characters.linchen.name));const final=el('p','ne-final',ending.finalLabel);
 const parts=[statuses,...paragraphs,closing,final];
 const returnArea=el('div','ne-return');returnArea.hidden=true;
 const returnHome=el('button','ne-return-button',ending.actions.returnHome);returnHome.type='button';returnHome.onclick=()=>{location.hash='#/';};
 returnArea.append(returnHome);narrative.append(...parts,returnArea);main.append(receipt,narrative);
 let finishTimer:ReturnType<typeof setTimeout>|undefined;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function finish(){for(const part of parts)part.classList.add('ne-part-visible');if(!review){finishEndingPresentation();if(collectEnding('ne-graduation'))showEndingUnlock(main,ending.finalLabel);}returnArea.hidden=false;}
 function showNarrative(elapsed=0,complete=false){
  receipt.hidden=true;narrative.hidden=false;main.dataset.stage='narrative';
  for(const [index,part] of parts.entries()){
   part.classList.add('ne-part');const delay=index*ending.presentation.paragraphIntervalMs-elapsed;
   if(complete||reduced||delay<=-ending.presentation.fadeMs)part.classList.add('ne-part-visible');else part.style.animationDelay=`${Math.max(0,delay)}ms`;
  }
  if(complete||reduced)finish();else finishTimer=setTimeout(finish,Math.max(0,parts.length*ending.presentation.paragraphIntervalMs+ending.presentation.fadeMs-elapsed));
 }
 if(!review)beginEndingPresentation();const state=getGameState();
 if(review||state.endingPresentationComplete||state.neReceiptContinuedAt!==null)showNarrative(Math.max(0,Date.now()-(state.neReceiptContinuedAt??Date.now())),review||state.endingPresentationComplete);
 else{
  main.dataset.stage='receipt';const next=el('button','ne-return-button ne-receipt-continue',ending.actions.continue);next.type='button';receipt.append(next);
  next.onclick=()=>{if(next.disabled)return;next.disabled=true;continueNeReceipt();showNarrative();};
 }
 main.addEventListener('screen-dispose',()=>clearTimeout(finishTimer));return main;
}
