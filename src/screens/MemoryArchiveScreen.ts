import {el} from '../utils/dom';
import {getGameState,saveArchiveProgress,subscribeGameState} from '../state/game-state';
import {characterName} from '../utils/wechat-content';
import {archiveBundle,type ArchiveBundle,type ArchiveProgress} from '../utils/memory-archive-content';
import {archiveDate,normalizeArchiveProgress,placeArchiveItem} from '../../scripts/memory-archive-model.mjs';
import '../styles/memory-archive.css';

export function MemoryArchiveScreen(options:{bundle?:ArchiveBundle;preview?:boolean;progress?:ArchiveProgress;onProgress?:(p:ArchiveProgress)=>void}={}){
 const data=options.bundle??archiveBundle,ui=data.ui,meta=data['archive-meta'];const page=el('main','ma-page');const abort=new AbortController();
 let progress:ArchiveProgress=normalizeArchiveProgress(options.preview?options.progress:getGameState().archive,data.puzzle),tab=progress.lastOpenedArchiveTab,group=data.chats.groups.some(g=>g.id===progress.lastViewedConversationId)?progress.lastViewedConversationId??'':'',selectedAttachment='',selectedDate='';
 const button=(label:string,fn:()=>void,cls='')=>{const b=el('button',cls,label);b.type='button';b.onclick=fn;return b;};
 const format=(text:string,values:Record<string,string|number>)=>Object.entries(values).reduce((s,[k,v])=>s.replaceAll('{'+k+'}',String(v)),text);
 const stamp=(item:any)=>archiveDate(item,meta) as string;
 const sortedGroups=()=>[...data.chats.groups].sort((a,b)=>stamp(a).localeCompare(stamp(b)));
 const rowsFor=(id:string)=>data.chats.messages.filter(m=>m.chatGroupId===id).sort((a,b)=>stamp(a).localeCompare(stamp(b)));
 const pretty=(value:string)=>new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'long',day:'numeric',timeZone:'Asia/Shanghai'}).format(new Date(value))+(value.includes('T')?' '+value.slice(11,16):'');
 const label=(id:string)=>{const g=data.chats.groups.find(g=>g.id===id);return g?pretty(stamp(g)):id;};
 const notice=el('p','ma-feedback');notice.setAttribute('role','status');
 function store(){progress=normalizeArchiveProgress(progress,data.puzzle);try{if(options.preview)options.onProgress?.(progress);else saveArchiveProgress(progress);}catch{notice.textContent=ui.storageError;}}
 const head=el('header','ma-header');head.append(el('h1','',meta.title));page.append(head);
 const library=el('section','ma-library');const toolbar=el('div','ma-toolbar');const tabs=el('div','ma-tabs');tabs.setAttribute('role','tablist');
 for(const id of ['chats','attachments'] as const){const b=button(ui.tabs[id],()=>{tab=id;progress.lastOpenedArchiveTab=id;store();renderDocuments();});b.dataset.tab=id;b.setAttribute('role','tab');tabs.append(b);}toolbar.append(tabs);const browser=el('div','ma-browser');library.append(toolbar,browser);page.append(library);
 function previewAttachment(id:string){
  const a=data.attachments.items.find(a=>a.id===id);if(!a)return;
  const dialog=el('dialog','ma-dialog ma-image-dialog');dialog.setAttribute('aria-label',a.title);
  const close=button('×',()=>dialog.close(),'ma-image-close');close.setAttribute('aria-label',ui.close);
  const photo=el('img');let imageIndex=0;
  const show=()=>{const image=a.images[imageIndex];photo.src=import.meta.env.BASE_URL+image.src;photo.alt=image.alt;};
  photo.onerror=()=>{photo.onerror=null;photo.src=import.meta.env.BASE_URL+'assets/images/memoryArchive/document-placeholder.svg';};
  show();dialog.append(photo,close);
  if(data.puzzle.pairs.some(pair=>pair.attachmentId===id)){
   const select=button(ui.select,()=>{selectedAttachment=id;notice.textContent=format(ui.selected,{title:a.title});dialog.close();},'ma-image-select');
   dialog.append(select);
  }
  if(a.images.length>1){
   const controls=el('div','ma-photo-nav');
   controls.append(button(ui.previous,()=>{imageIndex=(imageIndex+a.images.length-1)%a.images.length;show();}),button(ui.next,()=>{imageIndex=(imageIndex+1)%a.images.length;show();}));
   dialog.append(controls);
  }
  page.append(dialog);dialog.onclose=()=>dialog.remove();dialog.onclick=e=>{if(e.target===dialog)dialog.close();};dialog.showModal();
 }
 function renderChatGroup(feed:HTMLElement){
  const g=data.chats.groups.find(item=>item.id===group)??sortedGroups()[0];
  feed.replaceChildren();feed.scrollTop=0;
  if(!g)return;
  const section=el('section','ma-chat-group');section.dataset.groupId=g.id;section.append(el('h3','',label(g.id)));
  for(const m of rowsFor(g.id)){
   const row=el('article','ma-chat-message'+(m.speakerId===meta.ownerId?' ma-chat-self':''));
   row.dataset.messageId=m.id;
   const content=el('div');content.append(el('small','',characterName(m.speakerId)),el('p','ma-chat-bubble',m.text));
   const date=stamp(m);if(date.includes('T')){const time=el('time','',date.slice(11,16));time.dateTime=date;content.append(time);}
   row.append(content);section.append(row);
  }
  feed.append(section);
  browser.querySelectorAll<HTMLButtonElement>('.ma-date-link').forEach(b=>b.setAttribute('aria-current',String(b.dataset.archiveGroup===g.id)));
 }
 function showChat(id:string){
  group=id;progress.lastViewedConversationId=id;
  const feed=browser.querySelector<HTMLElement>('.ma-chat-feed');
  if(tab==='chats'&&feed)renderChatGroup(feed);
  else{tab='chats';progress.lastOpenedArchiveTab=tab;renderDocuments();}
  store();
 }
 function renderDocuments(){
  tabs.querySelectorAll<HTMLElement>('button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===tab)));browser.replaceChildren();
  if(tab==='attachments'){
   const grid=el('div','ma-gallery');
   for(const a of scramble(data.attachments.items,true)){
    const b=button('',()=>previewAttachment(a.id),'ma-file');const image=el('img');
    image.src=import.meta.env.BASE_URL+a.images[0].src;image.alt=a.images[0].alt;
    image.onerror=()=>{image.onerror=null;image.src=import.meta.env.BASE_URL+'assets/images/memoryArchive/document-placeholder.svg';};
    b.setAttribute('aria-label',a.title);b.dataset.attachmentId=a.id;
    image.draggable=false;b.append(image);
    if(data.puzzle.pairs.some(pair=>pair.attachmentId===a.id))makeDraggable(b,'attachmentSlots',a.id);
    grid.append(b);
   }
   browser.append(grid);return;
  }
  const nav=el('aside','ma-months');const feed=el('section','ma-chat-feed');feed.tabIndex=0;
  for(const g of scramble(sortedGroups())){
   const date=button(label(g.id),()=>{
    if(data.puzzle.pairs.some(pair=>pair.chatGroupId===g.id))selectDate(g.id);
    showChat(g.id);
   },'ma-date-link');
   date.dataset.archiveGroup=g.id;
   if(data.puzzle.pairs.some(pair=>pair.chatGroupId===g.id)){
    makeDraggable(date,'timelineSlots',g.id);
    date.ondblclick=()=>{
     const next=progress.timelineSlots.indexOf(null);
     if(next>=0&&!progress.timelineSlots.includes(g.id))place('timelineSlots',next,g.id);
    };
   }
   nav.append(date);
  }
  browser.append(nav,feed);renderChatGroup(feed);
 }
 type SlotKey='timelineSlots'|'attachmentSlots';
 const dragTypes={timelineSlots:'application/x-memory-date',attachmentSlots:'application/x-memory-attachment'};
 function scramble<T>(items:T[],flip=false){
  // Keep the source order stable during play and use a different order for each tab.
  const odd=items.filter((_,index)=>index%2===1),even=items.filter((_,index)=>index%2===0);
  return flip?[...even.reverse(),...odd]:[...odd.reverse(),...even];
 }
 function makeDraggable(control:HTMLElement,key:SlotKey,id:string){
  control.draggable=true;
  control.ondragstart=e=>{if(e.dataTransfer){e.dataTransfer.effectAllowed='move';e.dataTransfer.setData(dragTypes[key],id);}control.classList.add('ma-dragging');};
  control.ondragend=()=>control.classList.remove('ma-dragging');
 }
 function selectDate(id:string){selectedDate=id;notice.textContent=format(ui.selectedDate,{title:label(id)});}
 const workspace=el('section','ma-workspace');
 const workHead=el('header');workHead.append(el('h2','',ui.organize));
 const pairs=el('div','ma-pairs'),done=el('section','ma-complete'),foot=el('div','ma-work-actions');
 const info=el('section','ma-work-info');info.id='ma-work-info';info.hidden=true;
 const progressButton=button(ui.viewProgress,()=>{
  info.hidden=!info.hidden;progressButton.setAttribute('aria-expanded',String(!info.hidden));
  if(!info.hidden)info.scrollIntoView({block:'nearest'});
 });
 progressButton.setAttribute('aria-controls',info.id);progressButton.setAttribute('aria-expanded','false');
 foot.append(progressButton,button(ui.reset,()=>{
  if(!confirm(ui.resetConfirm))return;
  progress.timelineSlots=[];progress.attachmentSlots=[];selectedDate='';selectedAttachment='';
  savePuzzle(ui.resetDone);
 }));
 workspace.append(workHead,el('p','ma-work-hint',ui.help),el('p','ma-work-hint',ui.timelineHint),notice,pairs,done,foot,info);page.append(workspace);
 function savePuzzle(message:string){notice.textContent=message;store();renderPuzzle();}
 function place(key:SlotKey,index:number,id:string){
  if(!id){notice.textContent=ui.chooseFirst;return;}
  progress=placeArchiveItem(progress,data.puzzle,key,index,id);
  if(key==='timelineSlots')selectedDate='';else selectedAttachment='';
  savePuzzle(ui.placed);
 }
 function dropTarget(target:HTMLElement,key:SlotKey,index:number){
  target.ondragover=e=>{if(!e.dataTransfer?.types.includes(dragTypes[key]))return;e.preventDefault();e.dataTransfer.dropEffect='move';target.classList.add('ma-droppable');};
  target.ondragleave=()=>target.classList.remove('ma-droppable');
  target.ondrop=e=>{
   const id=e.dataTransfer?.getData(dragTypes[key]);
   target.classList.remove('ma-droppable');
   if(id){e.preventDefault();place(key,index,id);}
  };
 }
 function renderPuzzle(){
  pairs.replaceChildren();done.replaceChildren();
  info.textContent=format(ui.progressDetail,{ordered:progress.orderedCount,matched:progress.matchedCount,total:data.puzzle.pairs.length});
  for(const [index,pair] of data.puzzle.pairs.entries()){
   const row=el('article','ma-pair');row.dataset.pairId=pair.id;
   const left=el('div','ma-slot-area'),right=el('div','ma-slot-area');
   const dateId=progress.timelineSlots[index],attachmentId=progress.attachmentSlots[index];
   const date=button('',()=>{
    if(selectedDate){place('timelineSlots',index,selectedDate);return;}
    if(dateId){selectDate(dateId);showChat(dateId);}
   },dateId?'ma-chat-card':'ma-slot');
   date.dataset.timelineSlot=String(index);
   if(dateId){
    date.append(el('small','',label(dateId)),el('p','',rowsFor(dateId).slice(0,2).map(m=>m.text).join(' / ')));
    makeDraggable(date,'timelineSlots',dateId);
   }else date.textContent=ui.timelineSlot;
   left.append(date);dropTarget(left,'timelineSlots',index);
   if(dateId)left.append(button(ui.removeDate,()=>{progress.timelineSlots[index]=null;selectedDate='';savePuzzle(ui.unlinked);},'ma-unlink'));
   const attachment=data.attachments.items.find(a=>a.id===attachmentId);
   const tile=button(attachment?'':ui.slot,()=>{
    if(selectedAttachment){place('attachmentSlots',index,selectedAttachment);return;}
    if(attachment)previewAttachment(attachment.id);else notice.textContent=ui.chooseFirst;
   },attachment?'ma-matched ma-slot-image':'ma-slot');
   tile.dataset.attachmentSlot=String(index);
   if(attachment){
    const img=el('img');img.src=import.meta.env.BASE_URL+attachment.images[0].src;img.alt=attachment.images[0].alt;img.draggable=false;
    tile.setAttribute('aria-label',attachment.title);tile.append(img);makeDraggable(tile,'attachmentSlots',attachment.id);
   }
   right.append(tile);dropTarget(right,'attachmentSlots',index);
   if(attachment)right.append(button(ui.unlink,()=>{if(confirm(ui.unlinkConfirm)){progress.attachmentSlots[index]=null;selectedAttachment='';savePuzzle(ui.unlinked);}},'ma-unlink'));
   row.append(left,right);pairs.append(row);
  }
  if(progress.archivePuzzleCompleted){
   done.append(el('h3','',ui.complete),el('p','',format(ui.completeText,{count:data.puzzle.pairs.length})),...data.puzzle.summary.map(text=>el('p','',text)));
  }
 }
 page.addEventListener('screen-dispose',()=>abort.abort());if(!options.preview)subscribeGameState(()=>{progress=normalizeArchiveProgress(getGameState().archive,data.puzzle);renderPuzzle();},abort.signal);
 renderDocuments();renderPuzzle();progress.visitedArchive=true;queueMicrotask(()=>{if(page.isConnected)store();});return page;
}
