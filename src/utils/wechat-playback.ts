import {el} from './dom';
import {routeUrl,routes} from './routes';
export function messagePlaybackState(typing:boolean,revealing:boolean,hasChoices:boolean){return typing?'typing':revealing?'revealingMessage':hasChoices?'awaitingChoice':'messageVisible';}
/** Emphasized inline links keep authored punctuation and never inject HTML. */
export function appendLinkedText(target:HTMLElement,text:string,links:Array<{id:string;text:string;routeId:string}>){
 const matches=links.flatMap(link=>{const needle='*'+link.text+'*',at=text.indexOf(needle);return at<0||!Object.hasOwn(routes,link.routeId)?[]:[{...link,at,needle}];}).sort((a,b)=>a.at-b.at);let start=0;
 for(const match of matches){if(match.at<start)continue;target.append(el('span','',text.slice(start,match.at)));const a=el('a','wc-inline-link');a.dataset.linkId=match.id;a.append(el('strong','',match.text));a.href=routeUrl(match.routeId as keyof typeof routes);a.target='_blank';a.rel='noopener noreferrer';target.append(a);start=match.at+match.needle.length;}
 target.append(el('span','',text.slice(start)));
}
