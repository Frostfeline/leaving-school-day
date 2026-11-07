import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {readPrivateFiles} from './validate-private-commission.mjs';
import {privatePaths} from './private-commission-model.mjs';
import {emptyHermitage} from './hermitage-2025-model.mjs';
import {emptyConfrontation} from './sister-confrontation-model.mjs';

const base=process.env.TEST_BASE_URL || 'http://127.0.0.1:'+(process.env.TEST_PORT??'5173')+'/';
const key='leaving-school-day:state:v1';
const data=readPrivateFiles();
const read=name=>JSON.parse(readFileSync('src/content/'+name+'.json','utf8'));
const amount=read('oa-library-record').data.amount;
const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE || (process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined),headless:true});
const errors=[];
const state=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
const initial={version:1,authenticated:true,oaHomeEntered:true,collectedEndings:[],bookstoreMember:{accountId:'luoyao-bookstore'},sisterConfrontation3:{...emptyConfrontation(),startedAt:1,completedAt:2,manuscriptViewedAt:2,nodeId:'S3_COMPLETE'},hermitage2025:{...emptyHermitage(),openingConfirmedAt:1,startedAt:1,completedAt:2,choice:'H25_OPTION_B',stage:'commission'}};
async function setup(save){
  const p=await browser.newPage({viewport:{width:1440,height:900}});
  p.on('pageerror',error=>errors.push(error.message));
  await p.goto(base);
  await p.evaluate(({key,save})=>localStorage.setItem(key,JSON.stringify(save)),{key,save});
  await p.clock.install();
  return p;
}
async function drive(p,condition){
  for(let i=0;i<220;i++){
    if(condition(await state(p)))return;
    const send=p.locator('[data-send-dialogue=owner]');
    if(await send.isVisible()){
      const text=await send.textContent();
      assert(!text.includes('{amountYuan}'));
      if(text.includes('难道还清就可以了？'))assert(text.includes('那500元呢？'));
      await send.click();
    }
    await p.clock.runFor(5000);
  }
  throw Error('Dialogue timeout '+p.url());
}
async function pay(p){
  await p.getByRole('link',{name:'立即缴费',exact:true}).click();
  const button=p.getByRole('button',{name:read('oa-payment').pay.replace('{amount}',amount),exact:true});
  assert(await button.isDisabled());
  await p.locator('#payment-consent').check();
  await button.click();
  await p.clock.runFor(5200);
}

