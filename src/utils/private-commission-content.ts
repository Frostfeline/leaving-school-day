import trueEnding from '../content/endings/te-unfinished-pact.json';
import cast from '../content/endings/te-cast.json';
import verification from '../content/bookstore/private/verification.json';
import dialogue from '../content/bookstore/private/owner-dialogue-2025.json';
import archive from '../content/bookstore/private/commission-archive-2021.json';
import invitation from '../content/bookstore/private/invitation.json';
import ending from '../content/endings/be-unauthorized-tomorrow.json';
import ui from '../content/bookstore/private/ui.json';
import {libraryValue} from './library-content';
import {chatMessages,characterName} from './wechat-content';
export const privateContactAvatar='assets/images/bookstore/private-contact-avatar.svg';
export const privateBundle={verification,dialogue,archive,invitation,ending,trueEnding,cast,ui};
export function privateText(text:string){return text.replaceAll('{collectionCode}',libraryValue('collectionCode')).replaceAll('{amountYuan}',libraryValue('amount').replace(/[^\d.]/g,'').replace(/\.00$/,''));}
export const privateSpeaker=(id:string)=>id==='owner'?ui.ownerName:id==='linchen'?ui.playerName:id==='system'?ui.systemName:characterName(id);
export function privateBlockText(block:any){return block.type==='messageReference'?chatMessages['luo-yao'].messages.find(m=>m.id===block.messageId)?.text??'':privateText(block.text??'');}
