import {PrivateCommissionScreen} from './PrivateCommissionScreen';
import {BookstoreMember} from '../components/BookstoreMember';
import {BookstoreMailScreen} from './BookstoreMailScreen';
import {el} from '../utils/dom';
import {getBookstoreContent,searchBooks,bookAuthor,publicBookAuthor,publicMessageTime,sortPublicMessages,bookStatus,bookFieldValue,normalizeBookQuery,bookRoute,searchRoute,type Book,type PublicMessage} from '../utils/bookstore-content';
import {markBookstoreEvent,getGameState,privateAccess,subscribeGameState} from '../state/game-state';
import '../styles/bookstore.css';
import '../styles/bookstore-theme.css';
import '../styles/bookstore-hero.css';
export function BookstoreScreen(route:string,navigate?:(route:string)=>void,trackProgress=false){
 const data=getBookstoreContent(),ui=data.site;const main=el('main','bs-page'+(route.startsWith('#/bookstore/mail')?' bs-mail-page':''));
 if(route.startsWith('#/bookstore/shops/'))route='#/bookstore';
 const [path,queryString='']=route.split('?');const params=new URLSearchParams(queryString);const query=params.get('q')??'';const isHome=path==='#/bookstore';
 const go=(to:string)=>{if(navigate)navigate(to);else location.hash=to;};
 const link=(text:string,to:string,className='')=>{const a=el('a',className,text);a.href=to;if(navigate)a.onclick=e=>{e.preventDefault();go(to)};return a;};
 const top=el('header','bs-header');const topInner=el('div','bs-container bs-top-inner');const brand=link(ui.name,'#/bookstore','bs-brand');const nav=el('nav','bs-top-nav');nav.setAttribute('aria-label',ui.name);
 const sell=el('button','',ui.sell);sell.type='button';const status=el('p','bs-site-status');status.setAttribute('role','status');sell.onclick=()=>{status.textContent=ui.sellUnavailable;};nav.append(link(ui.search,'#/bookstore','bs-nav-active'),sell);topInner.append(brand,nav);top.append(topInner);main.append(top);
 const seal=()=>{const image=el('img','bs-brand-seal');image.src=import.meta.env.BASE_URL+ui.hero.seal;image.alt='';image.setAttribute('aria-hidden','true');return image;};brand.append(seal());
 const member=BookstoreMember(main,nav,go);
 const content=el('div','bs-container bs-content');const search=el('form',isHome?'bs-search bs-search-home':'bs-search');const searchInput=el('input');searchInput.type='search';searchInput.setAttribute('aria-label',ui.searchLabel);searchInput.placeholder=ui.searchPlaceholder;searchInput.value=isHome?'':query;const submit=el('button','',ui.search);submit.type='submit';search.append(searchInput,submit);search.onsubmit=e=>{e.preventDefault();if(!searchInput.value.trim()){status.textContent=ui.emptyQuery;return;}if(trackProgress || !navigate)markBookstoreEvent('searched');go(searchRoute(searchInput.value.trim()));};
 const asset=(src:string)=>import.meta.env.BASE_URL+src;
 const price=(book:Book)=>book.priceText??(book.price===null?ui.pending:ui.priceFormat.replace('{price}',book.price.toFixed(2)));
 const img=(src:string,alt:string,className:string)=>{const image=el('img',className);image.src=asset(src);image.alt=alt;return image;};
 const metadata=(book:Book)=>{const list=el('dl','bs-metadata');if(book.metadata){for(const field of book.metadata){const row=el('div');row.append(el('dt','',field.label),el('dd','',bookFieldValue(book,field)));list.append(row);}return list;}for(const [key,label] of Object.entries(ui.fields)){if(key==='listedAt')continue;let value:string;if(key==='price')value=price(book);else if(key==='listPrice')value=book.listPrice===null?ui.pending:ui.priceFormat.replace('{price}',book.listPrice.toFixed(2));else if(key==='status')value=bookStatus(book);else value=String(book[key as keyof Book]??ui.pending);const row=el('div');row.append(el('dt','',label),el('dd',key==='price'?'bs-price':'',value));list.append(row);}return list;};
 const resultList=(results:Book[])=>{
  const list=el('div','bs-results');
  for(const book of results){
   const target=bookRoute(book.id,query);const row=el('article','bs-result');row.dataset.productId=book.id;
   if(book.metadata){row.classList.add('bs-clickable-result');row.onclick=e=>{if(!(e.target as HTMLElement).closest('a,button'))go(target);};}
   const cover=link('',target,'bs-result-cover');if(book.images[0])cover.append(img(book.images[0].src,book.images[0].alt,''));else cover.append(el('span','',ui.imageUnavailable));
   const details=el('div','bs-result-info');details.append(link(book.title??ui.pending,target,'bs-result-title'));
   for(const key of ['author','edition','era'] as const)if(book[key])details.append(el('p','',`${ui.resultFields[key]}：${book[key]}`));
   const seller=data.sellers.shops.find(s=>s.id===book.sellerId)!;details.append(el('p','',`${ui.resultFields.seller}：${seller.name}`));
   const side=el('div','bs-result-side');
   if(book.features?.showPrice!==false){side.append(el('span','bs-side-label',ui.fields.price),el('strong','bs-price',price(book)));if(book.listPrice!==null)side.append(el('span','bs-list-price',`${ui.fields.listPrice}：${ui.priceFormat.replace('{price}',book.listPrice.toFixed(2))}`));}
   side.append(el('span',book.status==='out-of-stock'?'bs-stock-empty':'bs-sold',bookStatus(book)));row.append(cover,details,side);list.append(row);
  }return list;
 };
 let afterMount=()=>{};
 if(isHome){const hero=el('section','bs-home-hero');const artwork=el('div','bs-hero-art');artwork.setAttribute('aria-hidden','true');artwork.style.setProperty('--crop-top',`${ui.hero.cropTop}px`);artwork.style.setProperty('--image-width',`${ui.hero.imageWidth}px`);artwork.style.setProperty('--crop-width',`${ui.hero.cropWidth}px`);const painting=img(ui.hero.image,'','');artwork.append(painting);const title=el('h1','',ui.name);title.append(seal());const rightArtwork=artwork.cloneNode(true) as HTMLElement;rightArtwork.classList.add('bs-hero-art-right');rightArtwork.style.setProperty('--crop-top',ui.hero.rightCropTop+'px');rightArtwork.style.setProperty('--image-width',ui.hero.rightImageWidth+'px');rightArtwork.style.setProperty('--crop-width',ui.hero.rightCropWidth+'px');hero.append(artwork,rightArtwork,title,el('p','',ui.tagline),search);content.append(hero,status);}
 else{
  const breadcrumb=el('div','bs-breadcrumb');breadcrumb.append(link(ui.home,'#/bookstore'));search.classList.add('bs-header-search');topInner.insertBefore(search,nav);content.append(breadcrumb,status);
  if(path==='#/bookstore/private-commission'||path.startsWith('#/bookstore/private/')){
   const abort=new AbortController();
   const permission=()=>{const s=getGameState();return s.bookstoreMember.accountId+':'+privateAccess(s);};
   let access=permission(),screen=PrivateCommissionScreen(path,go,member.open);content.append(screen);
   subscribeGameState(()=>{const next=permission();if(!main.isConnected||next===access)return;access=next;screen.dispatchEvent(new Event('screen-dispose'));const replacement=PrivateCommissionScreen(path,go,member.open);screen.replaceWith(replacement);screen=replacement;},abort.signal);
   main.addEventListener('screen-dispose',()=>{abort.abort();screen.dispatchEvent(new Event('screen-dispose'));});
  }
  else if(path==='#/bookstore/mail'){const mail=BookstoreMailScreen(route,go,member.open);content.append(mail);main.addEventListener('screen-dispose',()=>mail.dispatchEvent(new Event('screen-dispose')));}
  else if(path==='#/bookstore/search'){
   const heading=el('div','bs-results-heading');heading.dataset.query=query;const results=searchBooks(query);const detailed=results.some(b=>!!b.metadata);
   if(detailed)heading.append(el('h1','',ui.detailedResultsTitle.replace('{query}',normalizeBookQuery(query))),el('span','',ui.detailedResultsCount.replace('{count}',String(results.length))));
   else heading.append(el('h1','',ui.resultsTitle),el('span','',ui.queryLabel.replace('{query}',query)),el('span','',ui.resultsCount.replace('{count}',String(results.length))));content.append(heading);
   if(!results.length)content.append(el('p','bs-empty',ui.noResults));
   content.append(resultList(results));
  }else{
   let id='';try{id=decodeURIComponent(path.slice('#/bookstore/books/'.length));}catch{}
   const book=data.books.items.find(b=>b.id===id&&(b.enabled||(import.meta.env.DEV&&!!navigate&&!trackProgress)));
   if(!book){content.append(el('p','bs-empty',ui.unavailable));}
   else{
    const seller=data.sellers.shops.find(s=>s.id===book.sellerId)!;const isMessages=book.features?.comments!==false&&params.get('tab')==='messages';
    content.append(link(ui.backResults,searchRoute(query),'bs-back'));
    const product=el('section','bs-product');const gallery=el('div','bs-gallery');const mainImage=el('button','bs-main-image');mainImage.type='button';const thumbs=el('div','bs-thumbnails');let selected=book.images[0];
    const dialog=el('dialog','bs-image-dialog');dialog.setAttribute('aria-label',ui.imagesHeading);const close=el('button','bs-close',ui.closeImage);close.type='button';close.onclick=()=>dialog.close();const large=el('img');if(selected)large.src=asset(selected.src);large.alt=selected?.alt??ui.imageUnavailable;dialog.append(close,large);dialog.onclick=e=>{if(e.target===dialog)dialog.close();};
    function showImage(index:number){
      selected=book!.images[index];
      if(!selected)return;
      mainImage.replaceChildren(img(selected.src,selected.alt,''));
      if(selected.watermark)mainImage.append(el('span','bs-image-watermark',selected.watermark));
      const label=selected.watermark ? selected.alt+'，'+selected.watermark : ui.enlarge.replace('{alt}',selected.alt);
      mainImage.setAttribute('aria-label',label);
      Array.from(thumbs.children).forEach((b,i)=>b.setAttribute('aria-pressed',String(index===i)));
    }
    for(const [i,image]of book.images.entries()){const button=el('button');button.type='button';button.setAttribute('aria-label',image.alt);button.append(img(image.src,image.alt,''));button.onclick=()=>{showImage(i);if(trackProgress || !navigate)markBookstoreEvent('image',`${book.id}:${image.id}`);};thumbs.append(button);}showImage(0);
    mainImage.onclick=()=>{if(!selected)return;large.src=asset(selected.src);large.alt=selected.alt;dialog.showModal();if(trackProgress || !navigate)markBookstoreEvent('image',`${book.id}:${selected.id}`);};if(!selected){mainImage.textContent=ui.imageUnavailable;mainImage.disabled=true;}
    if(book.features?.imageViewer===false){mainImage.disabled=true;mainImage.classList.add('bs-static-cover');thumbs.hidden=book.images.length<2;}
    gallery.append(mainImage,thumbs);const info=el('div','bs-product-info');info.append(el('h1','',book.title??ui.pending));info.append(metadata(book));if(book.status==='out-of-stock')info.append(el('p','bs-stock-empty bs-stock-detail',bookStatus(book)));info.append(el('p','bs-history-note',book.stockNote??ui.historyNote));
    const shop=el('aside','bs-shop');shop.append(el('h2','',ui.sellerHeading),img(seller.avatar,seller.avatarAlt,'bs-shop-avatar'),el('h3','',seller.name));
    if(seller.levelDiamonds){const rating=el('p','bs-shop-rating',ui.sellerLevelLabel+'：');const diamonds=el('span','bs-diamonds','◆'.repeat(seller.levelDiamonds));diamonds.setAttribute('aria-label',ui.diamondLabel.replace('{count}',String(seller.levelDiamonds)));rating.append(diamonds);shop.append(rating);}
    for(const line of seller.statistics??[])shop.append(el('p','',line));if(seller.statusText)shop.append(el('p','bs-history-note',seller.statusText));
    const contact=seller.accountStatus==='closed'?null:member.contact(seller.id);if(contact)shop.append(contact);product.append(gallery,info,shop);content.append(product);
    const tabs=el('div','bs-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label',ui.details);
    const panel=el('section','bs-detail-panel');panel.id='bs-detail-panel';panel.setAttribute('role','tabpanel');panel.tabIndex=0;
    for(const [tabId,label]of (book.features?.comments===false?[['details',ui.details]]:[['details',ui.details],['messages',ui.messages]])){const tab=el('button','',label);tab.type='button';tab.id=`bs-tab-${tabId}`;tab.setAttribute('role','tab');tab.setAttribute('aria-selected',String(isMessages?tabId==='messages':tabId==='details'));tab.setAttribute('aria-controls',panel.id);tab.onclick=()=>{renderPanel(tabId==='messages');if(!navigate)history.replaceState(null,'',bookRoute(book.id,query,tabId));};tabs.append(tab);}
    function renderPanel(isMessages:boolean){
    panel.replaceChildren();for(const tab of Array.from(tabs.querySelectorAll('button')))tab.setAttribute('aria-selected',String(tab.id===`bs-tab-${isMessages?'messages':'details'}`));
    panel.setAttribute('aria-labelledby',`bs-tab-${isMessages?'messages':'details'}`);if(isMessages&&(trackProgress||!navigate))markBookstoreEvent('messages',book!.id);
    if(isMessages){const rows=sortPublicMessages(data.messages.items.filter(m=>m.productId===book!.id));
     const renderMessage=(message:PublicMessage):HTMLElement=>{const item=el('article','bs-public-message');item.dataset.messageId=message.id;const meta=el('header');const author=data.sellers.authors.find(a=>a.id===message.authorId)!;meta.append(el('strong','',publicBookAuthor(message.authorId)),el('time','',publicMessageTime(message)));if(author.shopId)meta.append(el('span','bs-reply-label',ui.replyLabel));item.append(meta,el('p','',message.text));const children=rows.filter(m=>m.replyTo===message.id);if(children.length){const replies=el('div','bs-replies');replies.append(...children.map(renderMessage));item.append(replies);}return item;};
     if(!rows.length)panel.append(el('p','bs-empty',ui.noMessages));else panel.append(...rows.filter(m=>!m.replyTo).map(renderMessage));
    }else if(book!.metadata){panel.append(el('h2','',book!.detailHeading??ui.details),...book!.description.map(p=>el('p','',p)));}
    else{panel.append(el('h2','',ui.details),el('h3','',ui.versionHeading),...book!.versionParagraphs.map(p=>el('p','',p)),el('h3','',ui.descriptionHeading),...book!.description.map(p=>el('p','',p)),el('h3','',ui.categoryLabel),el('p','',book!.category??''));}
    }renderPanel(isMessages);
    content.append(tabs,panel,dialog);afterMount=()=>{if(trackProgress || !navigate){markBookstoreEvent('product',book.id);if(isMessages)markBookstoreEvent('messages',book.id);}};
   }
  }
 }
 const footer=el('footer','bs-footer');footer.append(el('p','',ui.copyright));const maintenance=el('p','bs-maintenance',ui.maintenanceNotice);
 const maintenanceAbort=new AbortController();
 const updateMaintenance=()=>{maintenance.hidden=!!getGameState().bookstoreMember.accountId;};
 updateMaintenance();
 subscribeGameState(updateMaintenance,maintenanceAbort.signal);
 main.addEventListener('screen-dispose',()=>maintenanceAbort.abort());
 content.prepend(maintenance);main.append(content,footer);
 queueMicrotask(()=>{if(main.isConnected&&(trackProgress || !navigate)){markBookstoreEvent('visited');afterMount();}});
 return main;
}
