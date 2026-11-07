import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';

const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE || (process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined)});
try {
  for(const viewport of [{width:1680,height:900},{width:390,height:844}]){
    const page=await browser.newPage({viewport});
    await page.goto(process.env.TEST_BASE_URL || 'http://127.0.0.1:5173/');
    await page.evaluate(async()=>{
      const NativeAudio=window.Audio;
      window.Audio=class extends NativeAudio{constructor(...args){super(...args);window.testAudio=this;}};
      const {TEEndingScreen}=await import('/src/screens/TEEndingScreen.ts');
      document.body.replaceChildren(TEEndingScreen('review'));
    });
    await page.getByRole('button',{name:'点击进入CAST界面'}).click();
    await page.waitForFunction(()=>window.testAudio.currentTime>0);
    const timing=await page.evaluate(()=>({duration:window.testAudio.duration,roll:document.querySelector('.te-cast-roll').getAnimations()[0].effect.getTiming().duration}));
    assert(Math.abs(timing.duration-73.848163)<0.01);
    assert.equal(timing.roll,68648.163);
    await page.evaluate(()=>{window.testAudio.pause();window.testAudio.currentTime=20;});
    await page.waitForTimeout(100);
    assert(Math.abs(await page.locator('.te-cast-roll').evaluate(e=>e.getAnimations()[0].currentTime)-20000)<1);
    await page.evaluate(()=>{window.testAudio.currentTime=69;});
    await page.locator('.te-cast-closing').waitFor();
    await page.evaluate(()=>{window.testAudio.currentTime=73.4;});
    await page.waitForTimeout(100);
    const fade=await page.evaluate(()=>({volume:window.testAudio.volume,opacity:Number(getComputedStyle(document.querySelector('.te-cast-closing')).opacity)}));
    assert(Math.abs(fade.volume-fade.opacity)<0.01);
    assert(fade.volume>0.4&&fade.volume<0.6);
    await page.evaluate(()=>{window.testAudio.currentTime=window.testAudio.duration;});
    await page.getByRole('link',{name:'返回主界面',exact:true}).waitFor();
    assert(await page.evaluate(()=>window.testAudio.paused&&!window.testAudio.getAttribute('src')));
    // Replay starts at zero; leaving the screen releases the audio resource.
    await page.evaluate(async()=>{const {TEEndingScreen}=await import('/src/screens/TEEndingScreen.ts');document.body.replaceChildren(TEEndingScreen('review'));});
    await page.getByRole('button',{name:'点击进入CAST界面'}).click();
    await page.waitForFunction(()=>window.testAudio.currentTime>0);
    assert(await page.evaluate(()=>window.testAudio.currentTime<2));
    await page.evaluate(()=>document.querySelector('.te-ending').dispatchEvent(new Event('screen-dispose')));
    assert(await page.evaluate(()=>window.testAudio.paused&&!window.testAudio.getAttribute('src')));
    await page.close();
  }
  console.log('PASS desktop/mobile fixed music timing, buffering pause, synchronized fade, completion, replay and disposal');
} finally {await browser.close();}
