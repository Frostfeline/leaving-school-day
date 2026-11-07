import {validatePrivateFiles} from './validate-private-commission.mjs';
import {validateHermitageFiles} from './validate-hermitage-2025.mjs';
import {validateConfrontationFiles} from './validate-sister-confrontation.mjs';
validateConfrontationFiles();
import {validateArchiveFiles} from './validate-memory-archive.mjs';
validateArchiveFiles();
import {validateArticleFiles} from './validate-wechat-article.mjs';
import {validateFictionFiles} from './validate-fiction.mjs';
import {validateBookstoreMailFiles} from './validate-bookstore-mail.mjs';
import {validateFortuneFiles} from './validate-fortune.mjs';
import {validateForumFiles} from './validate-forum.mjs';
import './inquiry-data-check.mjs';
import {validateInvestigationFiles} from './validate-investigation.mjs';
import {validateBookstoreFiles} from './check-bookstore.mjs';
import { validateOAPortalFiles } from './validate-oa-portal.mjs';
import { validateOAFiles } from './validate-oa.mjs';
import { validateWeChatFiles } from './validate-wechat.mjs';
validateWeChatFiles();
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { validateContent } from './validate-content.mjs';
const names = ['intro', 'game-config', 'common', 'wechat-entry'];
const data = names.map(name => JSON.parse(readFileSync(`src/content/${name}.json`, 'utf8').replace(/^\uFEFF/, '')));
validateContent(...data);
for (const mutate of [
  d => { d[0].title = ''; },
  d => { d[0].preface.id = ''; },
  d => { d[0].preface.paragraphs = []; },
  d => { d[1].initialConversationId = 'unknown'; },
  d => { d[1].initialModule = 'oa'; },
  d => { d[1].startActionId = 'wrong'; },
  d => { delete d[1].characters.linyuan; },
  d => { d[3].placeholderMessage = ''; }
]) { const copy = structuredClone(data); mutate(copy); assert.throws(() => validateContent(...copy), /src\/content\//); }
console.log('PASS: valid content and 8 invalid-content cases');

validateOAFiles();

validateOAPortalFiles();

validateBookstoreFiles();

validateInvestigationFiles();

validateForumFiles();

validateFortuneFiles();
validateArticleFiles();
validateFictionFiles();
validateBookstoreMailFiles();



validateHermitageFiles();

validatePrivateFiles();
