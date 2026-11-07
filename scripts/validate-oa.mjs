import {readFileSync,existsSync} from 'node:fs';
export function validateOAFiles(){
 const read=name=>{try{return JSON.parse(readFileSync(`src/content/${name}.json`,'utf8'));}catch(e){throw Error(`src/content/${name}.json: ${e}`)}};
 const fail=(path)=>{throw Error(`[content] src/content/${path}: 数据无效`)};
 const auth=read('auth-config');
 if(typeof auth.verificationCode!=='string'||!/^\d{6}$/.test(auth.verificationCode))fail('auth-config.json.verificationCode');
 const u=read('university'),ui=read('oa-login'),n=read('notices'),c=read('characters');
 for(const key of ['name','englishName','serviceName','platformName','systemName','motto','emblemAlt','campusAlt','copyright'])if(typeof u[key]!=='string'||!u[key].trim())fail(`university.json.${key}`);
 for(const key of ['emblem','campusImage'])if(typeof u[key]!=='string'||!/^assets\/[a-zA-Z0-9/_.-]+$/.test(u[key])||u[key].includes('..')||!existsSync('public/'+u[key]))fail(`university.json.${key}`);
 if(!Array.isArray(u.navigation)||u.navigation.some(t=>typeof t!=='string'||!t.trim()))fail('university.json.navigation');
 for(const key of ['accountTab','codeTab','accountUnavailable','studentLabel','studentPlaceholder','codeLabel','codePlaceholder','requestCode','login','description','emptyStudent','wrongStudent','pendingStudent','sent','wrongCode','missingCode','expiredCode','success','successPlaceholder','messageTemplate','storageFailure','noticesHeading'])if(typeof ui[key]!=='string'||!ui[key].trim())fail(`oa-login.json.${key}`);
 if(typeof u.heroCaption!=='string')fail('university.json.heroCaption');
 if(typeof ui.developmentNote!=='string')fail('oa-login.json.developmentNote');
 if(!ui.messageTemplate.includes('{code}'))fail('oa-login.json.messageTemplate');
 if(!c.linchen||(c.linchen.studentId!==null&&(typeof c.linchen.studentId!=='string'||!/^\d+$/.test(c.linchen.studentId))))fail('characters.json.linchen.studentId');
 const publicNotices=read('oa-notices').items;
 if(!Array.isArray(n.items))fail('notices.json.items');const ids=new Set();for(const item of n.items){if(!item.id||ids.has(item.id)||!publicNotices.some(notice=>notice.id===item.noticeId&&notice.public===true))fail('notices.json.items');ids.add(item.id);}
}
