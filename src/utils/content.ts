import intro from '../content/intro.json';
import config from '../content/game-config.json';
import common from '../content/common.json';
import wechat from '../content/wechat-entry.json';
import { validateContent } from '../../scripts/validate-content.mjs';
export { intro, config, common, wechat };
export function validate() { validateContent(intro, config, common, wechat); }
