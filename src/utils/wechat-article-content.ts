import account from '../content/wechat-article/account.json';
import meta from '../content/wechat-article/article-meta.json';
import comments from '../content/wechat-article/comments.json';
import ui from '../content/wechat-article/ui.json';
import markdown from '../content/wechat-article/article.md?raw';
import admissionNotice from '../content/wechat-article/donglan-admission-2017.json';
import university from '../content/university.json';
export {admissionNotice};
export {account as articleAccount,meta as articleMeta,comments as articleComments,ui as articleUI,markdown as articleMarkdown};
export const ARTICLE_ROUTE='#/wechat/article/borrow-life';
export const ADMISSION_ARTICLE_ROUTE='#/wechat/article/donglan-admission-2017';
export type SearchableArticle={id:string;route:string;title:string;source:string;summary:string;keywords?:string[];excludedExactQueries?:string[];exactQuery?:string};
export const searchableArticles:SearchableArticle[]=[
 {id:meta.id,route:ARTICLE_ROUTE,title:meta.title,source:account.name,summary:meta.summary,keywords:meta.keywords,excludedExactQueries:meta.excludedExactQueries},
 {id:admissionNotice.id,route:ADMISSION_ARTICLE_ROUTE,title:admissionNotice.title,source:university.name,summary:admissionNotice.summary,exactQuery:admissionNotice.exactQuery}
];
