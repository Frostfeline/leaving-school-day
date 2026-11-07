import {el} from '../utils/dom';
import {fictionSite as site,type Novel} from '../utils/fiction-content';
import {FictionCover} from '../components/FictionPromotionCard';
import '../styles/fiction.css';

export function FictionDetailScreen(novel:Novel){
 const page=el('main','fiction-page');const header=el('header','fiction-site-header');const brand=el('div','fiction-site-brand');brand.append(el('span','fiction-site-name',site.name),el('span','fiction-site-subtitle',site.subtitle));header.append(brand);
 const work=el('article','fiction-work');const visual=el('div','fiction-work-visual');visual.append(FictionCover(novel));const details=el('section','fiction-work-details');details.append(el('h1','fiction-work-title',novel.title),...(novel.author?[el('p','fiction-work-author',novel.author)]:[]),el('p','fiction-work-genre',novel.detailGenre));
 const description=el('section','fiction-work-description');description.append(el('h2','',site.descriptionHeading),...novel.description.split(/\n\s*\n/).map(text=>el('p','',text)),...(novel.fanGroupNote?[el('p','fiction-fan-note',novel.fanGroupNote)]:[]));details.append(description);work.append(visual,details);page.append(header,work);return page;
}