try {
  const legacy=await setup({version:1,authenticated:false,collectedEndings:['ne-graduation','he-ai-you-suo-gui','be-unauthorized-tomorrow']});
  await legacy.reload();
  await legacy.locator('[data-action=start-game]').waitFor();
  assert.equal(await legacy.locator('[data-action=review-ending]').count(),0);
  await legacy.goto(base+'#/endings/te/cast');
  await legacy.waitForURL('**/#/');
  assert.equal(await legacy.locator('.te-cast').count(),0);
  await legacy.context().close();
  console.log('PASS unearned legacy endings hidden');

  for(const branch of ['A','B','C']){
    const earnedBefore=branch==='A'?['ne-graduation']:[];
    const p=await setup({...initial,endingCollectionVersion:1,collectedEndings:earnedBefore,
      ...(branch==='A'?{lastEndingId:'ne-graduation',paymentCheckpoint:{version:1,authenticated:true,oaHomeEntered:true}}:{})});
    if(branch!=='C')await p.emulateMedia({reducedMotion:'reduce'});
    await p.goto(base+'#/bookstore/mail?thread=hermitage-history&returnFolder=inbox');
    assert.equal(await p.locator('.bs-stable-chat-footer').evaluate(el=>el.getBoundingClientRect().height),96);
    const verify=p.locator('.bs-mail-sidebar .bs-mail-private-contact');
    await verify.click();
    await p.getByRole('heading',{name:'Hermitage委托核验',exact:true}).waitFor();
    assert.equal(await p.getByText('委托记录：2021-HM-0625',{exact:true}).count(),0);
    const inputs=p.locator('[data-question-id]');
    assert.deepEqual(await p.locator('[data-question-id=two]').evaluateAll(fields=>fields.map(input=>input.parentElement.textContent)),['年','天']);
    for(const [i,answer] of ['3','4','14','0'].entries())await inputs.nth(i).fill(answer);
    const submit=p.getByRole('button',{name:data.ui.submit,exact:true});
    if(branch==='A'){
      await inputs.nth(1).fill('1475');
      await submit.click();
      await p.getByText(data.verification.failureMessage,{exact:true}).waitFor();
      await inputs.nth(1).fill('4');
      await p.reload();
      assert.equal(await inputs.nth(1).inputValue(),'4');
      assert.equal(await inputs.nth(2).inputValue(),'14');
    }
    await submit.click();
    await p.getByRole('link',{name:data.ui.enterOwner,exact:true}).click();
    await p.getByRole('heading',{name:'Hermitage ■■■',exact:true}).waitFor();
    assert.equal(await p.locator('.bs-private .bs-mail-sidebar').count(),0);
    assert(await p.locator('.bs-private-chat').evaluate(layout=>Math.abs(layout.clientWidth-layout.firstElementChild.clientWidth)<2));
    await drive(p,s=>s.privateCommission.owner.nodeId==='OWNER_ARCHIVE_GATE');
    assert.equal(await p.locator('[data-owner-option]').count(),0);
    await p.getByRole('link',{name:data.ui.openArchive,exact:true}).click();
    await p.getByRole('heading',{name:data.archive.title,exact:true}).waitFor();
    assert.deepEqual(await p.locator('.private-fields dd').allTextContents(),['罗尧','首藤','2021年6月21日']);
    assert.deepEqual(await p.locator('[data-archive-message-id] p').allTextContents(),data.archive.messages.map(m=>m.text));
    assert.deepEqual(await p.locator('[data-archive-message-id] strong').allTextContents(),data.archive.messages.map(m=>m.speakerId==='owner'?'■■■':'罗尧'));
    const back=p.getByRole('button',{name:data.ui.backOwner,exact:true});
    await p.locator('[data-archive-message-id]').last().scrollIntoViewIfNeeded();
    await back.click();
    await drive(p,s=>s.privateCommission.owner.nodeId==='OWNER_FINAL_CHOICE');
    assert((await state(p)).privateCommission.archiveReadAt);
    const outgoing=p.locator('.bs-private .bs-mail-self');
    assert((await outgoing.locator('.bs-mail-sender').allTextContents()).every(name=>name==='罗尧'));
    assert((await outgoing.first().locator('img').getAttribute('src')).endsWith('/wechat-luoyao.jpg'));
    // Direct module inspection is dev-only; production exercises payment via UI below.
    if(process.env.TEST_PRODUCTION!=='1')assert.equal(await p.evaluate(async()=>{const m=await import('/src/state/game-state.ts');return m.beginLibraryPayment(true);}),false);
    const expected=data.dialogue.nodes.find(n=>n.nodeId==='OWNER_AFTER_ARCHIVE').messages;
    assert.equal(await p.locator('.bs-mail-scroll').evaluate(el=>
      el.querySelector('[href="#/bookstore/private/archive"]').nextElementSibling.dataset.ownerMessageId
    ),'owner_after_archive-final-01');
    const rows=await p.locator('[data-owner-message-id^=owner_after_archive-final] .bs-mail-text').allTextContents();
    assert.deepEqual(rows,expected.map(m=>m.text.replace('{amountYuan}',amount.replace(/[^\d.]/g,'').replace(/\.00$/,'')).replaceAll('*','')));
    await p.getByText('「寄寿留契」',{exact:true}).locator('xpath=self::strong').waitFor();
    await p.locator('[data-owner-option=OWNER_OPTION_'+branch+']').click();
    await p.waitForFunction(({key,branch})=>JSON.parse(localStorage.getItem(key)).privateCommission.owner.choice==='OWNER_OPTION_'+branch,{key,branch});
    await p.reload();
    assert.equal(await p.locator('[data-owner-option]').count(),0);
    if(branch==='B'){
      const exit=p.getByRole('button',{name:'嗯，谢谢你告诉我这些。',exact:true});
      const send=p.locator('[data-send-dialogue=owner]');
      for(let i=0;i<80&&!await exit.isVisible();i++){
        assert.equal(await send.count(),0);
        await p.clock.runFor(5000);
      }
      await exit.waitFor();
      const playing=await state(p);
      const messages=playing.privateCommission.owner.emitted.filter(m=>m.id.startsWith('owner_branch_b-final-'));
      const beforeExit=data.dialogue.nodes.find(n=>n.nodeId==='OWNER_BRANCH_B').messages.slice(0,-1);
      assert.deepEqual(messages.map(message=>message.id),beforeExit.map(message=>message.messageId));
      assert(messages.every((m,i)=>i===0||m.at-messages[i-1].at>=3300));
      assert(messages[8].at-messages[7].at>=5200);
      await p.clock.runFor(15000);
      assert.equal((await state(p)).ending,null);
      await p.reload();
      await exit.click();
    }
    if(branch==='C'){
      const prompt=p.getByRole('link',{name:data.ui.enterEnding,exact:true});
      for(let i=0;i<80&&!await prompt.isVisible();i++){
        assert.equal(await p.locator('[data-send-dialogue=owner]').count(),0);
        await p.clock.runFor(5000);
      }
      await prompt.waitFor();
      await p.clock.runFor(10000);
      assert(p.url().endsWith('#/bookstore/private/owner'));
      const emphasis=p.locator('[data-owner-message-id=owner_branch_c-final-13] strong');
      assert.equal(await emphasis.textContent(),'罗尧经历了一次和你萍水相逢的人生，又回到了那个分岔口避开了与你擦肩而过的命运');
      await p.reload();
      await p.locator('[data-owner-message-id=owner_branch_c-final-21] .bs-mail-text').click();
    }
    await drive(p,s=>s.privateCommission.owner.completedAt!==null);
    const done=await state(p);
    const branchLines=data.dialogue.nodes.find(n=>n.nodeId==='OWNER_BRANCH_'+branch).messages;
    assert.deepEqual(done.privateCommission.owner.emitted.filter(m=>m.id.startsWith('owner_branch_')).map(m=>m.id),branchLines.map(m=>m.messageId));
    assert.equal(done.libraryPayment,null);
    if(branch==='A'){
      assert(p.url().endsWith('#/bookstore/private/owner'));
      assert.equal(await p.getByText('返回东澜大学OA结清页面，进入手动OA结清。',{exact:true}).count(),0);
      await p.getByRole('link',{name:data.ui.openOa,exact:true}).click();
      await p.waitForURL('**/#/oa/notices/library-exception');
      assert.equal(done.ending,null);
      await pay(p);
      await p.waitForURL('**/#/ending/he/payment');
      await p.getByText('已办结',{exact:true}).waitFor();
      const paid=await state(p);
      assert.deepEqual(paid.collectedEndings,earnedBefore);
      assert(paid.confirmedResponsibility&&paid.privateCommission.informedCompletedAt);
      assert.equal(paid.libraryPayment.outcome,'he');
      await p.reload();
      await p.clock.runFor(5500);
      assert(p.url().endsWith('#/ending/he/payment'));
      await p.getByRole('button',{name:read('ending-ne').actions.continue,exact:true}).click();
      await p.waitForURL('**/#/ending/he');
      assert.equal((await state(p)).libraryPayment.completedAt,paid.libraryPayment.completedAt);
      await p.getByRole('button',{name:read('endings/he-ai-you-suo-gui').continue,exact:true}).click();
      const title=p.locator('.he-endingTitle').last();
      assert.deepEqual(await p.locator('.he-block').allTextContents(),read('endings/he-ai-you-suo-gui').scenes.flatMap(scene=>scene.blocks.map(block=>block.text)));
      assert.deepEqual(await p.locator('.he-block').evaluateAll(blocks=>blocks.map(block=>block.style.paddingBlockStart).filter(Boolean)),["2lh","2lh"]);
      await title.scrollIntoViewIfNeeded();
      await p.locator('.ending-unlock-notice').waitFor();
      await p.reload();
      await title.scrollIntoViewIfNeeded();
      assert.equal(await p.locator('.ending-unlock-notice').count(),0);
      await p.goto(base+'#/');
      await p.locator('[data-action=rewind-owner]').click();
      await p.waitForURL('**/#/bookstore/private/owner');
      await p.locator('[data-owner-option]').first().waitFor();
      assert.equal(await p.locator('[data-owner-option]').count(),3);
      const rewound=await state(p);
      assert.equal(rewound.libraryPayment,null);
      assert.equal(rewound.ending,null);
      assert.equal(rewound.privateCommission.owner.choice,null);
      assert.deepEqual(rewound.collectedEndings,[...earnedBefore,'he-ai-you-suo-gui']);
    } else if(branch==='B'){
      const prompt=p.getByRole('link',{name:data.ui.enterEnding,exact:true});
      await prompt.waitFor();
      await p.clock.runFor(15000);
      assert(p.url().endsWith('#/bookstore/private/owner'));
      assert.equal(await p.locator('[data-owner-message-id=owner_branch_b-final-25] .bs-mail-text').textContent(),'嗯，谢谢你告诉我这些。');
      await p.reload();
      await prompt.focus();
      await p.keyboard.press('Enter');
      await p.waitForURL('**/#/ending/be');
      await p.getByText('Bad End｜此生有涯',{exact:true}).waitFor();
      assert.equal(done.ending,'be-unauthorized-tomorrow');
      assert.deepEqual(await p.locator('.he-block').allTextContents(),data.ending.scenes.flatMap(scene=>scene.blocks.map(block=>block.text)));
      assert.deepEqual(await p.locator('.he-block').evaluateAll(blocks=>blocks.map(block=>block.style.paddingBlockStart).filter(Boolean)),["1lh","1lh","1lh"]);
      await p.locator('.he-endingTitle').last().scrollIntoViewIfNeeded();
      await p.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).collectedEndings.includes('be-unauthorized-tomorrow'),key);
      if(process.env.TEST_PRODUCTION!=='1')assert.equal(await p.evaluate(async()=>{const m=await import('/src/state/game-state.ts');return m.ownerInvitationAvailable()||await m.beginLibraryPayment(true);}),false);
      await p.reload();
      await p.getByText('Bad End｜此生有涯',{exact:true}).waitFor();
    } else {
      await p.waitForURL('**/#/ending/te');
      assert.equal(done.ending,'te-unfinished-pact');
      assert.equal(await p.locator('.te-cast').count(),0);
      assert.equal(await p.getByRole('link',{name:data.ui.openInvitation,exact:true}).count(),0);
      await p.goto(base+data.ui.invitationRoute);
      await p.waitForURL('**/#/bookstore/private/owner');
      assert.equal(await p.getByRole('link',{name:data.ui.openInvitation,exact:true}).count(),0);
      await p.getByRole('link',{name:data.ui.enterEnding,exact:true}).click();
      await p.waitForURL('**/#/ending/te');
      await p.getByText(data.trueEnding.finalLabel,{exact:true}).scrollIntoViewIfNeeded();
      await p.clock.runFor(20000);
      const cast=p.locator('.te-cast');
      assert.deepEqual(await p.locator('.he-block').allTextContents(),data.trueEnding.scenes.flatMap(scene=>scene.blocks.map(block=>block.text)));
      assert.deepEqual(await p.locator('.he-block').evaluateAll(blocks=>blocks.map(block=>block.style.paddingBlockStart).filter(Boolean)),["2lh"]);
      assert.equal(await cast.count(),0);
      assert.equal((await state(p)).privateCommission.te.castStartedAt,null);
      await p.getByRole('button',{name:data.trueEnding.enterCast,exact:true}).click();
      await cast.waitFor();
      assert.equal(await cast.evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(0, 0, 0)');
      assert.deepEqual(await cast.locator('.te-cast-name').allTextContents(),data.cast.groups.flatMap(g=>g.people.map(p=>p.name)));
      assert.deepEqual(await cast.locator('.te-cast-note').allTextContents(),data.cast.groups.flatMap(g=>g.people.map(p=>p.note).filter(Boolean)));
      assert(await cast.evaluate(e=>parseFloat(getComputedStyle(e.querySelector('.te-cast-name')).fontSize)>parseFloat(getComputedStyle(e.querySelector('.te-cast-note')).fontSize)));
      await p.reload();
      await cast.waitFor();
      await p.clock.runFor(50);
      const roll=cast.locator('.te-cast-roll');
      assert.equal(await roll.locator('.te-cast-name').last().textContent(),'常思烛');
      assert.equal(await cast.locator('.te-cast-closing').count(),0);
      const duration=await roll.evaluate(e=>{const a=e.getAnimations()[0];const duration=a.effect.getTiming().duration;a.finish();return duration;});
      assert(duration>40000);
      const closing=cast.locator('.te-cast-closing');
      await closing.waitFor();
      assert.equal(await roll.count(),0);
      assert.equal(await closing.textContent(),data.cast.closing);
      assert.equal(await cast.locator('.te-cast-home').count(),0);
      await closing.evaluate((e,holdMs)=>{
        const animation=e.getAnimations()[0];
        const duration=animation.effect.getTiming().duration;
        if(duration<=holdMs)throw Error('Closing fades missing');
        animation.currentTime=0;
        if(getComputedStyle(e).opacity!=='0')throw Error('Closing must fade in');
        animation.currentTime=duration/2;
        if(getComputedStyle(e).opacity!=='1')throw Error('Closing must hold at full opacity');
        animation.finish();
      },data.cast.holdMs);
      await p.locator('[data-cast=finished]').waitFor();
      await p.reload();
      await p.locator('[data-cast=finished]').waitFor();
      assert.equal(await p.locator('.te-cast-roll').count(),0);
      const home=p.getByRole('link',{name:data.trueEnding.returnHome,exact:true});
      assert.equal(await home.evaluate(el=>getComputedStyle(el).borderTopWidth),'1px');
      await home.click();
      await p.waitForURL('**/#/');
      const completed=await state(p);
      const replay=p.getByRole('link',{name:data.trueEnding.replayCast,exact:true});
      assert.equal(await replay.isVisible(),false);
      await p.locator('[data-action=review-ending]').click();
      await p.getByRole('link',{name:data.trueEnding.finalLabel,exact:true}).waitFor();
      const afterword=p.getByRole('button',{name:'后记',exact:true});
      const note=p.locator('#intro-afterword');
      assert(await note.isHidden());
      await afterword.click();
      assert(p.url().endsWith('#/'));
      assert(await note.isVisible());
      assert.deepEqual(await note.locator('p').allTextContents(),read('intro').afterword.paragraphs);
      assert(await p.evaluate(()=>window.scrollY>0));
      await afterword.click();
      assert(await note.isHidden());
      await replay.click();
      await p.waitForURL('**/#/endings/te/cast');
      await cast.locator('.te-cast-roll').waitFor();
      assert.equal(await p.locator('[data-scene-id]').count(),0);
      assert.deepEqual((await state(p)).privateCommission.te,completed.privateCommission.te);
    }
    if(branch!=='C')assert.equal(await p.locator('.te-cast').count(),0);
    assert.equal((await state(p)).collectedEndings.length,earnedBefore.length+1);
    console.log('PASS '+branch+' archive, dialogue order, choice persistence and ending');
    await p.context().close();
  }
  const normal=await setup({version:1,authenticated:true,oaHomeEntered:true,collectedEndings:[]});
  await normal.goto(base+'#/oa/notices/library-exception');
  await pay(normal);
  await normal.waitForURL('**/#/ending/ne');
  assert.deepEqual((await state(normal)).collectedEndings,[]);
  await normal.getByRole('button',{name:read('ending-ne').actions.continue,exact:true}).click();
  await normal.clock.runFor(15000);
  await normal.getByText('Normal End｜毕业快乐',{exact:true}).waitFor();
  assert.deepEqual((await state(normal)).collectedEndings,['ne-graduation']);
  assert.deepEqual((await normal.locator('.ne-narrative > p').allTextContents()),[...read('ending-ne').paragraphs,read('ending-ne').closing,read('ending-ne').finalLabel]);
  assert.equal(await normal.locator('.te-cast').count(),0);
  await normal.goto(base+'#/');
  await normal.locator('[data-action=rewind-payment]').click();
  await normal.waitForURL('**/#/oa/payment');
  assert.equal((await state(normal)).libraryPayment,null);
  console.log('PASS ordinary payment and Normal End');
  await normal.context().close();

  if(process.env.TEST_PRODUCTION!=='1'){
  const editor=await setup({version:1,authenticated:false});
  const before=await state(editor);
  await editor.goto(base+'#/dev/private-commission-editor');
  const nav=editor.locator('.he-editor-index');
  await nav.getByRole('button',{name:data.ui.trueEnding,exact:true}).click();
  await editor.locator('.he-editor-preview').getByText(data.trueEnding.finalLabel,{exact:true}).waitFor();
  await nav.getByRole('button',{name:data.ui.cast,exact:true}).click();
  const closing=editor.locator('.he-editor-fields').getByRole('textbox',{name:'closing',exact:true});
  await closing.fill('CAST 保存测试');
  await editor.locator('.he-editor-preview').getByText('CAST 保存测试',{exact:true}).waitFor();
  const files=new Map(Object.values(privatePaths).map(path=>['src/content/'+path+'.json',readFileSync('src/content/'+path+'.json')]));
  try {
    const response=editor.waitForResponse(r=>r.url().endsWith('/__archive-dev/private-content')&&r.request().method()==='POST');
    await editor.getByRole('button',{name:data.ui.saveProject,exact:true}).click();
    const result=await response;
    assert(result.ok(),await result.text());
    assert.equal(read('endings/te-cast').closing,'CAST 保存测试');
    assert.deepEqual(await state(editor),before);
  } finally {
    for(const [path,contents] of files)writeFileSync(path,contents);
  }
  console.log('PASS True End and CAST editor, project save and player save isolation');
  }
  assert.deepEqual(errors,[]);
} finally {
  await browser.close();
}
