import university from '../content/university.json';
import {el} from '../utils/dom';
export function UniversityHeader() {
 const header=el('header','oa-top');
 const brand=el('div','oa-brand');const logo=el('img','oa-emblem');logo.src=import.meta.env.BASE_URL+university.emblem;logo.alt=university.emblemAlt;
 const names=el('div');names.append(el('div','oa-school',university.name),el('div','oa-english',university.englishName));brand.append(logo,names);
 const platform=el('div','oa-platform');platform.append(el('strong','',university.platformName),el('span','',university.systemName));
 const nav=el('div','oa-nav');nav.append(...university.navigation.map(t=>el('span','',t)));header.append(brand,platform,nav);
 return header;
}
