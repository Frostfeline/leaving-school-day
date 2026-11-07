import ui from '../content/oa-payment.json';
import university from '../content/university.json';
import {LibraryFields} from './OAFrame';
import {el} from '../utils/dom';
export function OAPaymentDetails(){const article=el('article','oa-detail');article.append(el('h1','',ui.title.replace('{university}',university.name)),LibraryFields(ui.fields));return article;}
