import {validateInvestigation,readInvestigationFiles} from './validate-investigation.mjs';
import {validateOAPortalFiles} from './validate-oa-portal.mjs';
import {validateContent} from './validate-content.mjs';
import {validateWeChatFiles} from './validate-wechat.mjs';
export const entryPaths={intro:'intro',ui:'wechat-entry',presentation:'wechat/presentation',chats:'wechat/chat-list',characters:'wechat/characters',sister:'wechat/chats/sister',classGroup:'wechat/chats/class-group',market:'wechat/chats/flea-market',service:'wechat/chats/university-service',reminder:'wechat/sister-reminder-2',oaHome:'oa-home',notices:'oa-notices',library:'oa-library-record',libraryService:'oa-library-assistant',policy:'oa-library-policy',payment:'oa-payment',ne:'ending-ne'};
export function validateEntry(bundle,readExternal){
 const byPath=new Map(Object.entries(entryPaths).map(([key,path])=>[path,bundle[key]]));
 const read=path=>byPath.has(path)?byPath.get(path):readExternal(path);
 validateContent(bundle.intro,readExternal('game-config'),readExternal('common'),bundle.ui);
 validateWeChatFiles(read);
 validateOAPortalFiles(read);
 validateInvestigation(readInvestigationFiles(read));
 const fail=field=>{throw Error('src/content/wechat/presentation.json.'+field+': invalid configuration');};
 const p=bundle.presentation;
 if(!p||p.schemaVersion!==1||!/^\d{4}-\d{2}-\d{2}$/.test(p.storyDate)||!Number.isFinite(Date.parse(p.storyDate)))fail('storyDate');
 for(const [key,value]of Object.entries({initialDelayMs:p.opening?.initialDelayMs,timeSeparatorMs:p.timeSeparatorMs,newMessageIntervalMs:p.newMessageIntervalMs,durationMs:p.animation?.durationMs,offsetPx:p.animation?.offsetPx}))if(!Number.isFinite(value)||value<0||value>3600000)fail(key);
 for(const k of ['typingText','historyEndText','pdfPlaceholderText','pdfPlaceholderClose','unreadCountLabel'])if(typeof p[k]!=='string'||!p[k].trim())fail(k);
 if(!p.unreadCountLabel.includes('{count}')||!p.opening.replyId||!bundle.sister.messages.some(m=>m.id===p.opening.replyMessageId&&m.senderId==='linchen'))fail('opening.replyMessageId');
 // The two incoming opening messages and the single player choice are stable roles.
 if(bundle.sister.messages.length!==3||bundle.sister.messages.slice(0,2).some(m=>m.senderId!=='linyuan'))fail('opening.messages');
}
