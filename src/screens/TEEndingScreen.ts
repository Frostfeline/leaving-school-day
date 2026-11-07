import {showEndingUnlock} from '../components/EndingUnlock';
import {el} from '../utils/dom';
import {privateBundle,privateBlockText,privateSpeaker} from '../utils/private-commission-content';
import {getGameState,saveTrueCast,collectEnding} from '../state/game-state';
import {renderHeScene} from './HEEndingScreen';
import '../styles/true-ending.css';

export function TEEndingScreen(mode:'play'|'review'|'cast'='play') {
  const review=mode!=='play',castOnly=mode==='cast';
  const {trueEnding:ending,cast}=privateBundle;
  const main=el('main','he-ending te-ending');
  if(!castOnly){
    const article=el('article');
    const profile={...privateBundle,ending,resolveBlock:privateBlockText,speakerName:privateSpeaker};
    for(const scene of ending.scenes)article.append(renderHeScene(scene,profile));
    const controls=el('nav','he-controls');
    const enterCast=el('button','ne-return-button',ending.enterCast);
    enterCast.type='button';
    enterCast.onclick=startCast;
    controls.append(enterCast);
    main.append(article,controls);
  }

  let disposed=false;
  let animation:Animation|undefined;
  let audio:HTMLAudioElement|undefined;
  let frame=0;
  let stageOffset=0;
  let silent=false;
  const fadeMs=850;
  const closingDuration=cast.holdMs+2*fadeMs;
  const rollDuration=cast.durationMs-closingDuration;
  function stopAudio(){
    cancelAnimationFrame(frame);
    if(audio){audio.pause();audio.removeAttribute('src');audio.load();audio=undefined;}
  }
  const progress=review?null:getGameState().privateCommission.te;
  function startCast(){
    if(disposed||main.dataset.cast)return;
    if(!review&&!progress?.castStartedAt)saveTrueCast();
    main.dataset.cast='playing';
    const viewport=el('section','te-cast');
    viewport.setAttribute('aria-label',cast.title);
    main.replaceChildren(viewport);
    function showHome(){
      main.dataset.cast='finished';
      stopAudio();
      const home=el('a','te-cast-home',ending.returnHome);
      home.href='#/';
      viewport.replaceChildren(home);
    }
    if(progress?.castFinishedAt){showHome();return;}
    const credits=el('div','te-cast-roll');
    credits.append(el('h1','',cast.title));
    for(const group of cast.groups){
      const section=el('section','te-cast-group');
      section.append(el('h2','',group.title));
      for(const person of group.people){
        const entry=el('div','te-cast-person');
        entry.append(el('p','te-cast-name',person.name));
        if(person.note)entry.append(el('p','te-cast-note',person.note));
        section.append(entry);
      }
      credits.append(section);
    }
    viewport.append(credits);
    const elapsed=progress?.castStartedAt?Date.now()-progress.castStartedAt:0;
    audio=new Audio(cast.audioSrc);
    audio.preload='auto';
    const prompt=el('button','te-cast-home',cast.resumeMusic);
    function offerResume(failed=false){
      if(disposed||main.dataset.cast==='finished')return;
      prompt.textContent=failed?cast.continueSilent:cast.resumeMusic;
      prompt.onclick=()=>{
        if(failed){silent=true;stopAudio();prompt.remove();animation?.play();}
        else void audio?.play().catch(()=>offerResume());
      };
      viewport.append(prompt);
    }
    audio.addEventListener('loadedmetadata',()=>{
      if(audio)audio.currentTime=Math.min(elapsed/1000,cast.durationMs/1000);
    },{once:true});
    audio.addEventListener('playing',()=>{prompt.remove();});
    audio.addEventListener('ended',()=>{
      if(animation)animation.finish();
    });
    audio.addEventListener('error',()=>offerResume(true));
    function syncMusic(){
      if(disposed||!audio)return;
      const time=Math.min(audio.currentTime*1000,cast.durationMs);
      audio.volume=Math.max(0,Math.min(1,(cast.durationMs-time)/fadeMs));
      if(animation){
        animation.currentTime=Math.max(0,time-stageOffset);
        if(time>=stageOffset+Number(animation.effect?.getTiming().duration))animation.finish();
      }
      frame=requestAnimationFrame(syncMusic);
    }
    // Starting playback here retains the user's click activation. A refreshed tab
    // can request another click; neither the credits nor audio advance silently.
    void audio.play().catch(()=>{if(audio?.error)offerResume(true);else offerResume();});
    requestAnimationFrame(()=>{
      if(disposed||!main.isConnected)return;
      const start=viewport.clientHeight;
      const finish=-credits.offsetHeight;
      const duration=rollDuration;
      animation=credits.animate([{transform:`translateY(${start}px)`},{transform:`translateY(${finish}px)`}],{duration,fill:'both',easing:'linear'});
      animation.pause();
      animation.currentTime=Math.min(elapsed,duration);
      frame=requestAnimationFrame(syncMusic);
      void animation.finished.then(()=>{
        if(disposed)return;
        const closing=el('p','te-cast-closing',cast.closing);
        viewport.replaceChildren(closing);
        stageOffset=rollDuration;
        animation=closing.animate([
          {opacity:0},
          {opacity:1,offset:fadeMs/closingDuration},
          {opacity:1,offset:1-fadeMs/closingDuration},
          {opacity:0}
        ],{duration:closingDuration,fill:'both'});
        if(!silent)animation.pause();
        animation.currentTime=Math.max(0,Math.min(closingDuration,elapsed-duration));
        return animation.finished.then(()=>{
          if(disposed)return;
          showHome();
          if(!review){saveTrueCast(true);if(collectEnding('te-unfinished-pact'))showEndingUnlock(main,ending.finalLabel);}
        });
      }).catch(()=>{});
    });
  }
  main.addEventListener('screen-dispose',()=>{
    disposed=true;
    stopAudio();
    animation?.cancel();
  });
  if(castOnly||progress?.castStartedAt)queueMicrotask(startCast);
  return main;
}
