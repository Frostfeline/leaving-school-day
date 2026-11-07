import {readFileSync,existsSync} from 'node:fs';
import {archiveFiles,validateArchive} from './memory-archive-model.mjs';
export function readArchiveFiles(){return Object.fromEntries(archiveFiles.map(name=>[name,JSON.parse(readFileSync('src/content/memoryArchive/'+name+'.json','utf8'))]));}
export function validateArchiveFiles(){const bundle=validateArchive(readArchiveFiles());for(const item of bundle.attachments.items)for(const image of item.images)if(!existsSync('public/'+image.src))throw Error('memoryArchive/attachments.'+item.id+': 图片不存在 '+image.src);return bundle;}
