import {bookstoreAccounts as accounts} from './story-dates';
import loginUI from '../content/bookstore/login-ui.json';
import threads from '../content/bookstore/mail-threads.json';
import messages from '../content/bookstore/mail-messages.json';
import ui from '../content/bookstore/mail-ui.json';
import {characterName} from './wechat-content';
export {accounts as bookstoreAccounts,loginUI as bookstoreLoginUI,threads as mailThreads,messages as mailMessages,ui as mailUI};
export const bookstoreMemberName=(id:string)=>{const account=accounts.accounts.find(a=>a.id===id);return account?characterName(account.characterId):'';};
export const mailRoute=(id='')=>`#/bookstore/mail?${new URLSearchParams(id?{thread:id}:{})}`;
