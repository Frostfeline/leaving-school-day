import {el} from '../utils/dom';
import ui from '../content/documents/pdf-viewer.json';
import '../styles/pdf-preview.css';

export function showPdfPreview(parent:HTMLElement,attachment:{fileName:string;src:string},trigger:HTMLElement){
 const positions:{el:HTMLElement;top:number;left:number}[]=[];
 for(let n:HTMLElement|null=trigger;n;n=n.parentElement)positions.push({el:n,top:n.scrollTop,left:n.scrollLeft});
 const win={x:scrollX,y:scrollY};
 const dialog=el('dialog','game-pdf');dialog.setAttribute('aria-label',attachment.fileName);
 const bar=el('header','game-pdf-toolbar'),name=el('strong','',attachment.fileName),pages=el('span','game-pdf-pages'),zoom=el('select'),close=el('button','',ui.close);
 zoom.setAttribute('aria-label',ui.zoom);close.type='button';close.onclick=()=>dialog.close();
 for(const [value,label] of [['fit',ui.fit],['0.75','75%'],['1','100%'],['1.25','125%'],['1.5','150%'],['2','200%']]){const o=el('option','',label);o.value=value;zoom.append(o);}
 bar.append(name,pages,zoom,close);const body=el('div','game-pdf-body');body.setAttribute('aria-label',ui.document);const status=el('p','game-pdf-status',ui.loading);status.setAttribute('role','status');body.append(status);dialog.append(bar,body);parent.append(dialog);
 let disposed=false,revision=0,task:any,pdf:any,engine:any;const renders:any[]=[];
 const cleanup=()=>{if(disposed)return;disposed=true;revision++;for(const r of renders)r.cancel();void task?.destroy();dialog.remove();parent.removeEventListener('screen-dispose',onDispose);trigger.focus({preventScroll:true});for(const p of positions){p.el.scrollTop=p.top;p.el.scrollLeft=p.left;}window.scrollTo(win.x,win.y);};
 const onDispose=()=>{if(dialog.open)dialog.close();cleanup();};parent.addEventListener('screen-dispose',onDispose);dialog.addEventListener('close',cleanup,{once:true});dialog.showModal();close.focus({preventScroll:true});
 async function render(){
  const current=++revision;for(const r of renders)r.cancel();renders.length=0;body.replaceChildren();zoom.disabled=true;
  try{for(let number=1;number<=pdf.numPages;number++){
   const page=await pdf.getPage(number);if(disposed||current!==revision)return;
   const base=page.getViewport({scale:1});const scale=zoom.value==='fit'?Math.min(1.4,Math.max(.3,(body.clientWidth-48)/base.width)):Number(zoom.value);
   const viewport=page.getViewport({scale});const sheet=el('section','game-pdf-sheet');sheet.setAttribute('aria-label',ui.page.replace('{number}',String(number)));sheet.style.width=viewport.width+'px';sheet.style.height=viewport.height+'px';sheet.style.setProperty('--total-scale-factor',String(scale));
   const canvas=el('canvas');canvas.setAttribute('aria-hidden','true');const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.ceil(viewport.width*ratio);canvas.height=Math.ceil(viewport.height*ratio);canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';
   const layer=el('div','textLayer');sheet.append(canvas,layer);body.append(sheet);
   const rendering=page.render({canvasContext:canvas.getContext('2d')!,viewport,transform:ratio===1?undefined:[ratio,0,0,ratio,0,0]});renders.push(rendering);await rendering.promise;if(disposed||current!==revision)return;
   const text=new engine.TextLayer({textContentSource:await page.getTextContent(),container:layer,viewport});renders.push(text);await text.render();
  }}catch(error){if(!disposed&&current===revision){console.error('PDF_RENDER_FAILED',error);body.replaceChildren(el('p','game-pdf-status',ui.failed));}}
  finally{if(!disposed&&current===revision)zoom.disabled=false;}
 }
 zoom.onchange=()=>void render();zoom.disabled=true;
 void(async()=>{try{const moduleUrl=new URL(import.meta.env.BASE_URL+'assets/vendor/pdfjs/pdf.mjs',location.href).href;engine=await import(/* @vite-ignore */moduleUrl);if(disposed)return;engine.GlobalWorkerOptions.workerSrc=import.meta.env.BASE_URL+'assets/vendor/pdfjs/pdf.worker.mjs';task=engine.getDocument({url:import.meta.env.BASE_URL+attachment.src});pdf=await task.promise;if(disposed)return;pages.textContent=ui.pages.replace('{count}',String(pdf.numPages));await render();}catch(error){if(!disposed){console.error('PDF_LOAD_FAILED',error);status.textContent=ui.failed;}}})();
}
