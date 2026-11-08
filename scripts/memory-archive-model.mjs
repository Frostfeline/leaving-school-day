export const archiveFiles=['ui','chats','attachments','puzzle','archive-meta'];
export const archiveDate=(item,meta)=>item.dateRef?meta.dates[item.dateRef]:item.timestamp;
export function validateArchive(bundle){
 const fail=(path,message)=>{throw Error('memoryArchive/'+path+': '+message)};
 const text=(v,p)=>{if(typeof v!=='string'||!v.trim())fail(p,'必须填写文字')};
 const unique=(rows,p)=>{if(!Array.isArray(rows))fail(p,'必须为数组');const ids=new Set();for(const item of rows){text(item.id,p+'.id');if(ids.has(item.id)||!/^[-a-zA-Z0-9]+$/.test(item.id))fail(p+'.'+item.id,'ID无效或重复');ids.add(item.id)};return ids;};
 for(const file of archiveFiles)if(bundle[file]?.schemaVersion!==1)fail(file+'.schemaVersion','不支持此数据版本');
 const meta=bundle['archive-meta'];for(const key of ['title','subtitle','description','contentVersion'])text(meta[key],'archive-meta.'+key);
 const actors=['linchen','luoyao'];if(!actors.includes(meta.ownerId)||!Array.isArray(meta.participantIds)||meta.participantIds.length!==2||new Set(meta.participantIds).size!==2||!meta.participantIds.every(id=>actors.includes(id)))fail('archive-meta.participantIds','人物引用无效');
 for(const key of ['anniversary','linchenBirthday','luoyaoBirthday']){const d=meta.dates?.[key];if(typeof d!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(Date.parse(d))||new Date(d).toISOString().slice(0,10)!==d)fail('archive-meta.dates.'+key,'日期无效');}
 const sources=unique(meta.sources,'archive-meta.sources');for(const s of meta.sources)text(s.label,'archive-meta.sources.label');
 const status=item=>{if(!['confirmed','draft','needs-review'].includes(item.reviewStatus)||!sources.has(item.sourceId))fail(item.id,'确认状态或资料来源无效');};
 const time=item=>{if(item.dateRef&&!Object.hasOwn(meta.dates,item.dateRef))fail(item.id+'.dateRef','日期引用无效');const t=archiveDate(item,meta);if(typeof t!=='string'||!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}\+08:00)?$/.test(t)||!Number.isFinite(Date.parse(t))||new Date(t.slice(0,10)).toISOString().slice(0,10)!==t.slice(0,10)||(/T/.test(t)&&(!/T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d/.test(t))))fail(item.id+'.timestamp','日期时间无效');};
 const groups=unique(bundle.chats.groups,'chats.groups'),messages=unique(bundle.chats.messages,'chats.messages'),attachments=unique(bundle.attachments.items,'attachments.items');
 if(!groups.size||!messages.size)fail('chats','缺少聊天');
 for(const g of bundle.chats.groups){status(g);time(g);if(typeof g.searchable!=='boolean')fail(g.id+'.searchable','需要布尔值');if(g.requiresCompletion!==undefined&&typeof g.requiresCompletion!=='boolean')fail(g.id+'.requiresCompletion','需要布尔值');}
 const path=(v,p)=>{text(v,p);if(!/^assets\/images\/[-a-zA-Z0-9_/.]+\.(svg|png|jpe?g|webp)$/i.test(v)||v.includes('..')||v.includes('//'))fail(p,'仅支持项目内图片路径');};
 for(const a of bundle.attachments.items){status(a);for(const key of ['title','category','summary'])text(a[key],a.id+'.'+key);time({id:a.id,timestamp:a.date});if(!Array.isArray(a.images)||!a.images.length)fail(a.id+'.images','至少一张图片');unique(a.images,a.id+'.images');for(const image of a.images){path(image.src,a.id+'.images.src');text(image.alt,a.id+'.images.alt');if(typeof image.placeholder!=='boolean')fail(a.id+'.images.placeholder','需要布尔值');}if(!Array.isArray(a.fields)||!Array.isArray(a.sections))fail(a.id,'文档格式无效');for(const f of a.fields){text(f.label,a.id+'.fields.label');if(f.valueRef){if(![...actors,'university'].includes(f.valueRef))fail(a.id+'.fields.valueRef','引用无效');}else text(f.value,a.id+'.fields.value');}for(const s of a.sections){text(s.heading,a.id+'.sections.heading');if(!Array.isArray(s.paragraphs)||!s.paragraphs.length)fail(a.id+'.sections','缺少段落');s.paragraphs.forEach(p=>text(p,a.id+'.sections.paragraphs'));}}
 for(const m of bundle.chats.messages){status(m);time(m);text(m.text,m.id+'.text');if(!groups.has(m.chatGroupId)||!actors.includes(m.speakerId)||!['text','file','image','call'].includes(m.type)||typeof m.searchable!=='boolean')fail(m.id,'无效会话、人物或消息类型');if(!Array.isArray(m.attachmentRefs)||!m.attachmentRefs.every(id=>attachments.has(id)))fail(m.id+'.attachmentRefs','附件引用无效');if(m.type==='call'&&m.attachmentRefs.length)fail(m.id,'通话不能包含附件');}
 for(const g of groups)if(!bundle.chats.messages.some(m=>m.chatGroupId===g))fail(g,'会话至少需要一条消息');
 const pairs=bundle.puzzle.pairs;unique(pairs,'puzzle.pairs');if(!pairs.length)fail('puzzle.pairs','至少需要一组关联');const usedChats=new Set(),usedAttachments=new Set();
 for(const p of pairs){if(!groups.has(p.chatGroupId)||!attachments.has(p.attachmentId)||usedChats.has(p.chatGroupId)||usedAttachments.has(p.attachmentId))fail('puzzle.'+p.id,'无效或重复配对引用');usedChats.add(p.chatGroupId);usedAttachments.add(p.attachmentId);}
 if(bundle.chats.groups.some(g=>g.requiresCompletion&&usedChats.has(g.id)))fail('puzzle.pairs','奖励记录不能参与配对');
 if([...attachments].some(id=>!usedAttachments.has(id)&&!bundle.attachments.items.find(a=>a.id===id).requiresCompletion&&!bundle.chats.messages.some(m=>m.attachmentRefs.includes(id))))fail('puzzle.pairs','附件关联有遗漏');
 if(!Array.isArray(bundle.puzzle.summary))fail('puzzle.summary','必须为段落数组');bundle.puzzle.summary.forEach(p=>text(p,'puzzle.summary'));
 const checkText=(value,p)=>{if(typeof value==='string')text(value,p);else if(value&&typeof value==='object')for(const [k,v]of Object.entries(value)){if(k!=='schemaVersion')checkText(v,p+'.'+k);}else fail(p,'需要界面文字');};checkText(bundle.ui,'ui');
 for(const key of ['readonly','backChat','search','organize','progress','tray','slot','success','wrong','complete','completeText','reset','resetConfirm','close','previous','next','date','placeholder','storageError','editor','tabs','review'])if(!bundle.ui[key])fail('ui.'+key,'缺少必填文案');
 for(const key of ['chats','attachments','puzzle','settings','preview'])text(bundle.ui.editor?.sections?.[key],'ui.editor.sections.'+key);
 for(const key of ['chats','attachments'])text(bundle.ui.tabs?.[key],'ui.tabs.'+key);
 for(const key of ['confirmed','draft','needs-review'])text(bundle.ui.review?.[key],'ui.review.'+key);
 for(const key of ['allMonths','allRoles','allStatuses','all','results','noResults','select','selected','used','chooseFirst','duplicate','unlink','unlinkConfirm','unlinked','viewChat','viewAttachment','viewProgress','instructions','help','resetDone','images','date','placeholder','storageError','bookstore'])text(bundle.ui[key],'ui.'+key);
 for(const key of ['title','notice','draft','saved','unsaved','saveDraft','draftSaved','saveProject','export','import','restore','restoreConfirm','resetPreview','importConfirm','valid','invalid','saveFailed','saving','loadFailed','addMessage','deleteMessage','deleteConfirm','addGroup','deleteGroup','up','down','id','group','timestamp','speaker','text','source','review','searchable','attachmentRefs','titleLabel','dateLabel','category','summary','fields','imagePath','imageAlt','placeholderFlag','upload','addImage','deleteImage','newText','fileLimit','puzzleSummary','previewStatus','backup','draftNotice','sectionHeading','sectionBody','addSection','deleteSection','archiveTitle','archiveSubtitle','archiveDescription','contentVersion','anniversary','linchenBirthday','luoyaoBirthday','sourceLabel','interfaceText'])text(bundle.ui.editor[key],'ui.editor.'+key);
 return bundle;
}
export function normalizeArchiveProgress(value,puzzle){
 const pairs=puzzle.pairs;
 const legacy=new Set(Array.isArray(value?.matchedPairIds)?value.matchedPairIds:[]);
 const slots=(key,field)=>{
  const allowed=new Set(pairs.map(pair=>pair[field]));
  const seen=new Set();
  return pairs.map((pair,index)=>{
   const id=Array.isArray(value?.[key])?value[key][index]:legacy.has(pair.id)?pair[field]:null;
   if(!allowed.has(id)||seen.has(id))return null;
   seen.add(id);return id;
  });
 };
 const timelineSlots=slots('timelineSlots','chatGroupId'),attachmentSlots=slots('attachmentSlots','attachmentId');
 const orderedCount=pairs.filter((pair,index)=>pair.chatGroupId===timelineSlots[index]).length;
 const matchedCount=timelineSlots.filter((group,index)=>group&&pairs.some(pair=>pair.chatGroupId===group&&pair.attachmentId===attachmentSlots[index])).length;
 return {progressVersion:2,timelineSlots,attachmentSlots,orderedCount,matchedCount,archivePuzzleCompleted:orderedCount===pairs.length&&matchedCount===pairs.length,visitedArchive:!!value?.visitedArchive,lastOpenedArchiveTab:value?.lastOpenedArchiveTab==='attachments'?'attachments':'chats',lastViewedConversationId:typeof value?.lastViewedConversationId==='string'?value.lastViewedConversationId:null};
}
export function placeArchiveItem(progress,puzzle,key,index,id){
 const state=normalizeArchiveProgress(progress,puzzle);
 const field=key==='timelineSlots'?'chatGroupId':'attachmentId';
 if(!Number.isInteger(index)||index<0||index>=puzzle.pairs.length||!puzzle.pairs.some(pair=>pair[field]===id))return state;
 const slots=state[key];
 const from=slots.indexOf(id);
 if(from>=0)slots[from]=slots[index];
 slots[index]=id;
 return normalizeArchiveProgress(state,puzzle);
}
