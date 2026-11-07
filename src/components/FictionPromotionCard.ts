import {el} from '../utils/dom';
import {fictionSite as site,fictionSearchTitle,fictionRoute,type Novel} from '../utils/fiction-content';
import '../styles/fiction.css';

export function FictionCover(novel:Novel){
 const cover=el('div','fiction-cover');const image=el('img');image.src=import.meta.env.BASE_URL+novel.coverImage;image.alt=novel.coverAlt;image.width=400;image.height=560;
 if(novel.coverIncludesTitle){image.style.objectFit='contain';cover.append(image);return cover;}const title=el('span','fiction-cover-title',novel.title);title.setAttribute('aria-hidden','true');cover.append(image,title);return cover;
}
export function FictionPromotionCard(novel:Novel,resultId:string){
 const card=el('article','wc-web-result fiction-promotion');card.dataset.resultId=resultId;
 const link=(label?:string,className='')=>{const a=el('a',className,label);a.href=new URL(fictionRoute(novel),location.href).href;a.target='_blank';a.rel='noopener noreferrer';return a;};
 const cover=link(undefined,'fiction-promotion-cover');cover.append(FictionCover(novel));const details=el('div','fiction-promotion-details');
 const top=el('div','fiction-promotion-top');if(novel.isSponsored)top.append(el('span','fiction-promotion-badge',site.promotionBadge));top.append(el('span','fiction-promotion-column',novel.promotionHeading??site.promotionFormat.replace('{site}',site.name).replace('{column}',novel.promotionLabel)));
 const title=el('h2','fiction-promotion-title');title.append(link(fictionSearchTitle(novel),'fiction-promotion-title-link'));
 details.append(top,title,el('p','fiction-promotion-genre',novel.genre),el('p','fiction-promotion-description',novel.promotionDescription??novel.description));const bottom=el('div','fiction-promotion-bottom');bottom.append(el('span','fiction-promotion-source',site.name),link(site.viewWork,'fiction-promotion-view'));details.append(bottom);card.append(cover,details);return card;
}
