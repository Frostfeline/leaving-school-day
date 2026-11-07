import {readFileSync} from 'node:fs';
export function validateOAPortalFiles(read=name=>{try{return JSON.parse(readFileSync(`src/content/${name}.json`,'utf8'))}catch(e){throw Error(`src/content/${name}.json: ${e}`)}}){
 const fail=path=>{throw Error(`[content] src/content/${path}: 字段、ID或引用无效`)};
 const text=(v,path)=>{if(typeof v!=='string'||!v.trim())fail(path)};
 const ui=read('oa-home');for(const key of ['homeLabel','userLabel','welcome','noticesHeading','publisher','dateLabel','pendingLabel','backHome'])text(ui[key],`oa-home.json.${key}`);
 if(!ui.welcome.includes('{name}')||!ui.welcome.includes('{university}')||!ui.userLabel.includes('{name}'))fail('oa-home.json');
 if(!Array.isArray(ui.tabs)||ui.tabs.length!==2||!['notices','graduation'].every(id=>ui.tabs.some(t=>t.id===id&&t.label)))fail('oa-home.json.tabs');
 const notices=read('oa-notices');if(!Array.isArray(notices.items)||notices.items.length<3)fail('oa-notices.json.items');const ids=new Set();
 for(const notice of notices.items){
  if(!/^[a-z][a-z-]*$/.test(notice.id)||ids.has(notice.id))fail('oa-notices.json.id');ids.add(notice.id);
  for(const key of ['title','date'])text(notice[key],`oa-notices.json.${notice.id}.${key}`);
  if(!['notices','graduation'].includes(notice.category)||!['normal','important'].includes(notice.priority)||!['pending','normal'].includes(notice.status)||!['ordinary','library'].includes(notice.detailType))fail(`oa-notices.json.${notice.id}`);
  if(!Array.isArray(notice.paragraphs)||(notice.detailType==='ordinary'&&!notice.paragraphs.length))fail(`oa-notices.json.${notice.id}.paragraphs`);
  notice.paragraphs.forEach((p,i)=>text(p,`oa-notices.json.${notice.id}.paragraphs[${i}]`));
 }
 if(notices.items.filter(n=>n.detailType==='library').length!==1)fail('oa-notices.json.items');
 const record=read('oa-library-record');const characters=read('wechat/characters');text(record.title,'oa-library-record.json.title');
 const refs=['matterType','collectionCode','responsiblePerson','originalBorrower','amount','status','bookTitle','isbn','borrowedAt','author','publisher','publishDate','classification','listPrice'];
 const fields=(rows,path)=>{if(!Array.isArray(rows)||!rows.length)fail(path);const seen=new Set();for(const field of rows){text(field.id,path+'.id');if(seen.has(field.id))fail(path+'.id');seen.add(field.id);text(field.label,path+'.label');if(field.valueRef){if(!refs.includes(field.valueRef))fail(path+'.valueRef')}else text(field.value,path+'.value');if(field.emphasis!==undefined&&typeof field.emphasis!=='boolean')fail(path+'.emphasis');}};
 const paragraphs=(rows,path)=>{if(!Array.isArray(rows)||!rows.length)fail(path);rows.forEach(p=>text(p,path));};
 paragraphs(record.paragraphs,'oa-library-record.json.paragraphs');fields(record.fields,'oa-library-record.json.fields');
 text(record.pendingValue,'oa-library-record.json.pendingValue');text(record.pendingConfirmation,'oa-library-record.json.pendingConfirmation');
 for(const key of ['matterType','amount','status'])text(record.data?.[key],'oa-library-record.json.data.'+key);
 if(!/^¥(?:\d+|\d{1,3}(?:,\d{3})+)\.\d{2}$/.test(record.data.amount))fail('oa-library-record.json.data.amount');
 for(const key of ['originalBorrowerId','responsiblePersonId'])if(!characters[record.data?.[key]])fail('oa-library-record.json.data.'+key);
 if(record.data.borrowedAt!==null&&(!/^\d{4}-\d{2}-\d{2}$/.test(record.data.borrowedAt)||!Number.isFinite(Date.parse(record.data.borrowedAt))))fail('oa-library-record.json.data.borrowedAt');
 if(!read('bookstore/books').items.some(b=>b.id===record.data.bookId))fail('oa-library-record.json.data.bookId');
 if(!['pending','confirmed'].includes(record.data.collectionCode?.status))fail('oa-library-record.json.data.collectionCode');
 if(record.data.collectionCode.status==='confirmed')text(record.data.collectionCode.value,'oa-library-record.json.data.collectionCode.value');
 if(record.data.collectionCode.candidate!==null)text(record.data.collectionCode.candidate,'oa-library-record.json.data.collectionCode.candidate');
 for(const key of ['investigate','pay','backSummary'])text(record.actions[key],'oa-library-record.json.actions.'+key);
 text(record.investigation.title,'oa-library-record.json.investigation.title');paragraphs(record.investigation.paragraphs,'oa-library-record.json.investigation.paragraphs');fields(record.investigation.fields,'oa-library-record.json.investigation.fields');
 const payment=read('oa-payment');for(const key of ['title','confirmation','pay','processing','success','unassignedOutcome','backSummary','storageFailure'])text(payment[key],'oa-payment.json.'+key);
 paragraphs(payment.paragraphs,'oa-payment.json.paragraphs');fields(payment.fields,'oa-payment.json.fields');if(!payment.pay.includes('{amount}'))fail('oa-payment.json.pay');
 const policy=read('oa-library-policy');for(const k of ['id','title','openLabel','closeLabel'])text(policy[k],'oa-library-policy.json.'+k);if(!Array.isArray(policy.sections)||!policy.sections.length)fail('oa-library-policy.json.sections');for(const section of policy.sections){text(section.id,'oa-library-policy.json.section.id');text(section.heading,'oa-library-policy.json.section.heading');paragraphs(section.paragraphs,'oa-library-policy.json.paragraphs');}if(!Number.isFinite(policy.presentation?.maxWidthPx)||!Number.isFinite(policy.presentation?.maxHeightVh))fail('oa-library-policy.json.presentation');
 const ending=read('ending-ne');text(ending.actions?.continue,'ending-ne.json.actions.continue');if(!Number.isFinite(ending.presentation?.paragraphIntervalMs)||!Number.isFinite(ending.presentation?.fadeMs))fail('ending-ne.json.presentation');text(ending.actions?.returnHome,'ending-ne.json.actions.returnHome');for(const key of ['title','closing','finalLabel'])text(ending[key],'ending-ne.json.'+key);
 paragraphs(ending.statusLines,'ending-ne.json.statusLines');paragraphs(ending.paragraphs,'ending-ne.json.paragraphs');
 for(const key of ['title','nameLabel','studentIdLabel','dateLabel','itemLabel','statusLabel','completion'])text(ending.receipt?.[key],'ending-ne.json.receipt.'+key);
 if(!Array.isArray(ending.receipt.items)||!ending.receipt.items.length)fail('ending-ne.json.receipt.items');const receiptIds=new Set();for(const item of ending.receipt.items){for(const key of ['id','label','status'])text(item[key],'ending-ne.json.receipt.items.'+key);if(receiptIds.has(item.id))fail('ending-ne.json.receipt.items.id');receiptIds.add(item.id);}
 const hidden=read('wechat/hidden-contact');for(const key of ['id','avatarId','kind','contentId','emptyText'])text(hidden[key],`wechat/hidden-contact.json.${key}`);
 if(hidden.id!=='luoyao'||hidden.contentId!=='luo-yao'||!characters[hidden.avatarId])fail('wechat/hidden-contact.json');
 const messages=read('wechat/chats/luo-yao').messages;if(!Array.isArray(messages))fail('wechat/chats/luo-yao.json.messages');const messageIds=new Set();

 for(const message of messages){for(const key of ['id','senderId','timestamp','type','text'])text(message[key],`wechat/chats/luo-yao.json.${key}`);if(messageIds.has(message.id)||!characters[message.senderId]||!Number.isFinite(Date.parse(message.timestamp))||!['text','system','link'].includes(message.type))fail('wechat/chats/luo-yao.json.messages');if(message.type==='link'&&(!['oa-login','bookstore-home','memory-archive'].includes(message.routeId)||!message.linkLabel?.trim()))fail('wechat/chats/luo-yao.json.messages.link');messageIds.add(message.id);}
}
