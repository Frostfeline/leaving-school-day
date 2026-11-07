import {confrontationBundle} from './sister-confrontation-content';
import {getGameState,markNingMessagesVisible} from '../state/game-state';

export function observeNingHistory(root:HTMLElement,threadId:string){
  if(location.hash.startsWith('#/dev/')||location.hash.includes('/editor'))return ()=>{};
  const rule=confrontationBundle.reading;
  if(threadId!==rule.threadId)return ()=>{};

  const requiredIds=new Set(rule.requiredReadMessageIds);
  const nodes=Array.from(root.querySelectorAll<HTMLElement>('[data-mail-id]')).filter(node=>requiredIds.has(node.dataset.mailId!));
  const timers=new Map<HTMLElement,ReturnType<typeof setTimeout>>();
  let frame:number|undefined;

  function clear(node:HTMLElement){
    clearTimeout(timers.get(node));
    timers.delete(node);
  }

  function visibleEnough(node:HTMLElement,bounds:DOMRect){
    if(document.hidden||!node.isConnected)return false;
    const rect=node.getBoundingClientRect();
    const visibleHeight=Math.min(rect.bottom,bounds.bottom,innerHeight)-Math.max(rect.top,bounds.top,0);
    return rect.height>0&&bounds.height>0&&visibleHeight>=Math.min(rect.height,bounds.height)*.6;
  }

  function update(){
    frame=undefined;
    const read=new Set(getGameState().ningReadMessageIds);
    const bounds=root.getBoundingClientRect();
    for(const node of nodes){
      const id=node.dataset.mailId!;
      if(read.has(id)||!visibleEnough(node,bounds)){clear(node);continue;}
      if(timers.has(node))continue;
      timers.set(node,setTimeout(()=>{
        timers.delete(node);
        if(visibleEnough(node,root.getBoundingClientRect()))markNingMessagesVisible(threadId,[id]);
      },rule.visibleDwellMs));
    }
  }

  function schedule(){
    if(frame===undefined)frame=requestAnimationFrame(update);
  }

  const observer=new IntersectionObserver(schedule,{root,threshold:[0,.6,1]});
  for(const node of nodes)observer.observe(node);
  const onVisibility=()=>{
    if(document.hidden)for(const node of timers.keys())clear(node);
    else schedule();
  };
  const events=new AbortController();
  document.addEventListener('visibilitychange',onVisibility,{signal:events.signal});
  root.addEventListener('scroll',schedule,{passive:true,signal:events.signal});
  window.addEventListener('scroll',schedule,{passive:true,signal:events.signal});
  schedule();
  return ()=>{
    events.abort();
    observer.disconnect();
    if(frame!==undefined)cancelAnimationFrame(frame);
    for(const node of timers.keys())clear(node);
  };
}
