import {chatMessages} from './utils/wechat-content';
import {TEEndingScreen} from './screens/TEEndingScreen';
import {BEEndingScreen} from './screens/BEEndingScreen';
import {beAvailable,getHePresentation,rewindOwnerChoice,canRewindOwnerChoice} from './state/game-state';
import {privateBundle} from './utils/private-commission-content';
import {menuEndingId,preferHermitageRewind,rewindToHermitageChoice} from './state/game-state';
import {HePaymentCgScreen,HEEndingScreen} from './screens/HEEndingScreen';
import {canPlayHeCg} from './state/game-state';
import {hermitageBundle} from './utils/hermitage-2025-content';
import {startConfrontationController} from './utils/confrontation-controller';
import {WebSearchScreen} from './screens/WebSearchScreen';
import {MemoryArchiveScreen} from './screens/MemoryArchiveScreen';
import memoryArchive from './content/memoryArchive/archive-meta.json';
import './styles/memory-archive.css';
import searchUI from './content/wechat/search-ui.json';
import {FortuneMatchScreen} from './screens/FortuneMatchScreen';
import {FictionDetailScreen} from './screens/FictionDetailScreen';
import {fictionForRoute,fictionPageTitle} from './utils/fiction-content';
import {WeChatArticleScreen,DonglanAdmissionScreen} from './screens/WeChatArticleScreen';
import {ADMISSION_ARTICLE_ROUTE,searchableArticles} from './utils/wechat-article-content';
import {fortuneSite,FORTUNE_ROUTE} from './utils/fortune-content';
import {ForumSnapshotScreen} from './screens/ForumSnapshotScreen';
import {forumSite} from './utils/forum-content';
import {LibraryAssistantScreen} from './screens/LibraryAssistantScreen';
import {BookstoreScreen} from './screens/BookstoreScreen';
import bookstoreSite from './content/bookstore/site.json';
import { OALoginScreen } from './screens/OALoginScreen';
import { OAContentScreen, notices } from './screens/OAContentScreen';
import { OAPaymentScreen } from './screens/OAPaymentScreen';
import { NEEndingScreen } from './screens/NEEndingScreen';
import { getGameState, markOAHomeEntered, subscribeGameState, canShowNE, restorePaidEnding, hasCollectedNE, restartGame, rewindToPayment } from './state/game-state';
import university from './content/university.json';
import ending from './content/ending-ne.json';
import { intro, config, common, validate } from './utils/content';
import { IntroScreen } from './screens/IntroScreen';
import { GameShell } from './screens/GameShell';
import './styles/main.css';
import {startWeChatNotification} from './components/WeChatNotification';
const app = document.querySelector<HTMLDivElement>('#app')!;
let renderToken=0;
let renderedRevision=getGameState().timelineRevision;
let renderedCollection=getGameState().collectedEndings.join();
export function startGame() { location.hash = `/game/${config.initialModule}/${config.initialConversationId}`; }
function render() {
  try {
    const token=++renderToken;
    validate();
    restorePaidEnding();
    if(import.meta.env.DEV && ['#/dev/opening-editor','#/dev/bookstore-editor','#/memory-archive/editor','#/dev/sister-confrontation-editor','#/dev/hermitage-2025-editor','#/dev/private-commission-editor'].includes(location.hash)){
     app.firstElementChild?.dispatchEvent(new Event('screen-dispose'));app.replaceChildren();
     if(location.hash==='#/dev/opening-editor'){void import('./dev/OpeningEditor').then(({OpeningEditor})=>{if(token===renderToken)app.replaceChildren(OpeningEditor());}).catch(console.error);return;}
     if(location.hash==='#/dev/private-commission-editor'){void import('./dev/PrivateCommissionEditor').then(({PrivateCommissionEditor})=>{if(token===renderToken)app.replaceChildren(PrivateCommissionEditor());}).catch(console.error);return;}
     if(location.hash==='#/dev/hermitage-2025-editor'){void import('./dev/Hermitage2025Editor').then(({Hermitage2025Editor})=>{if(token===renderToken)app.replaceChildren(Hermitage2025Editor());}).catch(console.error);return;}
     if(location.hash==='#/dev/sister-confrontation-editor'){void import('./dev/SisterConfrontationEditor').then(({SisterConfrontationEditor})=>{if(token===renderToken)app.replaceChildren(SisterConfrontationEditor());}).catch(console.error);return;}
     if(location.hash==='#/memory-archive/editor'){void import('./dev/MemoryArchiveEditor').then(({MemoryArchiveEditor})=>{if(token===renderToken)app.replaceChildren(MemoryArchiveEditor());}).catch(console.error);return;}
     void import('./dev/BookstoreEditor').then(({BookstoreEditor})=>{if(token===renderToken && ['#/dev/opening-editor','#/dev/bookstore-editor','#/memory-archive/editor','#/dev/sister-confrontation-editor'].includes(location.hash))app.replaceChildren(BookstoreEditor());}).catch(error=>{console.error(error);if(token===renderToken)app.textContent=common.loadFailure;});return;
    }
    let route=location.hash;const state=getGameState();renderedRevision=state.timelineRevision;renderedCollection=state.collectedEndings.join();
    const gameRoute=`#/game/${config.initialModule}/${config.initialConversationId}`;
    const noticeId=route.startsWith('#/oa/notices/')?route.slice('#/oa/notices/'.length):undefined;
    const notice=notices.items.find(n=>n.id===noticeId);
    if(route===privateBundle.ui.invitationRoute&&state.ending===privateBundle.trueEnding.endingId)route=privateBundle.ui.ownerRoute;
    const teReview=route==='#/endings/te'||route==='#/endings/te/cast';
    const teRoute=route==='#/ending/te'||teReview;
    if(teRoute&&(teReview?!state.collectedEndings.includes('te-unfinished-pact'):state.ending!=='te-unfinished-pact'))route='#/';
    const menuEnding=menuEndingId(state);
    const endingLinks=[
      {id:'ne-graduation',label:ending.finalLabel,route:'#/endings/ne'},
      {id:'he-ai-you-suo-gui',label:hermitageBundle.ending.finalLabel,route:'#/endings/he'},
      {id:'be-unauthorized-tomorrow',label:privateBundle.ending.finalLabel,route:'#/endings/be'},
      {id:'te-unfinished-pact',label:privateBundle.trueEnding.finalLabel,route:'#/endings/te'},
      {id:'te-unfinished-pact',label:privateBundle.trueEnding.replayCast,route:'#/endings/te/cast'},
    ].filter(item=>state.collectedEndings.some(id=>id===item.id));
    const ownerRewind=canRewindOwnerChoice(state);
    const beRoute=route==='#/ending/be'||route==='#/endings/be';
    if(beRoute&&(route==='#/endings/be'?!state.collectedEndings.includes('be-unauthorized-tomorrow'):!beAvailable(state)))route='#/';
    const heRoute=['#/ending/he/payment','#/ending/he','#/endings/he'].includes(route);
    if(heRoute&&(route==='#/endings/he'?!state.collectedEndings.includes('he-ai-you-suo-gui'):!canPlayHeCg(state)))route='#/';
    if(route==='#/ending/he'&&getHePresentation(state).stage!=='ending')route='#/ending/he/payment';
    const protectedRoute=(heRoute&&route!=='#/endings/he')||route==='#/oa/home'||(!!notice&&!notice.public)||route==='#/oa/library/record'||route==='#/oa/payment'||route==='#/ending/ne';
    if(protectedRoute && !state.authenticated)route='#/oa/login';
    if(route==='#/endings/ne' && !hasCollectedNE(state))route='#/';
    if(route==='#/ending/ne' && !canShowNE(state))route=state.authenticated?'#/oa/home':'#/oa/login';
    if(route==='#/oa/login' && state.authenticated && (state.oaHomeEntered || (state.authenticatedAt!==null && Date.now()>=state.authenticatedAt+4000)))route='#/oa/home';
    if(route.startsWith('#/oa/') && !notice?.public && canShowNE(state))route='#/ending/ne';
    const isSearch=route==='#/search'||route.startsWith('#/search?')||route.startsWith('#/search/documents/');
    if(route.startsWith('#/bookstore/shops/'))route='#/bookstore';
    const isBookstore=route==='#/bookstore'||route.startsWith('#/bookstore/');
    const isForum=route.startsWith('#/forum/threads/');
    const isFortune=route===FORTUNE_ROUTE;
    const article=searchableArticles.find(item=>item.route===route);
    const fiction=fictionForRoute(route);
    const archiveRequested=route==='#/memory-archive'||route.startsWith('#/memory-archive?');
    const archiveParams=new URLSearchParams(route.split('?')[1]);
    const isMemory=archiveRequested&&archiveParams.get('chat')==='litianming'&&chatMessages['li-tian-ming'].messages.some(message=>message.id===archiveParams.get('source')&&message.routeId==='memory-archive');
    if(archiveRequested&&!isMemory)route=gameRoute;
    const known=teRoute||beRoute||heRoute||isMemory||isSearch||!!fiction||!!article||isFortune||isForum||isBookstore||route===gameRoute||['#/oa/login','#/oa/home','#/oa/library/record','#/oa/payment','#/ending/ne','#/endings/ne','#/'].includes(route)||(route===location.hash && !!notice)||!route;
    if(!known)route='#/';
    if(route!==location.hash)history.replaceState(null,'',`${location.pathname}${location.search}${route}`);
    const isOA=route.startsWith('#/oa/');
    document.title=route==='#/endings/te/cast'?privateBundle.trueEnding.replayCast:(route==='#/ending/te'||route==='#/endings/te')?privateBundle.trueEnding.finalLabel:beRoute?privateBundle.ending.finalLabel:heRoute?hermitageBundle.ending.finalLabel:isSearch?searchUI.webHeading:fiction?fictionPageTitle(fiction):article?article.title:isFortune?fortuneSite.name:isForum?forumSite.name:isBookstore?bookstoreSite.name:(route==='#/ending/ne'||route==='#/endings/ne')?ending.title:isOA?`${university.name} · ${university.platformName}`:intro.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content',isSearch?searchUI.searchPrompt:fiction?fiction.description:article?article.summary:isFortune?fortuneSite.tagline:intro.tagline);
    app.firstElementChild?.dispatchEvent(new Event('screen-dispose'));
    const isRecord=route==='#/oa/library/record';
    const isContent=route==='#/oa/home'||isRecord||(!!notice && route.startsWith('#/oa/notices/'));
    const screen=route==='#/ending/te'?TEEndingScreen():route==='#/endings/te'?TEEndingScreen('review'):route==='#/endings/te/cast'?TEEndingScreen('cast'):route==='#/ending/be'?BEEndingScreen():route==='#/endings/be'?BEEndingScreen(true):route==='#/ending/he/payment'?HePaymentCgScreen():route==='#/ending/he'?HEEndingScreen():route==='#/endings/he'?HEEndingScreen(true):isMemory?MemoryArchiveScreen():isSearch?WebSearchScreen(route):fiction?FictionDetailScreen(fiction):article?(route===ADMISSION_ARTICLE_ROUTE?DonglanAdmissionScreen():WeChatArticleScreen()):isFortune?FortuneMatchScreen():isForum?ForumSnapshotScreen(route):isBookstore?BookstoreScreen(route):route==='#/endings/ne'?NEEndingScreen(true):route==='#/ending/ne'?NEEndingScreen():route==='#/oa/payment'?OAPaymentScreen():isRecord?LibraryAssistantScreen():isContent?OAContentScreen(isRecord?'library-exception':route==='#/oa/home'?undefined:noticeId,isRecord?'record':'summary'):route==='#/oa/login'?OALoginScreen():route===gameRoute?GameShell():IntroScreen(startGame,state.collectedEndings.length?{restart:()=>{restartGame();startGame();},rewind:ownerRewind?()=>{if(rewindOwnerChoice())location.hash=privateBundle.ui.ownerRoute;}:preferHermitageRewind(state)?()=>{if(rewindToHermitageChoice())location.hash='/bookstore/mail?thread=hermitage-history&stage=followup';}:menuEnding==='ne-graduation'?()=>{if(rewindToPayment())location.hash='/oa/payment';}:undefined,rewindDescription:ownerRewind?intro.beRewindDescription:preferHermitageRewind(state)?intro.heRewindDescription:intro.rewindDescription,rewindActionId:ownerRewind?'rewind-owner':preferHermitageRewind(state)?'rewind-hermitage':'rewind-payment',endingLinks,showAfterword:state.collectedEndings.includes('te-unfinished-pact'),viewEnding:()=>{location.hash=menuEnding==='te-unfinished-pact'?'/endings/te':menuEnding==='be-unauthorized-tomorrow'?'/endings/be':menuEnding==='he-ai-you-suo-gui'?'/endings/he':'/endings/ne';}}:undefined);
    app.replaceChildren(screen);if(isMemory){document.title=memoryArchive.title;document.querySelector('meta[name="description"]')?.setAttribute('content',memoryArchive.description);}window.scrollTo(0,0);
    if(route===gameRoute)document.getElementById('game-heading')?.focus();
    if(isContent&&state.authenticated)markOAHomeEntered();
  }catch(error){console.error(error);app.textContent=common.loadFailure;}
}
window.addEventListener('hashchange',render);
subscribeGameState(()=>{
 if(import.meta.env.DEV&&['#/dev/opening-editor','#/dev/bookstore-editor','#/memory-archive/editor','#/dev/sister-confrontation-editor','#/dev/hermitage-2025-editor','#/dev/private-commission-editor'].includes(location.hash))return;
 const state=getGameState();
 if(state.timelineRevision!==renderedRevision){
  const route=location.hash;
  if(route.startsWith('#/oa/') || route==='#/ending/ne'){
   const target=state.authenticated?'#/oa/payment':'#/';
   if(route!==target){location.hash=target;return;}
  }
  render();return;
 }
 if((!location.hash || location.hash==='#/') && state.collectedEndings.join()!==renderedCollection){render();return;}
 if((location.hash.startsWith('#/oa/') || location.hash==='#/ending/ne') && (location.hash!=='#/oa/login' || !!document.querySelector('.oa-success:not([hidden])')) && !state.authenticated)render();
});
render();
startWeChatNotification();
startConfrontationController();
