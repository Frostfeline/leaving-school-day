import {el} from '../utils/dom';
import previewUI from '../content/wechat/dialogues/sister-confrontation-ui.json';

type ChatImage={src:string;title:string;alt:string;placeholder?:boolean;paragraphs?:string[]};
type PreviewUI=Pick<typeof previewUI,'openImage'|'close'|'placeholder'|'missingImage'>;

export function chatImageButton(parent:HTMLElement,attachment:ChatImage,onViewed?:()=>void){
 const button=el('button','wc-s3-image');
 button.type='button';
 button.setAttribute('aria-label',previewUI.openImage.replace('{title}',attachment.title));
 const image=el('img');
 image.src=import.meta.env.BASE_URL+attachment.src;
 image.alt=attachment.alt;
 image.onerror=()=>{image.hidden=true;};
 button.append(image);
 button.onclick=()=>showChatImage(parent,attachment,onViewed);
 return button;
}

export function showChatImage(parent:HTMLElement,attachment:ChatImage,onViewed?:()=>void,ui:PreviewUI=previewUI){
 const dialog=el('dialog','s3-manuscript-dialog');
 dialog.setAttribute('aria-label',attachment.title);
 const close=el('button','',ui.close);
 close.type='button';close.onclick=()=>dialog.close();
 const header=el('header');header.append(close);
 const body=el('article'),image=el('img');
 image.src=import.meta.env.BASE_URL+attachment.src;
 image.alt=attachment.alt;
 const note=el('p','s3-manuscript-note',attachment.placeholder?ui.placeholder:'');
 image.onerror=()=>{image.hidden=true;note.textContent=ui.missingImage;};
 body.append(image,note,...(attachment.paragraphs??[]).map(p=>el('p','s3-manuscript-text',p)));
 dialog.append(header,body);parent.append(dialog);
 dialog.onclose=()=>dialog.remove();
 dialog.onclick=e=>{if(e.target===dialog)dialog.close();};
 dialog.showModal();onViewed?.();
}
