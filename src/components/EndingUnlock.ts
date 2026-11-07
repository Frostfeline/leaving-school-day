import {el} from '../utils/dom';
import {intro} from '../utils/content';

export function showEndingUnlock(parent:HTMLElement,title:string){
  const notice=el('aside','ending-unlock-notice');
  notice.setAttribute('role','status');
  notice.append(el('span','',intro.actions.endingUnlocked),el('strong','',title));
  parent.append(notice);
  setTimeout(()=>notice.remove(),3500);
}

export function watchEndingTitle(label:Element,onRead:()=>void){
  let timer:ReturnType<typeof setTimeout>|undefined;
  const observer=new IntersectionObserver(([entry])=>{
    clearTimeout(timer);
    if(entry.intersectionRatio>=.6)check();
  },{threshold:.6});
  function check(){
    if(!label.isConnected)return;
    const opacity=Number(getComputedStyle(label).opacity);
    const scene=label.closest('.he-scene');
    const sceneOpacity=scene?Number(getComputedStyle(scene).opacity):1;
    if(!document.hidden&&opacity>=.99&&sceneOpacity>=.99){
      observer.disconnect();
      onRead();
    }else timer=setTimeout(check,100);
  }
  observer.observe(label);
  return ()=>{observer.disconnect();clearTimeout(timer);};
}
