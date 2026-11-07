import {readFileSync,existsSync} from 'node:fs';
import {hermitagePaths,validateHermitage} from './hermitage-2025-model.mjs';
export const readHermitageFiles=()=>Object.fromEntries(Object.entries(hermitagePaths).map(([key,path])=>[key,JSON.parse(readFileSync('src/content/'+path+'.json','utf8'))]));
export function validateHermitageFiles(){const b=readHermitageFiles();validateHermitage(b);for(const src of [...b.cg.scenes.map(s=>s.backgroundSrc),...b.ending.assets.map(a=>a.src)].filter(Boolean))if(!/^assets\/[\w/.-]+$/.test(src)||src.includes('..')||!existsSync('public/'+src))throw Error('Hermitage resource missing: '+src);}
