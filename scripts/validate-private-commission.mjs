import {readFileSync} from 'node:fs';
import {privatePaths,validatePrivate} from './private-commission-model.mjs';
export const readPrivateFiles=()=>Object.fromEntries(Object.entries(privatePaths).map(([key,path])=>[key,JSON.parse(readFileSync('src/content/'+path+'.json','utf8'))]));
export function validatePrivateFiles(){validatePrivate(readPrivateFiles(),JSON.parse(readFileSync('src/content/wechat/chats/luo-yao.json','utf8')).messages);}
