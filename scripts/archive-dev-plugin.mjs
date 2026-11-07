import {entryPaths,validateEntry} from './entry-content-model.mjs';
import {privatePaths,validatePrivate} from './private-commission-model.mjs';
import {hermitagePaths,validateHermitage} from './hermitage-2025-model.mjs';
import {validateConfrontation} from './sister-confrontation-model.mjs';
import {confrontationPaths} from './validate-sister-confrontation.mjs';
import {readFileSync,writeFileSync,renameSync,mkdirSync,existsSync,unlinkSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {archiveFiles,validateArchive} from './memory-archive-model.mjs';
/** @returns {import('vite').Plugin} */
export function archiveDevPlugin(){
 const token=randomUUID();let busy=false;let lastEntrySave=null;let entrySaveUntil=0;
 return {name:'memory-archive-local-editor',apply:'serve',handleHotUpdate(ctx){
  // A batch contains several JSON files: invalidate them without repeatedly
  // navigating the editor away while its save response is still arriving.
  if(Date.now()<entrySaveUntil&&Object.values(entryPaths).some(p=>ctx.file.replaceAll('\\','/').endsWith('/src/content/'+p+'.json'))){for(const mod of ctx.modules)ctx.server.moduleGraph.invalidateModule(mod);return [];}
 },configureServer(server){
  const root=server.config.root,content=resolve(root,'src/content/memoryArchive'),backups=resolve(root,'.tools/archive-backups'),uploads=resolve(root,'public/assets/images/memoryArchive/uploads');
  const read=()=>Object.fromEntries(archiveFiles.map(k=>[k,JSON.parse(readFileSync(join(content,k+'.json'),'utf8'))]));
  const readSister=()=>Object.fromEntries(Object.entries(confrontationPaths).map(([key,path])=>[key,JSON.parse(readFileSync(resolve(root,'src/content',path+'.json'),'utf8'))]));
  const readEntry=()=>Object.fromEntries(Object.entries(entryPaths).map(([key,path])=>[key,JSON.parse(readFileSync(resolve(root,'src/content',path+'.json'),'utf8'))]));
  const readPrivate=()=>Object.fromEntries(Object.entries(privatePaths).map(([key,path])=>[key,JSON.parse(readFileSync(resolve(root,'src/content',path+'.json'),'utf8'))]));
  const readHermitage=()=>Object.fromEntries(Object.entries(hermitagePaths).map(([key,path])=>[key,JSON.parse(readFileSync(resolve(root,'src/content',path+'.json'),'utf8'))]));
  const revision=b=>createHash('sha256').update(JSON.stringify(b)).digest('hex');
  server.middlewares.use('/__archive-dev',async(req,res,next)=>{
   const route=(req.url??'').split('?')[0];if(!['/content','/upload','/sister-content','/hermitage-content','/private-content','/entry-content'].includes(route)){next();return;}
   const reply=(status,value)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(value));};
   try{
    const host=req.headers.host??'';if(!/^(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(host))throw Error('Local developer access only');
    if(req.headers.origin&&req.headers.origin!==`http://${host}`&&req.headers.origin!==`https://${host}`)throw Error('Invalid request origin');
    if(req.method==='GET'&&['/content','/sister-content','/hermitage-content','/private-content','/entry-content'].includes(route)){const bundle=route==='/entry-content'?readEntry():route==='/private-content'?readPrivate():route==='/content'?read():route==='/hermitage-content'?readHermitage():readSister();reply(200,{bundle,revision:revision(bundle),token,...(route==='/entry-content'?{lastSave:lastEntrySave}:{})});return;}
    if(req.method!=='POST'||req.headers['x-archive-token']!==token)throw Error('Invalid developer request');
    const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>6*1024*1024)throw Error('Payload too large');chunks.push(chunk);}const body=Buffer.concat(chunks);
    if(route==='/upload'){
     if(!body.length||body.length>5*1024*1024)throw Error('Image size must be within 5MB');
     const kind=body.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'png':body[0]===255&&body[1]===216&&body[2]===255?'jpg':body.toString('ascii',0,4)==='RIFF'&&body.toString('ascii',8,12)==='WEBP'?'webp':null;
     if(!kind||(kind==='png'&&(body.length<45||body.toString('ascii',12,16)!=='IHDR'||body.toString('ascii',body.length-8,body.length-4)!=='IEND'))||(kind==='jpg'&&(body.length<20||body[body.length-2]!==255||body[body.length-1]!==217))||(kind==='webp'&&(body.length<20||body.readUInt32LE(4)+8!==body.length)))throw Error('Unsupported or incomplete image format');mkdirSync(uploads,{recursive:true});const name=randomUUID()+'.'+kind;writeFileSync(join(uploads,name),body,{flag:'wx'});reply(200,{path:'assets/images/memoryArchive/uploads/'+name});return;
    }
    if(route==='/entry-content'||route==='/sister-content'||route==='/hermitage-content'||route==='/private-content'){
     if(busy){reply(409,{error:'Another save is in progress'});return;}
     const payload=JSON.parse(body.toString('utf8'));if(route==='/entry-content')validateEntry(payload.bundle,path=>JSON.parse(readFileSync(resolve(root,'src/content',path+'.json'),'utf8')));else if(route==='/private-content')validatePrivate(payload.bundle,JSON.parse(readFileSync(resolve(root,'src/content/wechat/chats/luo-yao.json'),'utf8')).messages);else if(route==='/hermitage-content')validateHermitage(payload.bundle);else validateConfrontation(payload.bundle,JSON.parse(readFileSync(resolve(root,'src/content/bookstore/mail-messages.json'),'utf8')).items);
     const current=route==='/entry-content'?readEntry():route==='/private-content'?readPrivate():route==='/hermitage-content'?readHermitage():readSister();if(payload.revision!==revision(current)){reply(409,{error:'Project changed; export draft and reload'});return;}
     for(const a of payload.bundle.attachments?.items??[])if(!existsSync(resolve(root,'public',a.src)))throw Error('Image does not exist: '+a.src);
     if(route==='/hermitage-content')for(const src of [...payload.bundle.cg.scenes.map(s=>s.backgroundSrc),...payload.bundle.ending.assets.map(a=>a.src)].filter(Boolean)){if(!/^assets\/[\w/.-]+$/.test(src)||src.includes('..')||!existsSync(resolve(root,'public',src)))throw Error('Invalid or missing resource: '+src);}
     if(route==='/private-content')for(const a of payload.bundle.ending.assets??[]){if(a.src.includes('..')||!/^assets\/[\w/.-]+$/.test(a.src))throw Error('Invalid optional resource');}
     const targets=Object.entries(route==='/entry-content'?entryPaths:route==='/private-content'?privatePaths:route==='/hermitage-content'?hermitagePaths:confrontationPaths).map(([key,path])=>({key,file:resolve(root,'src/content',path+'.json')}));const suffix=randomUUID();const backup=resolve(root,route==='/entry-content'?'.tools/opening-content-backups':route==='/private-content'?'.tools/private-commission-backups':route==='/hermitage-content'?'.tools/hermitage-2025-backups':'.tools/sister-confrontation-backups',new Date().toISOString().replace(/[:.]/g,'-')+'-'+suffix);mkdirSync(backup,{recursive:true});
     const originals=targets.map(t=>({...t,raw:readFileSync(t.file)}));const temps=[];busy=true;if(route==='/entry-content')entrySaveUntil=Date.now()+2000;
     try{for(const t of originals)writeFileSync(join(backup,t.key+'.json'),t.raw,{flag:'wx'});for(const t of targets){const temp=t.file+'.'+suffix+'.tmp';writeFileSync(temp,JSON.stringify(payload.bundle[t.key],null,2)+'\n',{flag:'wx'});temps.push(temp);}for(const [i,t]of targets.entries())renameSync(temps[i],t.file);if(route==='/entry-content')lastEntrySave={revision:revision(payload.bundle),backup:backup.slice(root.length+1)};reply(200,{revision:revision(payload.bundle),backup:backup.slice(root.length+1)});}
     catch(error){for(const t of originals){const temp=t.file+'.rollback-'+suffix+'.tmp';writeFileSync(temp,t.raw);renameSync(temp,t.file);}throw error;}
     finally{for(const temp of temps)if(existsSync(temp))unlinkSync(temp);busy=false;}return;
    }
    if(busy){reply(409,{error:'Another save is in progress'});return;}
    const payload=JSON.parse(body.toString('utf8'));validateArchive(payload.bundle);const current=read();if(payload.revision!==revision(current)){reply(409,{error:'Project changed since loading; export your draft, then reload the latest project'});return;}
    for(const a of payload.bundle.attachments.items)for(const i of a.images)if(!existsSync(resolve(root,'public',i.src)))throw Error('Image does not exist: '+i.src);
    busy=true;const suffix=randomUUID(),backup=join(backups,new Date().toISOString().replace(/[:.]/g,'-')+'-'+suffix);mkdirSync(backup,{recursive:true});
    const originals=new Map(archiveFiles.map(k=>[k,readFileSync(join(content,k+'.json'))]));const temporary=[];
    try{
     for(const [k,value]of originals)writeFileSync(join(backup,k+'.json'),value,{flag:'wx'});
     for(const k of archiveFiles){const temp=join(content,k+'.'+suffix+'.tmp');writeFileSync(temp,JSON.stringify(payload.bundle[k],null,2)+'\n',{flag:'wx'});temporary.push(temp);}
     for(const [i,k]of archiveFiles.entries())renameSync(temporary[i],join(content,k+'.json'));
     reply(200,{bundle:payload.bundle,revision:revision(payload.bundle),backup:backup.slice(root.length+1)});
    }catch(error){for(const [k,value]of originals){const temp=join(content,k+'.rollback-'+suffix+'.tmp');writeFileSync(temp,value);renameSync(temp,join(content,k+'.json'));}throw error;}
    finally{for(const temp of temporary)if(existsSync(temp))unlinkSync(temp);busy=false;}
   }catch(error){reply(400,{error:String(error.message??error)});}
  });
 }};
}
