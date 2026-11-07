import {validatePrivateFiles} from './scripts/validate-private-commission.mjs';
import {validateHermitageFiles} from './scripts/validate-hermitage-2025.mjs';
import {validateConfrontationFiles} from './scripts/validate-sister-confrontation.mjs';
import {archiveDevPlugin} from './scripts/archive-dev-plugin.mjs';
import {validateArchiveFiles} from './scripts/validate-memory-archive.mjs';
import {validateArticleFiles} from './scripts/validate-wechat-article.mjs';
import {validateFictionFiles} from './scripts/validate-fiction.mjs';
import {validateBookstoreMailFiles} from './scripts/validate-bookstore-mail.mjs';
import {validateFortuneFiles} from './scripts/validate-fortune.mjs';
import {validateForumFiles} from './scripts/validate-forum.mjs';
import {validateInvestigationFiles} from './scripts/validate-investigation.mjs';
import {validateBookstoreFiles} from './scripts/check-bookstore.mjs';
import { validateOAPortalFiles } from './scripts/validate-oa-portal.mjs';
import { validateOAFiles } from './scripts/validate-oa.mjs';
import { validateWeChatFiles } from './scripts/validate-wechat.mjs';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { validateContent } from './scripts/validate-content.mjs';
const read = (name: string) => {
  try { return JSON.parse(readFileSync(`src/content/${name}.json`, 'utf8')); }
  catch (error) { throw new Error(`src/content/${name}.json: JSON格式无效: ${error}`); }
};
const escape = (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export default defineConfig({
  base: './',
  plugins: [archiveDevPlugin(),{ name: 'game-content',
    buildStart() { validatePrivateFiles(); validateHermitageFiles(); validateConfrontationFiles(); validateArchiveFiles(); validateBookstoreMailFiles(); validateFictionFiles(); validateArticleFiles(); validateFortuneFiles(); validateForumFiles(); validateInvestigationFiles(); validateBookstoreFiles(); validateOAPortalFiles(); validateOAFiles(); validateWeChatFiles(); validateContent(read('intro'), read('game-config'), read('common'), read('wechat-entry')); },
    transformIndexHtml(html) {
      const intro = read('intro');
      return html.replace('<!--title-->', escape(intro.title)).replace('__DESCRIPTION__', escape(intro.tagline)).replace('__NOSCRIPT__', escape(read('common').noscript));
    }
  }]
});
