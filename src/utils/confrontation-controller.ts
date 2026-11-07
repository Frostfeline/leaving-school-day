import {getGameState,nextConfrontationAt,advanceConfrontation,subscribeGameState} from '../state/game-state';
// One controller for the current tab. The existing game lock makes multi-tab
// ticks and choices idempotent; no screen navigation is performed here.
export function startConfrontationController(){
 let timer:ReturnType<typeof setTimeout>|undefined;const abort=new AbortController();
 const schedule=()=>{clearTimeout(timer);if(location.hash.includes('/editor')||location.hash.startsWith('#/dev/'))return;const state=getGameState(),at=nextConfrontationAt(state);if(at!==null)timer=setTimeout(()=>{void advanceConfrontation(state.timelineRevision).catch(console.error);},Math.max(0,at-Date.now()));};
 subscribeGameState(schedule,abort.signal);window.addEventListener('hashchange',schedule,{signal:abort.signal});window.addEventListener('focus',schedule,{signal:abort.signal});document.addEventListener('visibilitychange',schedule,{signal:abort.signal});schedule();
 return ()=>{clearTimeout(timer);abort.abort();};
}
