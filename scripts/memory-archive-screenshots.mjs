import {chromium} from '@playwright/test';
import {readFileSync,mkdirSync} from 'node:fs';
const ui=JSON.parse(readFileSync('src/content/memoryArchive/ui.json','utf8'));const pairs=JSON.parse(readFileSync('src/content/memoryArchive/puzzle.json','utf8')).pairs;
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});mkdirSync('test-results',{recursive:true});
try{
 const c=await browser.newContext({viewport:{width:1440,height:900}});const page=await c.newPage();await page.goto('http://127.0.0.1:4173/#/memory-archive?chat=litianming&source=litianming-2022-08-03-01');await page.locator('.ma-chat-message').first().waitFor();await page.screenshot({path:'test-results/memory-archive-main-1440.png'});
 await page.getByRole('tab',{name:ui.tabs.attachments,exact:true}).click();await page.screenshot({path:'test-results/memory-archive-gallery-1440.png'});await page.locator('.ma-gallery .ma-file').last().click();await page.screenshot({path:'test-results/memory-archive-document-4173-1440.png'});await page.keyboard.press('Escape');
 for(const p of pairs){await page.locator(`[data-attachment-id="${p.attachmentId}"]`).click();await page.locator(`[data-pair-id="${p.id}"] .ma-slot`).click();}await page.screenshot({path:'test-results/memory-archive-complete-4173-1440.png',fullPage:true});await c.close();
 const editorContext=await browser.newContext({viewport:{width:1600,height:1000}});const editor=await editorContext.newPage();await editor.goto('http://127.0.0.1:5173/#/memory-archive/editor');await editor.locator('.ma-editor-message').first().waitFor();await editor.waitForTimeout(500);await editor.screenshot({path:'test-results/memory-archive-editor-1600.png'});await editorContext.close();console.log('Saved actual player, gallery, document, completed and editor screenshots');
}finally{await browser.close();}
