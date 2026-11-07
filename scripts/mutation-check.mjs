import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const path = 'src/content/intro.json';
const original = readFileSync(path, 'utf8');
const build = () => { execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit'], { stdio: 'inherit' }); execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--configLoader', 'native'], { stdio: 'inherit' }); };
const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const page = await browser.newPage();
try {
  const cases = [
    ['A title', d => { d.title = '标题修改验收'; }, async () => { await page.getByRole('heading', { name: '标题修改验收', exact: true }).waitFor(); assert.equal(await page.title(), '标题修改验收'); }],
    ['B background', d => { d.tabs[1].paragraphs[0] = '背景正文修改验收。'; }, async () => { await page.locator('#tab-background').click(); await page.getByText('背景正文修改验收。', { exact: true }).waitFor(); }],
    ['C paragraph', d => { d.tabs[0].paragraphs.push('新增自然段验收。'); }, async () => { await page.getByText('新增自然段验收。', { exact: true }).waitFor(); assert.equal(await page.locator('#intro-panel p').count(), 6); }],
    ['D start label', d => { d.actions.start = '从这里出发'; }, async () => { await page.getByRole('button', { name: '从这里出发' }).waitFor(); }],
    ['E tab labels', d => { d.tabs[0].label = '阅读须知'; d.tabs[1].label = '故事之前'; }, async () => { await page.getByRole('tab', { name: '故事之前' }).click(); await page.getByText('这原本应该只是一个普通的毕业日。', { exact: true }).waitFor(); await page.getByRole('tab', { name: '阅读须知' }).click(); await page.getByRole('heading', { name: '玩前提醒' }).waitFor(); }]
  ];
  for (const [name, mutate, check] of cases) {
    const data = JSON.parse(original); mutate(data); writeFileSync(path, JSON.stringify(data, null, 2)); build();
    await page.goto('http://127.0.0.1:4173/'); await check();
    await page.locator('[data-action="start-game"]').click();
    await page.getByRole('heading', { name: '姐姐', exact: true }).waitFor();
    console.log(`PASS ${name}: JSON-only edit, production build and start`);
  }
} finally { writeFileSync(path, original); await browser.close(); build(); }
