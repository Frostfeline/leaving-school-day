import {el} from '../utils/dom';
import {mailUI as ui} from '../utils/bookstore-mail-content';

export type BookstoreChatMode = 'history' | 'interactive';
// A future story controller supplies the mode and data-driven reply handler.
// This component never creates messages or changes global game progress.
export function BookstoreChatComposer(options:{mode:BookstoreChatMode;onSend?:(text:string)=>void}) {
 const form=el('form','bs-mail-composer');
 const input=el('textarea');input.rows=2;input.setAttribute('aria-label',ui.composer.label);
 const submit=el('button','bs-member-primary',ui.composer.send);submit.type='submit';
 const note=el('p','bs-mail-composer-note');
 let current=options;
 function update(next:typeof options){current=next;form.dataset.mode=next.mode;const readonly=next.mode==='history';input.disabled=readonly;input.placeholder=readonly?ui.readonly:ui.composer.placeholder;note.textContent=readonly?ui.readonly:'';note.hidden=!readonly;submit.disabled=readonly||!next.onSend||!input.value.trim();}
 input.oninput=()=>update(current);
 form.onsubmit=e=>{e.preventDefault();if(current.mode!=='interactive'||!current.onSend||!input.value.trim())return;current.onSend(input.value.trim());input.value='';update(current);};
 form.append(input,note,submit);update(options);
 return {element:form,setMode:update};
}
