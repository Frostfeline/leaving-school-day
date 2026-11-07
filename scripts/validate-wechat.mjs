import { readFileSync, existsSync } from 'node:fs';
export function validateWeChatFiles(read = name => { try { return JSON.parse(readFileSync(`src/content/${name}.json`, 'utf8')); } catch (error) { throw Error(`src/content/${name}.json: ${error}`); } }) {
  const fail = (path, reason) => { throw Error(`[content] src/content/${path}: ${reason}`); };
  const text = (value, path) => { if (typeof value !== 'string' || !value.trim()) fail(path, '必须填写文字'); };
  const list = read('wechat/chat-list'); const characters = read('wechat/characters'); const config = read('game-config'); const ui = read('wechat-entry');
  for (const key of ['searchPlaceholder','searchLabel','chatsLabel','messagesLabel','historyLabel','noResults','inputLabel','inputPlaceholder','send','phaseNote','avatarAlt','timeNote','mobileBack']) text(ui[key], `wechat-entry.json.${key}`);
  for (const [id, character] of Object.entries(characters)) {
    text(character.chatNameRef?list.find(chat=>chat.id===character.chatNameRef)?.label:character.nameRef ? config.characters[character.nameRef]?.name : character.name, `wechat/characters.json.${id}.name`);
    text(character.avatar, `wechat/characters.json.${id}.avatar`);
    if (!/^assets\/[a-zA-Z0-9/_-]+\.(?:svg|jpe?g|png|webp)$/.test(character.avatar) || !existsSync(`public/${character.avatar}`)) fail(`wechat/characters.json.${id}.avatar`, '站内头像路径无效或文件不存在');
  }
  const presentation=read('wechat/presentation');
  if(!presentation.opening || !/^2025-\d{2}-\d{2}$/.test(presentation.storyDate))fail('wechat/presentation.json.storyDate','游戏时间必须是2025年');
  for(const n of [presentation.opening.initialDelayMs,presentation.timeSeparatorMs,presentation.newMessageIntervalMs,presentation.animation?.durationMs,presentation.animation?.offsetPx])if(!Number.isFinite(n)||n<0||n>3600000)fail('wechat/presentation.json','动画或时间间隔无效');
  const chatIds = new Set(); const messageIds = new Set();
  if (!Array.isArray(list) || list.length === 0) fail('wechat/chat-list.json', '缺少聊天会话');
  for (const chat of list) {
    for (const key of ['id','label','avatarId','kind','contentId']) text(chat[key], `wechat/chat-list.json.${key}`);
    if (chatIds.has(chat.id)) fail('wechat/chat-list.json', `重复ID ${chat.id}`); chatIds.add(chat.id);
    if (!characters[chat.avatarId]) fail('wechat/chat-list.json', `头像ID无效 ${chat.avatarId}`);
    if (!['direct','group','service'].includes(chat.kind) || !/^[a-z-]+$/.test(chat.contentId)) fail('wechat/chat-list.json', '类型或内容ID无效');
    if (chat.groupAvatarIds !== undefined) {
      const ids = chat.groupAvatarIds;
      if (chat.kind !== 'group' || !Array.isArray(ids) || ids.length !== 4 || new Set(ids).size !== 4 ||
          ids.some(id => typeof id !== 'string' || !Object.hasOwn(characters, id))) {
        fail('wechat/chat-list.json', `群聊 ${chat.id} 必须配置四个不同的有效头像ID`);
      }
    }
    const path = `wechat/chats/${chat.contentId}`; const data = read(path);
    if (!Array.isArray(data.messages)) fail(`${path}.json.messages`, '必须为数组');
    for (const message of data.messages) {
      for (const key of ['id','senderId','timestamp','type','text']) text(message[key], `${path}.json.${key}`);
      if(message.type==='link' && (!['oa-login','bookstore-home','memory-archive'].includes(message.routeId) || typeof message.linkLabel!=='string' || !message.linkLabel.trim())) fail(`${path}.json.${message.id}`,'链接路由或文字无效');
      if (messageIds.has(message.id)) fail(`${path}.json`, `重复消息ID ${message.id}`); messageIds.add(message.id);
      if(message.inlineLinks!==undefined&&(!Array.isArray(message.inlineLinks)||message.inlineLinks.some(link=>!link.id||!link.text||link.routeId!=='oa-login'||!message.text.includes('*'+link.text+'*'))))fail(`${path}.json.${message.id}`,'行内链接引用无效');
      if(message.type==='file'&&!data.attachments?.some(a=>a.id===message.attachmentId&&a.fileName&&((a.placeholder&&a.src===null)||(typeof a.src==='string'&&a.src.startsWith('assets/')&&!a.src.includes('..')&&existsSync('public/'+a.src)))))fail(`${path}.json.${message.id}`,'附件引用、占位或站内资源无效');
      if(message.type==='image'&&!data.attachments?.some(a=>a.id===message.attachmentId&&typeof a.src==='string'&&a.src.startsWith('assets/')&&!a.src.includes('..')&&existsSync('public/'+a.src)))fail(path,'图片附件引用无效');
      if (!characters[message.senderId] || !Number.isFinite(Date.parse(message.timestamp)) || !['text','system','link','file','image','call'].includes(message.type)) fail(`${path}.json.${message.id}`, '发送者、时间或当前支持的消息类型无效');
    }
  }
  if (!chatIds.has(config.initialConversationId)) fail('game-config.json.initialConversationId', '初始会话不存在');
  const opening=read('wechat/chats/sister').messages;
  if(opening.length!==3||opening.slice(0,2).some(m=>m.senderId!=='linyuan')||opening[2].senderId!=='linchen'||opening[2].id!==presentation.opening.replyMessageId||!presentation.opening.replyId)fail('wechat/presentation.json.opening','必须关联两条林鸢开场消息和一条玩家回复');
  for(const field of ['typingText','historyEndText','pdfPlaceholderText','pdfPlaceholderClose','unreadCountLabel'])text(presentation[field],`wechat/presentation.json.${field}`);
  if(!presentation.unreadCountLabel.includes('{count}'))fail('wechat/presentation.json.unreadCountLabel','缺少数量变量');
}
