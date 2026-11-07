import {OAFrame,LibraryFields} from '../components/OAFrame';
import ui from '../content/oa-home.json';
import notices from '../content/oa-notices.json';
import record from '../content/oa-library-record.json';
import university from '../content/university.json';
import {intro,config} from '../utils/content';
import {el} from '../utils/dom';
import '../styles/oa.css';
import '../styles/oa-home.css';
import {getGameState,subscribeGameState} from '../state/game-state';
import {hermitageBundle} from '../utils/hermitage-2025-content';
import {helpIcon} from '../components/LibraryPolicyHelp';
export {notices};
export function OAContentScreen(noticeId?:string,view:'summary'|'record'='summary') {
 const {main,content}=OAFrame();
 const notice=notices.items.find(n=>n.id===noticeId);
 if(!notice){
  const welcome=el('section','oa-welcome');welcome.append(el('h1','',ui.welcome.replace('{name}',config.characters.linchen.name).replace('{university}',university.name)),el('p','',intro.date));
  const panel=el('section','oa-notice-panel');const tabs=el('div','oa-home-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label',ui.tabsLabel);
  const list=el('ul','oa-notice-list');
  const tabButtons:HTMLButtonElement[]=[];
  function selectTab(id:string){list.replaceChildren();list.id='oa-home-list';list.setAttribute('role','tabpanel');list.setAttribute('aria-labelledby','oa-tab-'+id);for(const b of tabButtons){b.setAttribute('aria-selected',String(b.dataset.category===id));b.tabIndex=b.dataset.category===id?0:-1;}
  for(const item of notices.items.filter(n=>n.category===id)){
   const row=el('li',`oa-notice-row${item.priority==='important'?' oa-important':''}`);row.dataset.noticeId=item.id;
   const link=el('a','oa-notice-link');link.href=`#/oa/notices/${item.id}`;
   if(item.priority==='important'){const icon=el('span','oa-notification-icon');icon.setAttribute('aria-hidden','true');link.append(icon);}
   link.append(el('span','oa-notice-title',item.title));
   if(item.status==='pending')link.append(el('span','oa-pending',ui.pendingLabel));
   link.append(el('time','',item.date));row.append(link);list.append(row);
  }
  }
  for(const tab of ui.tabs){const b=el('button','',tab.label);b.type='button';b.id='oa-tab-'+tab.id;b.dataset.category=tab.id;b.setAttribute('role','tab');b.setAttribute('aria-controls','oa-home-list');b.onclick=()=>{try{sessionStorage.setItem('oa:home-tab',tab.id);}catch{}selectTab(tab.id);};b.onkeydown=event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const i=tabButtons.indexOf(b),next=event.key==='Home'?0:event.key==='End'?tabButtons.length-1:(i+1)%tabButtons.length;tabButtons[next].click();tabButtons[next].focus();}};tabButtons.push(b);tabs.append(b);}let selected='notices';try{const remembered=sessionStorage.getItem('oa:home-tab');if(ui.tabs.some(t=>t.id===remembered))selected=remembered!;}catch{}selectTab(selected);
  panel.append(tabs,list);content.append(welcome,panel);
 }else{
  main.dataset.noticeId=notice.id;
  const article=el('article','oa-detail');
  article.append(el('h1','',notice.detailType==='library'?(view==='record'?record.investigation.title:record.title):notice.title));
  article.append(el('p','oa-detail-meta',`${ui.publisher}：${notice.detailType==='library'?record.publisher:notice.publisher??university.name}　　${ui.dateLabel}：${notice.date}`));
  const paragraphs=notice.detailType==='library'?(view==='record'?record.investigation.paragraphs:record.paragraphs):notice.paragraphs;
  for(const [i,paragraph] of paragraphs.entries()){const style=notice.detailType==='ordinary'?notice.paragraphStyles?.[i]:undefined;article.append(el(style==='heading'?'h2':style==='subheading'?'h3':'p','oa-detail-paragraph'+(style==='signature'?' oa-notice-signature':''),paragraph));}
  if(notice.detailType==='library'){
   article.append(LibraryFields(view==='record'?record.investigation.fields:record.fields));
   const actions=el('div','oa-branch-actions');
   if(view==='record'){
    const back=el('a','oa-button oa-button-secondary',record.actions.backSummary);back.href='#/oa/notices/library-exception';actions.append(back);
   }else{
    const investigate=el('a','oa-button oa-button-secondary',record.actions.investigate);investigate.href='#/oa/library/record';investigate.addEventListener('click',()=>sessionStorage.setItem('oa:inquiry-clicked','1'));
    investigate.prepend(helpIcon());
    const pay=el('a','oa-button oa-button-primary',record.actions.pay);pay.href='#/oa/payment';actions.append(investigate,pay);
   }
   article.append(actions);
  }
  if(notice.detailType!=='library'){const back=el('a','oa-back-home',getGameState().authenticated?ui.backHome:ui.backLogin);back.href=getGameState().authenticated?'#/oa/home':'#/oa/login';article.append(back);}
  content.append(article);
 }
 const abort=new AbortController();let paymentStatus=getGameState().libraryPayment?.status;
 const syncSettlement=()=>{const status=getGameState().libraryPayment?.status;if(status===paymentStatus)return;paymentStatus=status;const fields=main.querySelector('.oa-record');if(fields)fields.replaceWith(LibraryFields(view==='record'?record.investigation.fields:record.fields));const actions=main.querySelector<HTMLElement>('.oa-branch-actions');if(actions)actions.hidden=status==='completed';if(status==='completed')for(const badge of Array.from(main.querySelectorAll('.oa-pending')))badge.textContent=hermitageBundle.cg.settledStatus;};
 if(paymentStatus==='completed'){const actions=main.querySelector<HTMLElement>('.oa-branch-actions');if(actions)actions.hidden=true;for(const badge of Array.from(main.querySelectorAll('.oa-pending')))badge.textContent=hermitageBundle.cg.settledStatus;}
 subscribeGameState(syncSettlement,abort.signal);main.addEventListener('screen-dispose',()=>abort.abort());return main;
}
