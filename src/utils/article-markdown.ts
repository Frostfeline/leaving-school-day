import {el} from './dom';

// Render the author's small Markdown subset as text nodes. No raw HTML or remote resources.
export function appendArticleInline(parent:HTMLElement,text:string){
 const parts=text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
 for(const part of parts)parent.append(part.startsWith('**')&&part.endsWith('**')?el('strong','',part.slice(2,-2)):part.startsWith('*')&&part.endsWith('*')?el('em','',part.slice(1,-1)):document.createTextNode(part));
}
export function articleMarkdown(markdown:string){
 const body=el('div','wa-article-body');
 for(const block of markdown.replaceAll('\r\n','\n').trim().split(/\n\s*\n/)){
  const heading=block.match(/^(#{1,3}) (.+)$/);
  if(heading){const h=el(('h'+heading[1].length) as 'h1'|'h2'|'h3');appendArticleInline(h,heading[2]);body.append(h);}
  else if(/^---+$/.test(block))body.append(el('hr'));
  else if(block.startsWith('> ')){const quote=el('blockquote');appendArticleInline(quote,block.replace(/^> ?/gm,''));body.append(quote);}
  else{const p=el('p');appendArticleInline(p,block);body.append(p);}
 }
 return body;
}
