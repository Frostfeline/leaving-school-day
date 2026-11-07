export function validateContent(intro, config, common, wechat) {
  const fail = (path, reason) => { throw new Error(`[content] src/content/${path}: ${reason}`); };
  const text = (value, path) => { if (typeof value !== 'string' || !value.trim()) fail(path, '必须填写非空文字'); };
  for (const key of ['eyebrow','title','date','tagline']) text(intro?.[key], `intro.json.${key}`);
  for(const key of ['start','restart','rewind','viewEnding'])text(intro?.actions?.[key],`intro.json.actions.${key}`);
  text(intro?.rewindDescription,'intro.json.rewindDescription');
  text(intro?.preface?.id, 'intro.json.preface.id');
  if (!Array.isArray(intro.preface.paragraphs) || !intro.preface.paragraphs.length) fail('intro.json.preface.paragraphs','至少填写一个自然段');
  intro.preface.paragraphs.forEach((p,n)=>text(p,`intro.json.preface.paragraphs[${n}]`));
  text(config?.gameId, 'game-config.json.gameId');
  if (config?.startActionId !== 'start-game') fail('game-config.json.startActionId', '必须为 start-game');
  if (config.initialModule !== 'wechat') fail('game-config.json.initialModule', '当前仅支持 wechat');
  if (config.initialConversationId !== 'linyuan') fail('game-config.json.initialConversationId', '必须为 linyuan');
  if (config.playerId !== 'linchen') fail('game-config.json.playerId', '必须为 linchen');
  for (const id of [config.initialConversationId, config.playerId]) text(config.characters?.[id]?.name, `game-config.json.characters.${id}.name`);
  if (typeof config.enableDevelopmentPlaceholder !== 'boolean') fail('game-config.json.enableDevelopmentPlaceholder', '必须为布尔值');
  if (!config.enableDevelopmentPlaceholder) fail('game-config.json.enableDevelopmentPlaceholder', '正式微信模块尚未安装，请保留 true');
  for (const key of ['backToIntro','loadFailure','noscript']) text(common?.[key], `common.json.${key}`);
  for (const key of ['moduleName','developmentLabel','identityLabel','placeholderMessage']) text(wechat?.[key], `wechat-entry.json.${key}`);
}
