import {el} from '../utils/dom';
import {fortuneSite as ui,fortunePaywall as pay,fortuneResults,matchFortune,validBirthDate,type FortuneInput} from '../utils/fortune-content';
import '../styles/fortune.css';

export function FortuneMatchScreen(){
 const page=el('main','fortune-page');const wrap=el('div','fortune-wrap');page.append(wrap);let disposed=false;
 const header=el('header','fortune-header');const brand=el('div','fortune-brand');brand.append(el('span','fortune-seal',ui.seal),el('strong','',ui.name),el('span','fortune-subtitle',ui.subtitle));const nav=el('nav','fortune-nav');nav.setAttribute('aria-label',ui.navigationLabel);header.append(brand,nav);wrap.append(header);
 const hero=el('section','fortune-hero');hero.append(el('h1','',ui.title),el('p','',ui.tagline));wrap.append(hero);
 const form=el('form','fortune-form');form.noValidate=true;const people=el('div','fortune-people');const controls:{name:HTMLInputElement;birthDate:HTMLInputElement;hour:HTMLSelectElement}[]=[];
 for(const [i,personLabel]of ui.form.people.entries()){
  const fieldset=el('fieldset','fortune-person');fieldset.append(el('legend','',personLabel));
  const nameLabel=el('label','',ui.form.name);const name=el('input');name.id=`fortune-name-${i}`;name.type='text';name.autocomplete='off';name.placeholder=ui.form.namePlaceholder;nameLabel.htmlFor=name.id;
  const birthLabel=el('label','',ui.form.birthDate);const birthDate=el('input');birthDate.id=`fortune-birth-${i}`;birthDate.type='date';birthDate.autocomplete='off';birthLabel.htmlFor=birthDate.id;
  const hourLabel=el('label','',ui.form.hour);const hour=el('select');hour.id=`fortune-hour-${i}`;hourLabel.htmlFor=hour.id;const unknown=el('option','',ui.form.unknownHour);unknown.value='';hour.append(unknown);for(const choice of ui.hours){const option=el('option','',choice.label);option.value=choice.id;hour.append(option);}
  const fields=el('div','fortune-fields');fields.append(nameLabel,name,birthLabel,birthDate,hourLabel,hour);fieldset.append(fields);people.append(fieldset);controls.push({name,birthDate,hour});
 }
 const error=el('p','fortune-form-error');error.setAttribute('role','alert');error.hidden=true;
 const submit=el('button','fortune-submit',ui.form.submit);submit.type='submit';form.append(people,error,submit,el('p','fortune-form-note',ui.form.note));wrap.append(form);
 const result=el('section','fortune-result');result.setAttribute('aria-live','polite');result.setAttribute('aria-label',ui.emptyResult.title);wrap.append(result);
 const emptyResult=()=>{result.dataset.mode='empty';result.replaceChildren(el('h2','fortune-result-title',ui.emptyResult.title),el('div','fortune-empty-emblem',ui.emptyResult.emblem),el('p','fortune-empty-text',ui.emptyResult.text));};emptyResult();
 const explanation=el('dialog','fortune-paywall fortune-explanation-dialog');const heading=el('h2','',ui.explanationTitle);const dismiss=el('button','fortune-paywall-close',ui.explanationClose);dismiss.type='button';dismiss.onclick=()=>explanation.close();explanation.append(dismiss,heading,...ui.explanationParagraphs.map(p=>el('p','',p)));explanation.onclick=e=>{if(e.target===explanation){const r=explanation.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)explanation.close();}};page.append(explanation);wrap.append(el('footer','fortune-footer',ui.footer));
 for(const item of ui.navigation){const button=el('button','',item.label);button.type='button';button.onclick=()=>explanation.showModal();nav.append(button);}
 const dialog=el('dialog','fortune-paywall');dialog.setAttribute('aria-labelledby','fortune-paywall-title');const close=el('button','fortune-paywall-close','×');close.type='button';close.setAttribute('aria-label',pay.close);close.onclick=()=>dialog.close();const payTitle=el('h2','',pay.title);payTitle.id='fortune-paywall-title';const price=pay.currency+pay.amount.toFixed(2);const payBody=el('div','fortune-paywall-body');payBody.append(...pay.paragraphs.map(p=>el('p','',p.replaceAll('{price}',price))),el('strong','fortune-pay-price',price));const unlock=el('button','fortune-unlock',pay.unlock);unlock.type='button';const later=el('button','fortune-later',pay.later);later.type='button';later.onclick=()=>dialog.close();const payStatus=el('p','fortune-pay-status');payStatus.setAttribute('role','status');unlock.onclick=()=>{payStatus.textContent=pay.unavailable;};payBody.append(unlock,later,el('p','fortune-pay-note',pay.note),payStatus);dialog.append(close,payTitle,payBody);page.append(dialog);
 let savedTop=0,savedLeft=0;let parentScrolls:{node:HTMLElement;top:number}[]=[];
 const restore=()=>{if(disposed)return;for(const s of parentScrolls)s.node.scrollTop=s.top;window.scrollTo(savedLeft,savedTop);};
 const showPaywall=()=>{payStatus.textContent='';savedTop=window.scrollY;savedLeft=window.scrollX;parentScrolls=[];for(let node=submit.parentElement;node;node=node.parentElement)if(node.scrollHeight>node.clientHeight)parentScrolls.push({node,top:node.scrollTop});dialog.showModal();later.focus({preventScroll:true});restore();};
 dialog.addEventListener('close',()=>{if(!disposed){submit.focus({preventScroll:true});restore();}});
 page.addEventListener('screen-dispose',()=>{disposed=true;if(dialog.open)dialog.close();});
 form.onsubmit=event=>{
  event.preventDefault();error.textContent='';error.hidden=true;
  const inputs:FortuneInput[]=controls.map(c=>({name:c.name.value.trim(),birthDate:c.birthDate.value,hourId:c.hour.value}));
  for(const [i,value]of inputs.entries()){
   const person=ui.form.people[i];let message='';let target:HTMLElement=controls[i].name;
   if(!value.name)message=ui.form.missingName;else if(!value.birthDate){message=ui.form.missingBirthDate;target=controls[i].birthDate;}else if(!validBirthDate(value.birthDate)){message=ui.form.invalidBirthDate;target=controls[i].birthDate;}
   if(message){error.textContent=message.replace('{person}',person);error.hidden=false;target.focus();return;}
   controls[i].name.value=value.name;
  }
  const match=matchFortune(inputs);
  if(!match){emptyResult();showPaywall();return;}
  const data=match.result;result.dataset.mode=match.enhanced?'enhanced':'basic';result.replaceChildren(el('h2','fortune-result-title',data.title),el('h3','fortune-result-headline',data.headline));
  if(match.enhanced)result.append(el('p','fortune-enhanced-label',data.enhanced.label));
  const score=el('div','fortune-score');score.append(el('strong','',String(data.score)),el('span','',` / ${data.maximumScore}`));if(data.showScore)result.append(score,el('p','fortune-score-label',data.scoreLabel));const fields=el('dl','fortune-result-fields');for(const item of [...data.fields,...(match.enhanced?data.enhanced.fields:[])]){const row=el('div');row.append(el('dt','',item.label),el('dd','',item.value));fields.append(row);}result.append(fields);
  const paragraphs=el('div','fortune-result-prose');paragraphs.append(...data.paragraphs.map(p=>el('p','',p)));result.append(paragraphs);
  const reset=el('button','fortune-reset',fortuneResults.reset);reset.type='button';reset.onclick=()=>{emptyResult();error.hidden=true;error.textContent='';if(ui.resetClearsInputs)form.reset();form.scrollIntoView({block:'nearest'});controls[0].name.focus({preventScroll:true});};result.append(reset);result.scrollIntoView({block:'nearest'});
 };
 return page;
}
