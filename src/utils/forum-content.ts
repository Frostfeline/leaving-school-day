import site from '../content/forum/forum-site.json';
import users from '../content/forum/forum-users.json';
import thread from '../content/forum/forum-thread.json';
export {site as forumSite,users as forumUsers,thread as forumThread};
export type ForumBlock=string|{type:'quote';text?:string;postId?:string}|{type:'link';label:string;targetId:'bookstore-home'|'oa-login'};
export function forumQuote(block:{text?:string;postId?:string}){return block.postId?thread.posts.find(p=>p.id===block.postId)?.content.filter(p=>typeof p==='string').join('\n\n')??'':block.text??'';}
export function forumRoute(id:string){return `#/forum/threads/${encodeURIComponent(id)}`;}
export function forumRouteId(route:string){try{return decodeURIComponent(route.split('?')[0].slice('#/forum/threads/'.length));}catch{return '';}}
export function forumTime(timestamp:string){return timestamp.replace('T',' ').slice(0,16);}
