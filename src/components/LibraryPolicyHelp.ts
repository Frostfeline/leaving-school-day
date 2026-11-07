import policy from '../content/oa-library-policy.json';
import {el} from '../utils/dom';
export function helpIcon(){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.classList.add('oa-help-icon');
 for(const [tag,attributes]of [['circle',{cx:'12',cy:'12',r:'9'}],['path',{d:'M9.5 9a2.5 2.5 0 0 1 5 0c0 1.8-2.5 2-2.5 4M12 16h.01'}]] as const){const shape=document.createElementNS(svg.namespaceURI,tag);for(const [k,v]of Object.entries(attributes))shape.setAttribute(k,v);svg.append(shape);}return svg;
}
export function LibraryPolicyHelp(){
 const button=el('button','oa-policy-help');button.type='button';button.setAttribute('aria-label',policy.openLabel);button.setAttribute('aria-haspopup','dialog');button.append(helpIcon());
 button.onclick=()=>{if(document.querySelector('[data-library-policy]'))return;const dialog=el('dialog','oa-policy-popover');dialog.dataset.libraryPolicy=policy.id;dialog.setAttribute('aria-labelledby','library-policy-title');dialog.style.maxWidth=policy.presentation.maxWidthPx+'px';dialog.style.maxHeight=policy.presentation.maxHeightVh+'svh';const title=el('h2','',policy.title);title.id='library-policy-title';const close=el('button','oa-policy-close',policy.closeLabel);close.type='button';close.onclick=()=>dialog.close();dialog.append(title,close);for(const section of policy.sections){dialog.append(el('h3','',section.heading),...section.paragraphs.map(p=>el('p','',p)));}dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});dialog.onclose=()=>{dialog.remove();button.focus();};document.body.append(dialog);dialog.showModal();};return button;
}
