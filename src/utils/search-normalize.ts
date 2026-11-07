export const normalizeSearch=(value:string)=>value.normalize('NFKC').trim().toLocaleLowerCase();
export const normalizeIsbn=(value:string)=>normalizeSearch(value).replace(/[\s\-‐‑–—]/g,'');
export function matchesSearch(query:string,values:string[]){
 const q=normalizeSearch(query);return !!q && q.split(/\s+/).every(word=>values.some(value=>normalizeSearch(value).includes(word)));
}
