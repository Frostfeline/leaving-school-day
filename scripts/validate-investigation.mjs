import {readFileSync} from 'node:fs';
export function readInvestigationFiles(read=name=>{try{return JSON.parse(readFileSync(`src/content/${name}.json`,'utf8'))}catch(e){throw Error(`src/content/${name}.json: ${e}`)}}){return {fiction:read('fiction/novels'),article:read('wechat-article/article-meta'),admission:read('wechat-article/donglan-admission-2017'),forum:read('forum/forum-thread'),assistant:read('oa-library-assistant'),ui:read('wechat/search-ui'),reminder:read('wechat/sister-reminder-2'),index:read('search/search-index'),books:read('bookstore/books'),characters:read('wechat/characters'),chats:read('wechat/chat-list'),staticMessages:[...read('wechat/chat-list').flatMap(c=>read('wechat/chats/'+c.contentId).messages),...read('wechat/chats/luo-yao').messages]};}
export function validateInvestigation(data){
 const {assistant,ui,reminder,index,books,characters,chats,staticMessages,article,admission}=data;
 const fail=(p,m)=>{throw Error(`[content] src/content/${p}: ${m}`)};
 const text=(v,p)=>{if(typeof v!=='string'||!v.trim())fail(p,'必须填写文字')};
 const unique=(rows,p)=>{if(!Array.isArray(rows))fail(p,'必须为数组');const ids=new Set();for(const row of rows){text(row.id,p+'.id');if(ids.has(row.id))fail(p+'.id','重复ID '+row.id);ids.add(row.id)};};
 for(const k of ['title','subtitle','conversationLabel','botName','greeting','recordHeading','questionsHeading','fullRecordHeading','backSummary'])text(assistant[k],'oa-library-assistant.json.'+k);
 if(!assistant.title.includes('{university}'))fail('oa-library-assistant.json.title','缺少学校名称变量');
 const refs=['amount','responsiblePerson','originalBorrower','bookTitle','isbn','collectionCode','borrowedAt'];unique(assistant.fields,'oa-library-assistant.json.fields');for(const field of assistant.fields){text(field.label,'oa-library-assistant.json.fields.label');if(!refs.includes(field.valueRef))fail('oa-library-assistant.json.fields.valueRef','无效资料引用');}
 for(const ref of refs)if(!assistant.fields.some(f=>f.valueRef===ref))fail('oa-library-assistant.json.fields','缺少 '+ref);
 unique(assistant.questions,'oa-library-assistant.json.questions');for(const id of ['borrower_mismatch','book_details','request_review'])if(!assistant.questions.some(q=>q.id===id))fail('oa-library-assistant.json.questions','缺少稳定问题ID '+id);
 for(const q of assistant.questions){text(q.label,'oa-library-assistant.json.questions.'+q.id+'.label');if(!Array.isArray(q.paragraphs)||!q.paragraphs.length)fail('oa-library-assistant.json.questions.'+q.id+'.paragraphs','缺少回答');q.paragraphs.forEach(p=>text(p,'oa-library-assistant.json.questions.'+q.id+'.paragraphs'));if(typeof q.showFullRecord!=='boolean')fail('oa-library-assistant.json.questions.'+q.id+'.showFullRecord','必须为布尔值');}
 for(const k of ['contactsHeading','messagesHeading','noContacts','noMessages','nickname','webSearch','webHeading','resultsFor','noWebResults','searchPrompt','searchLabel','submit','back','backSearch','backChat','webRegion','bibliographyHeading','sourceLabel','messageSource','documentUnavailable'])text(ui[k],'wechat/search-ui.json.'+k);
 for(const [k,token]of [['webSearch','{query}'],['resultsFor','{query}'],['nickname','{name}'],['sourceLabel','{source}']])if(!ui[k].includes(token))fail('wechat/search-ui.json.'+k,'缺少变量 '+token);
 if(reminder.eventId!=='sister-reminder-2'||reminder.chatId!=='linyuan'||!chats.some(c=>c.id===reminder.chatId))fail('wechat/sister-reminder-2.json','事件或会话ID无效');unique(reminder.messages,'wechat/sister-reminder-2.json.messages');if(!reminder.messages.length)fail('wechat/sister-reminder-2.json.messages','不能为空');
 for(const m of reminder.messages){if(!characters[m.senderId])fail('wechat/sister-reminder-2.json.senderId','无效角色');text(m.text,'wechat/sister-reminder-2.json.'+m.id+'.text');if(staticMessages.some(s=>s.id===m.id))fail('wechat/sister-reminder-2.json.'+m.id,'与历史消息ID冲突');}
 for(const key of ['choicesLabel','typingText','newMessagesLabel'])text(reminder[key],'wechat/sister-reminder-2.json.'+key);
 if(!Number.isFinite(reminder.replyIntervalMs)||reminder.replyIntervalMs<=0||reminder.replyIntervalMs>60000)fail('wechat/sister-reminder-2.json.replyIntervalMs','需要有效的逐条回复间隔');
 if(typeof reminder.typingIndicator!=='boolean'||typeof reminder.questionTypingIndicator!=='boolean'||!Number.isFinite(reminder.typingDurationMs)||reminder.typingDurationMs<=0||reminder.typingDurationMs>60000)fail('wechat/sister-reminder-2.json.typingDurationMs','需要有效的输入状态文案和等待时长');
 unique(reminder.detailReplies,'wechat/sister-reminder-2.json.detailReplies');if(reminder.detailReplies.length!==2)fail('wechat/sister-reminder-2.json.detailReplies','需要两个分支回复');
 if(!Array.isArray(reminder.commonReplies)||!reminder.commonReplies.length)fail('wechat/sister-reminder-2.json.commonReplies','需要共同回复');
 const runtime=[...reminder.messages,reminder.question,...reminder.commonReplies,reminder.initialReply,...reminder.detailReplies];const runtimeIds=new Set();
 for(const m of runtime){const id=m?.messageId??m?.id;text(id,'wechat/sister-reminder-2.json.messageId');text(m?.text,'wechat/sister-reminder-2.json.text');if(!characters[m.senderId]||runtimeIds.has(id)||staticMessages.some(s=>s.id===id))fail('wechat/sister-reminder-2.json.'+id,'角色或消息ID无效/重复');runtimeIds.add(id);}
 text(characters.luoyao?.remark,'wechat/characters.json.luoyao.remark');
 const admissionPath='wechat-article/donglan-admission-2017.json';
 for(const key of ['id','routeId','exactQuery','title','summary','noticePeriod','admittedLabel'])text(admission[key],admissionPath+'.'+key);
 for(const key of ['requirements','admitted']){
  if(!Array.isArray(admission[key])||!admission[key].length)fail(admissionPath+'.'+key,'必须为非空数组');
  for(const value of admission[key])text(value,admissionPath+'.'+key);
 }
 if(!admission.admitted.includes(admission.exactQuery))fail(admissionPath+'.exactQuery','须为录取人员全名');
 unique(index.entries,'search/search-index.json.entries');
 if(!Array.isArray(index.excludedKinds)||new Set(index.excludedKinds).size!==index.excludedKinds.length||index.excludedKinds.some(kind=>!['book','bookstore-product'].includes(kind)))fail('search/search-index.json.excludedKinds','必须为不重复的书目或商品类型数组');
 for(const kind of ['book','bookstore-product'])if(!index.excludedKinds.includes(kind))fail('search/search-index.json.excludedKinds','书目和商品仅限旧书网站内检索');
 for(const e of index.entries){const path='search/search-index.json.'+e.id;
  if(!['book','bookstore-product','website','document','forum-thread','fortune-match','wechat-article','fiction-promotion'].includes(e.kind))fail(path+'.kind','无效类型');if(!['wechat-article','fiction-promotion'].includes(e.kind))text(e.summary,path+'.summary');if(!Array.isArray(e.keywords)||!e.keywords.every(k=>typeof k==='string'&&k.trim()))fail(path+'.keywords','必须为关键词数组');
  if(['book','bookstore-product'].includes(e.kind)&&!books.items.some(b=>b.id===e.bookId))fail(path+'.bookId','无效书目引用');
  if(e.kind==='website'&&e.routeId!=='bookstore-home')fail(path+'.routeId','未注册的站内目标');
  if(e.kind==='forum-thread'&&(e.threadId!==data.forum?.id||e.sourceRef!=='forumName'))fail(path+'.threadId','无效论坛快照目标');
  if(e.sourceRef!==undefined&&!['bookstoreName','forumName','fortuneName','articleAccount','fictionSite'].includes(e.sourceRef))fail(path+'.sourceRef','无效来源引用');if(!e.sourceRef)text(e.source,path+'.source');
  if(e.kind==='fiction-promotion'&&(!data.fiction?.items.some(n=>n.id===e.novelId)||e.sourceRef!=='fictionSite'))fail(path+'.novelId','无效小说引用');
  if(e.kind==='wechat-article'&&(![article,admission].some(item=>item.id===e.articleId&&item.routeId===e.routeId)||e.sourceRef!=='articleAccount'))fail(path+'.articleId','无效公众号文章引用');
  if(e.kind==='fortune-match'&&(e.routeId!=='fortune-match'||e.sourceRef!=='fortuneName'))fail(path+'.routeId','无效测算页目标');
  if(e.badge!==undefined)text(e.badge,path+'.badge');
  if(['website','document','fortune-match'].includes(e.kind)){if(e.titleRef!==undefined&&e.titleRef!=='bookstoreName')fail(path+'.titleRef','无效标题引用');if(!e.titleRef)text(e.title,path+'.title');}
  if(e.kind==='document'){if(!Array.isArray(e.paragraphs)||!e.paragraphs.length)fail(path+'.paragraphs','资料正文不能为空');e.paragraphs.forEach(p=>text(p,path+'.paragraphs'));}
 }
 unique(index.pendingTopics,'search/search-index.json.pendingTopics');unique(index.pendingLinks,'search/search-index.json.pendingLinks');for(const link of index.pendingLinks)if(link.chatId!=='luoyao'||link.routeId!=='bookstore-home')fail('search/search-index.json.pendingLinks','无效接入位置');
}
export function validateInvestigationFiles(){validateInvestigation(readInvestigationFiles());}
