import {validateBookstoreMail} from './validate-bookstore-mail-data.mjs';
export {validateBookstoreMail};
import {readFileSync} from 'node:fs';
function readRawBookstoreMailFiles(){const read=n=>{try{return JSON.parse(readFileSync('src/content/'+n+'.json','utf8'))}catch(e){throw Error('src/content/'+n+'.json: '+e)}};return {...Object.fromEntries(['accounts','login-ui','mail-threads','mail-messages','mail-ui'].map(n=>[n,read('bookstore/'+n)])),sellers:read('bookstore/sellers'),characters:read('wechat/characters')};}
export function readBookstoreMailFiles(){const data=readRawBookstoreMailFiles();const dates=JSON.parse(readFileSync('src/content/memoryArchive/archive-meta.json','utf8')).dates;data.accounts.accounts=data.accounts.accounts.map(a=>({...a,password:dates[a.passwordDateRef]?.replaceAll('-','')??a.password}));return data;}
export function validateBookstoreMailFiles(){validateBookstoreMail(readBookstoreMailFiles());}
