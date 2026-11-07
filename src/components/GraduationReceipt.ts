import ending from '../content/ending-ne.json';
import university from '../content/university.json';
import student from '../content/characters.json';
import {config,intro} from '../utils/content';
import {el} from '../utils/dom';
export function GraduationReceipt(libraryStatus?:string){
 const receipt=el('section','ne-receipt');receipt.setAttribute('aria-label',ending.receipt.title.replace('{university}',university.name));
 const emblem=el('img','ne-emblem');emblem.src=import.meta.env.BASE_URL+university.emblem;emblem.alt=university.emblemAlt;
 receipt.append(emblem,el('h1','',ending.receipt.title.replace('{university}',university.name)));
 const identity=el('dl','ne-identity');for(const [label,value]of [[ending.receipt.nameLabel,config.characters.linchen.name],[ending.receipt.studentIdLabel,student.linchen.studentId],[ending.receipt.dateLabel,intro.date]]){const row=el('div');row.append(el('dt','',label),el('dd','',value));identity.append(row);}
 const table=el('table','ne-settlement'),head=el('thead'),header=el('tr'),body=el('tbody');header.append(el('th','',ending.receipt.itemLabel),el('th','',ending.receipt.statusLabel));head.append(header);
 for(const item of ending.receipt.items){const row=el('tr');row.append(el('td','',item.label),el('td','',item.id==='library'&&libraryStatus?libraryStatus:item.status));body.append(row);}table.append(head,body);receipt.append(identity,table,el('p','ne-completion',ending.receipt.completion));return receipt;
}
