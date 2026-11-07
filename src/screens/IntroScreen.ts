import { intro, config, common } from '../utils/content';
import { el } from '../utils/dom';
export function IntroScreen(startGame: () => void, endingActions?:{restart:()=>void;rewind?:()=>void;rewindDescription?:string;rewindActionId?:string;viewEnding:()=>void;showAfterword?:boolean;endingLinks?:{label:string;route:string}[]}) {
  const main = el('main', 'intro');
  const header = el('header', 'cover');
  header.append(el('p', 'eyebrow', intro.eyebrow), el('h1', 'title', intro.title), el('p', 'date', intro.date), el('p', 'tagline', intro.tagline));
  const section = el('section', 'reading');
  const panel = el('div', 'panel');
  panel.id = 'intro-panel';
  panel.tabIndex = 0;
  panel.dataset.section = intro.preface.id;
  panel.append(...intro.preface.paragraphs.map(p => el('p', '', p)));
  section.append(panel);
  const footer = el('footer', 'actions');
  const start = el('button', 'start', endingActions?intro.actions.restart:intro.actions.start);
  start.type = 'button'; start.dataset.action = endingActions?'restart-game':config.startActionId;
  const arrow = el('span', 'arrow', ''); arrow.setAttribute('aria-hidden', 'true');
  start.append(arrow); start.onclick = endingActions?()=>run(endingActions.restart):startGame;
  footer.append(start);
  const status=el('p','intro-menu-status');status.setAttribute('role','status');status.hidden=true;
  function run(action:()=>void){try{action();}catch(error){console.error(error);status.hidden=false;status.textContent=common.loadFailure;}}
  if(endingActions){
    footer.classList.add('actions-ended');
    const rewindAction=endingActions.rewind;const rewind=el('button','intro-menu-secondary',intro.actions.rewind);rewind.type='button';rewind.dataset.action=endingActions.rewindActionId??'rewind-payment';rewind.onclick=()=>run(rewindAction!);rewind.setAttribute('aria-describedby','rewind-description');
    const review=el('button','intro-menu-secondary',intro.actions.viewEnding);review.type='button';review.dataset.action='review-ending';review.onclick=()=>run(endingActions.viewEnding);
    const description=el('p','intro-menu-description',endingActions.rewindDescription??intro.rewindDescription);description.id='rewind-description';if(rewindAction)footer.append(rewind);footer.append(review);if(rewindAction)footer.append(description);
    if((endingActions.endingLinks?.length??0)>0){
      const collection=el('div','intro-ending-list');collection.hidden=true;
      for(const ending of endingActions.endingLinks!){const link=el('a','intro-menu-secondary',ending.label);link.href=ending.route;collection.append(link);}
      if(endingActions.showAfterword){
        const afterword=el('button','intro-menu-secondary',intro.afterword.title);
        afterword.type='button';
        afterword.setAttribute('aria-expanded','false');
        afterword.setAttribute('aria-controls','intro-afterword');
        const note=el('section','intro-afterword');
        note.id='intro-afterword';
        note.hidden=true;
        note.append(el('h2','',intro.afterword.title),...intro.afterword.paragraphs.map(text=>el('p','',text)));
        afterword.onclick=()=>{
          note.hidden=!note.hidden;
          afterword.setAttribute('aria-expanded',String(!note.hidden));
          if(!note.hidden)note.scrollIntoView({block:'start'});
        };
        collection.append(afterword,note);
      }
      review.setAttribute('aria-expanded','false');review.onclick=()=>{collection.hidden=!collection.hidden;review.setAttribute('aria-expanded',String(!collection.hidden));};footer.append(collection);
    }
  }
  footer.append(status);main.append(header, section, footer);
  return main;
}
