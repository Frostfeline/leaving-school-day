import portalNotices from '../content/oa-notices.json';
import {UniversityHeader} from '../components/UniversityHeader';
import university from '../content/university.json';
import ui from '../content/oa-login.json';
import notices from '../content/notices.json';
import {el} from '../utils/dom';
import {getGameState,rememberStudent,requestLoginCode,login} from '../state/game-state';
import '../styles/oa.css';
import '../styles/oa-login-visual.css';
export function OALoginScreen(onLoginSuccess?:()=>void) {
 const main=el('main','oa-page oa-auth-page');
 const header=UniversityHeader();
 const band=el('section','oa-band');const wrap=el('div','oa-login-wrap');
 const visual=el('div','oa-visual');const photo=el('img','oa-campus');photo.src=import.meta.env.BASE_URL+university.campusImage;photo.alt=university.campusAlt;
 const caption=el('div','oa-caption');caption.append(el('h1','',university.motto));if(university.heroCaption)caption.append(el('p','',university.heroCaption));visual.append(photo,caption);
 const panel=el('section','oa-panel');const tabs=el('div','oa-tabs');
 const accountTab=el('button','',ui.accountTab);accountTab.type='button';
 const codeTab=el('button','oa-tab-current',ui.codeTab);codeTab.type='button'; codeTab.setAttribute('aria-pressed','true');accountTab.setAttribute('aria-pressed','false');
 const status=el('p','oa-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const unavailable=el('div','oa-account-unavailable',ui.accountUnavailable);unavailable.hidden=true;
 const switchTab=(account:boolean)=>{accountTab.classList.toggle('oa-tab-current',account);codeTab.classList.toggle('oa-tab-current',!account);accountTab.setAttribute('aria-pressed',String(account));codeTab.setAttribute('aria-pressed',String(!account));form.hidden=account;unavailable.hidden=!account;status.textContent='';status.classList.remove('oa-error');};
 accountTab.onclick=()=>switchTab(true);codeTab.onclick=()=>switchTab(false);tabs.append(accountTab,codeTab);
 const form=el('form','oa-form'); form.noValidate=true;
 const studentLabel=el('label','oa-field-label',ui.studentLabel);studentLabel.htmlFor='oa-student';
 const student=el('input','oa-input');student.id='oa-student';student.name='student';student.placeholder=ui.studentPlaceholder;student.autocomplete='off';student.value=getGameState().studentInput;
 student.oninput=()=>{try{rememberStudent(student.value);}catch{status.textContent=ui.storageFailure;}};
 const codeLabel=el('label','oa-field-label',ui.codeLabel);codeLabel.htmlFor='oa-code';
 const codeRow=el('div','oa-code-row');const code=el('input','oa-input');code.id='oa-code';code.name='code';code.placeholder=ui.codePlaceholder;code.inputMode='numeric';code.maxLength=6;code.autocomplete='one-time-code';
 const request=el('button','oa-request',ui.requestCode);request.type='button';request.onclick=()=>{const error=requestLoginCode(student.value);status.textContent=error??ui.sent;status.classList.toggle('oa-error',!!error);};codeRow.append(code,request);
 const description=el('p','oa-description',ui.description);code.setAttribute('aria-describedby','oa-code-description');description.id='oa-code-description';
 const submit=el('button','oa-submit',ui.login);submit.type='submit';
 const success=el('div','oa-success');success.hidden=true;
 let redirectTimer: ReturnType<typeof setTimeout> | undefined;
 main.addEventListener('screen-dispose',()=>clearTimeout(redirectTimer));
 function showSuccess(){ form.hidden=true; tabs.hidden=true;unavailable.hidden=true;success.hidden=false;success.replaceChildren(el('h2','',ui.success),el('p','',ui.successPlaceholder));
  if(!redirectTimer){const authenticatedAt=getGameState().authenticatedAt ?? Date.now();redirectTimer=setTimeout(()=>{if(main.isConnected && getGameState().authenticated)location.replace('#/oa/home');},Math.max(0,authenticatedAt+4000-Date.now()));}
 }
 form.onsubmit=event=>{event.preventDefault();const error=login(student.value,code.value);status.textContent=error??'';status.classList.toggle('oa-error',!!error);if(!error){showSuccess();onLoginSuccess?.();}};
 form.append(studentLabel,student,codeLabel,codeRow,description,submit);
 panel.append(tabs,form,unavailable,status,success);if(getGameState().authenticated)showSuccess();
 wrap.append(visual,panel);band.append(wrap);
 const news=el('section','oa-notices');news.append(el('h2','',ui.noticesHeading));for(const reference of notices.items){const item=portalNotices.items.find(n=>n.id===reference.noticeId)!;const row=el('article');const title=el('h3');const link=el('a','',item.title);link.href='#/oa/notices/'+item.id;title.append(link);row.append(el('time','',item.date),title);news.append(row);}
 const footer=el('footer','oa-footer');footer.append(el('p','',university.copyright));if(ui.developmentNote)footer.append(el('p','',ui.developmentNote));main.append(header,band,news,footer);return main;
}
