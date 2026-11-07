import {readFileSync,existsSync} from 'node:fs';
import {validateConfrontation} from './sister-confrontation-model.mjs';
export const confrontationPaths={dialogue:'wechat/dialogues/sister-confrontation-3',ui:'wechat/dialogues/sister-confrontation-ui',attachments:'wechat/attachments/sister-manuscript',reading:'bookstore/mail-reading'};
export function readConfrontationFiles(){return Object.fromEntries(Object.entries(confrontationPaths).map(([key,path])=>[key,JSON.parse(readFileSync('src/content/'+path+'.json','utf8'))]));}
export function validateConfrontationFiles(){const data=readConfrontationFiles();validateConfrontation(data,JSON.parse(readFileSync('src/content/bookstore/mail-messages.json','utf8')).items);for(const a of data.attachments.items)if(!existsSync('public/'+a.src))throw Error('sister-confrontation/attachments: 图片不存在 '+a.src);return data;}
