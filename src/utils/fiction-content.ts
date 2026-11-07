import site from '../content/fiction/site.json';
import data from '../content/fiction/novels.json';
import {routes} from './routes';
export interface Novel {coverIncludesTitle?:boolean;promotionHeading?:string;promotionDescription?:string;author?:string;fanGroupNote?:string;id:string;routeId:'fiction-changdu';promotionLabel:string;title:string;genre:string;detailGenre:string;description:string;coverImage:string;coverAlt:string;searchKeywords:string[];isSponsored:boolean;hasReadableContent:boolean}
export const fictionSite=site;
export const fictionNovels=data.items as Novel[];
export const fictionRoute=(novel:Novel)=>routes[novel.routeId];
export const fictionForRoute=(route:string)=>fictionNovels.find(n=>fictionRoute(n)===route);
export const fictionSearchTitle=(novel:Novel)=>site.searchTitleFormat.replace('{title}',novel.title);
export const fictionPageTitle=(novel:Novel)=>site.pageTitleFormat.replace('{title}',novel.title).replace('{site}',site.name);
