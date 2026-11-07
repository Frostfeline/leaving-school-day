import { el } from '../utils/dom';
import { characterData, characterName } from '../utils/wechat-content';
import { wechat } from '../utils/content';
export function Avatar(id: string) {
  const image = el('img', 'wc-avatar');
  image.src = `${import.meta.env.BASE_URL}${characterData[id].avatar}`;
  image.alt = wechat.avatarAlt.replace('{name}', characterName(id));
  image.width = 40; image.height = 40;
  return image;
}

export function ChatAvatar(chat: { avatarId: string; label: string; groupAvatarIds?: string[] }) {
  if (!chat.groupAvatarIds?.length) return Avatar(chat.avatarId);
  const mosaic = el('span', 'wc-group-avatar');
  mosaic.setAttribute('role', 'img');
  mosaic.setAttribute('aria-label', wechat.avatarAlt.replace('{name}', chat.label));
  for (const id of chat.groupAvatarIds) {
    const tile = Avatar(id);
    tile.alt = '';
    mosaic.append(tile);
  }
  return mosaic;
}
