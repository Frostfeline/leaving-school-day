import editorUI from '../content/bookstore/editor.json';
import {mailThreads,mailMessages,bookstoreMemberName} from '../utils/bookstore-mail-content';
import {getBookstoreContent} from '../utils/bookstore-content';
import {el} from '../utils/dom';
import {validateBookstoreMail} from '../../scripts/validate-bookstore-mail-data.mjs';
import {bookstoreAccounts as accounts} from '../utils/story-dates';
import loginUI from '../content/bookstore/login-ui.json';
import mailUI from '../content/bookstore/mail-ui.json';
import characters from '../content/wechat/characters.json';

export function BookstoreMailEditor(){
 const ui=editorUI.mail;const threads=structuredClone(mailThreads),messages=structuredClone(mailMessages);const root=el('details','bse-mail-editor');root.dataset.mailEditor='true';root.append(el('summary','',ui.heading));const controls=el('section');root.append(el('p','bse-notice',ui.notice),controls);let groupId=threads.groups[0]?.id??'',messageId='';
 for(const event of ['input','change'])root.addEventListener(event,e=>e.stopPropagation());
 const button=(text:string,action:()=>void)=>{const b=el('button','',text);b.type='button';b.onclick=action;return b;};
 function render(){
  controls.replaceChildren();const select=el('select');select.setAttribute('aria-label',ui.group);for(const g of threads.groups){const option=el('option','',g.date+' '+g.time);option.value=g.id;select.append(option);}select.value=groupId;select.onchange=()=>{groupId=select.value;messageId='';render();};controls.append(el('h2','',ui.group),select);
  const group=threads.groups.find(g=>g.id===groupId);const thread=threads.items.find(t=>t.id===group?.threadId)??threads.items[0];const preview=el('section','bse-mail-preview');preview.setAttribute('aria-label',ui.preview);
  const updatePreview=()=>{preview.replaceChildren(el('h3','',ui.preview));if(group)for(const id of group.messageIds){const m=messages.items.find(m=>m.id===id)!;const letter=el('article');const sender=m.senderId===thread.accountId?bookstoreMemberName(m.senderId):getBookstoreContent().sellers.shops.find(s=>s.id===m.senderId)!.name;letter.append(el('strong','',sender),el('p','',m.text));preview.append(letter);}};
  const field=(label:string,value:string,update:(value:string)=>void,type='text')=>{const wrap=el('label','bse-field');wrap.append(el('span','',label));const input=type==='textarea'?el('textarea'):el('input');if(input instanceof HTMLInputElement)input.type=type;input.value=value;input.setAttribute('aria-label',label);input.oninput=()=>{update(input.value);updatePreview();};wrap.append(input);return wrap;};
  if(group){controls.append(field(ui.date,group.date,v=>group.date=v,'date'),field(ui.time,group.time,v=>group.time=v,'time'));if(!group.messageIds.includes(messageId))messageId=group.messageIds[0]??'';const pick=el('select');pick.setAttribute('aria-label',ui.message);for(const id of group.messageIds){const option=el('option','',id);option.value=id;pick.append(option);}pick.value=messageId;pick.onchange=()=>{messageId=pick.value;render();};controls.append(pick);
   const m=messages.items.find(m=>m.id===messageId);if(m){const sender=el('select');sender.setAttribute('aria-label',ui.sender);for(const id of [thread.accountId,thread.shopId]){const name=id===thread.accountId?bookstoreMemberName(id):getBookstoreContent().sellers.shops.find(s=>s.id===id)!.name;const option=el('option','',name);option.value=id;sender.append(option);}sender.value=m.senderId;sender.onchange=()=>{m.senderId=sender.value;updatePreview();};controls.append(sender,field(ui.text,m.text,v=>m.text=v,'textarea'));
    for(const [label,step]of [[ui.up,-1],[ui.down,1]] as const){const b=button(label,()=>{const i=group.messageIds.indexOf(m.id),to=i+step;[group.messageIds[i],group.messageIds[to]]=[group.messageIds[to],group.messageIds[i]];render();});const to=group.messageIds.indexOf(m.id)+step;b.disabled=to<0||to>=group.messageIds.length;controls.append(b);}controls.append(button(ui.remove,()=>{messages.items=messages.items.filter(x=>x.id!==m.id);group.messageIds=group.messageIds.filter(id=>id!==m.id);messageId='';render();}));}
   controls.append(button(ui.add,()=>{const id='mail-'+crypto.randomUUID();messages.items.push({id,threadId:thread.id,groupId:group.id,senderId:thread.accountId,text:''});group.messageIds.push(id);messageId=id;render();}),button(ui.removeGroup,()=>{messages.items=messages.items.filter(m=>m.groupId!==group.id);threads.groups=threads.groups.filter(g=>g.id!==group.id);groupId=threads.groups[0]?.id??'';messageId='';render();}));
  }
  controls.append(button(ui.addGroup,()=>{const id='group-'+crypto.randomUUID();threads.groups.push({id,threadId:thread.id,date:'',time:'',messageIds:[]});groupId=id;messageId='';render();}));
  const status=el('p','bse-status');status.setAttribute('role','status');const exportSelect=el('select');exportSelect.setAttribute('aria-label',ui.exportFile);for(const name of ['mail-messages','mail-threads']){const option=el('option','',name+'.json');option.value=name;exportSelect.append(option);}
  function serialize(){try{validateBookstoreMail({accounts,'login-ui':loginUI,'mail-ui':mailUI,'mail-threads':threads,'mail-messages':messages,sellers:getBookstoreContent().sellers,characters});status.textContent=ui.valid;return JSON.stringify(exportSelect.value==='mail-messages'?messages:threads,null,2)+'\n';}catch(e){status.textContent=ui.invalid+String(e);return null;}}
  controls.append(exportSelect,button(ui.copy,()=>{const text=serialize();if(text)void navigator.clipboard.writeText(text).then(()=>status.textContent=ui.copied,()=>status.textContent=ui.copyFailure);}),button(ui.download,()=>{const text=serialize();if(!text)return;const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=el('a');a.href=url;a.download=exportSelect.value+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent=ui.downloaded;}),status,preview);updatePreview();
 }
 render();return root;
}
