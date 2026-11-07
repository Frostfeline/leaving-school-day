import {getGameState} from '../state/game-state';
import {UniversityHeader} from './UniversityHeader';
import ui from '../content/oa-home.json';
import university from '../content/university.json';
import {config} from '../utils/content';
import {el} from '../utils/dom';
import {libraryValue,type RecordField} from '../utils/library-content';
import '../styles/oa.css';
import '../styles/oa-home.css';
import {LibraryPolicyHelp} from './LibraryPolicyHelp';
export function OAFrame(){
 const main=el('main','oa-page oa-workspace');main.append(UniversityHeader());
 const bar=el('nav','oa-work-nav');bar.setAttribute('aria-label',university.systemName);
 const home=el('a','',ui.homeLabel);home.href=getGameState().authenticated?'#/oa/home':'#/oa/login';
 bar.append(home);if(getGameState().authenticated)bar.append(el('span','',ui.userLabel.replace('{name}',config.characters.linchen.name)));main.append(bar);
 const content=el('div','oa-work-content');main.append(content,el('footer','oa-footer',university.copyright));
 return {main,content};
}
export function LibraryFields(fields:RecordField[]){
 const list=el('dl','oa-record');
 for(const field of fields){const row=el('div'),term=el('dt','',field.label);if(field.helpId)term.append(LibraryPolicyHelp());row.append(term,el('dd',field.emphasis?'oa-record-emphasis':'',field.valueRef?libraryValue(field.valueRef):field.value));list.append(row);}
 return list;
}
