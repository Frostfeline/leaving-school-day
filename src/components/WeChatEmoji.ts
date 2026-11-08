import {el} from '../utils/dom';

export function appendWeChatText(parent:HTMLElement,text:string){
 for(const part of text.split(/(\[Doge\])/g)){
  if(part==='[Doge]'){
   const image=el('img');image.src=import.meta.env.BASE_URL+'assets/images/wechat/wechat-doge.webp';
   image.alt='[Doge]';image.title='微信狗头（旺柴）';image.width=24;image.height=24;
   image.style.display='inline-block';image.style.verticalAlign='middle';
   parent.append(image);
  }else if(part)parent.append(el('span','',part));
 }
}
