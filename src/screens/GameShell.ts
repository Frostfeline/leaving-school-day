import { common, config } from '../utils/content';
import { el } from '../utils/dom';
import { WeChatScreen } from './WeChatScreen';
export function GameShell() {
  const main = el('main', 'wc-shell');
  const back = el('a', 'back', common.backToIntro); back.href = '#/';
  const screen=WeChatScreen({ conversationId: config.initialConversationId as 'linyuan', playerId: config.playerId as 'linchen' });
  main.addEventListener('screen-dispose',()=>screen.dispatchEvent(new Event('screen-dispose')));
  main.append(back,screen);
  return main;
}
