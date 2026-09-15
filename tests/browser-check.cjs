// Requires Playwright and a local server: python3 -m http.server 8765 --bind 127.0.0.1
// Run with: node tests/browser-check.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const snapshot = require('../prototypes/shared/projects.json');
const origin = process.env.PREVIEW_URL || 'http://127.0.0.1:8765';

(async () => {
  const browser = await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL || 'chrome'});
  try {
    for (const theme of ['studio','launchpad','playground']) {
      const context = await browser.newContext({viewport:{width:1440,height:1080}});
      const page = await context.newPage();
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.route('https://api.github.com/**',route=>route.fulfill({json:snapshot.repositories}));
      await page.goto(`${origin}/prototypes/${theme}/`);
      await page.waitForFunction(()=>document.querySelector('#feed-status').textContent.startsWith('Updated from GitHub'));
      assert.equal(await page.locator('.project').count(),17);
      await page.locator('#search').fill('sports');
      assert.equal(await page.locator('.project').count(),1);
      assert.equal(await page.locator('.open-project').getAttribute('href'),'https://joellimrl.github.io/sportsCalendar/');
      await page.locator('#search').fill('football');
      assert.equal(await page.locator('.project').count(),1,'search includes the description displayed on the card');
      assert.equal(await page.locator('.project h3').textContent(),'World Cup 2026');
      await page.locator('#search').fill('nothing-matches-this');
      assert.equal(await page.locator('#empty').isVisible(),true);
      await page.locator('#clear-search').click();
      assert.equal(await page.locator('.project').count(),17);
      await page.getByRole('button',{name:'HTML',exact:true}).click();
      assert.equal(await page.locator('.project').count(),4);
      await page.getByRole('button',{name:'All projects',exact:true}).click();
      await page.locator('#sort').selectOption('name');
      assert.equal(await page.locator('.project h3').first().textContent(),'Audition Clone');
      await page.locator('#sort').selectOption('recent');
      if(theme==='playground') {
        await page.locator('#surprise').click();
        assert.equal(await page.locator('dialog').isVisible(),true);
        assert.match(await page.locator('dialog a').getAttribute('href'),/^https:\/\/joellimrl.github.io\//);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('dialog').isVisible(),false);
      }
      for(const width of [1440,1024,768,430,390,320]) {
        await page.setViewportSize({width,height:900});
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${theme} overflow at ${width}`);
      }
      await page.setViewportSize({width:390,height:844});
      await page.evaluate(()=>document.fonts.ready);
      await page.screenshot({path:path.join('/tmp',`joel-${theme}-mobile.png`)});
      await page.unroute('https://api.github.com/**');
      await page.route('https://api.github.com/**',route=>route.fulfill({status:403,json:{message:'rate limit'}}));
      await page.locator('#refresh').click();
      await page.waitForFunction(()=>document.querySelector('#feed-status').textContent.includes('unavailable'));
      assert.equal(await page.locator('.project').count(),17);
      assert.deepEqual(errors,[]);
      console.log(`PASS ${theme}: 17 projects, search, filter, reset, sort, six viewport widths, API fallback${theme==='playground'?', random-project dialog':''}`);
      await context.close();
    }
    const context=await browser.newContext();const page=await context.newPage();
    const newRepo={name:'brandNewDeployment',owner:{login:'joellimrl'},has_pages:true,language:'Rust',pushed_at:'2026-09-16T00:00:00Z'};
    await page.route('https://api.github.com/**',route=>route.fulfill({json:[...snapshot.repositories,newRepo]}));
    await page.goto(`${origin}/prototypes/studio/`);
    await page.waitForFunction(()=>document.querySelectorAll('.project').length===18);
    assert.equal(await page.locator('.project h3').first().textContent(),'Brand New Deployment');
    await page.getByRole('button',{name:'Rust',exact:true}).click();
    assert.equal(await page.locator('.project').count(),1);
    await page.unroute('https://api.github.com/**');
    await page.route('https://api.github.com/**',route=>route.fulfill({json:[]}));
    await page.locator('#refresh').click();
    await page.waitForFunction(()=>document.querySelectorAll('.project').length===0);
    assert.equal(await page.locator('#empty').isVisible(),true);
    console.log('PASS new deployment appears without configuration; successful empty refresh removes old projects');
    await context.close();
    const offline=await browser.newContext();const offlinePage=await offline.newPage();
    await offlinePage.route('https://api.github.com/**',route=>route.abort());
    await offlinePage.goto(`${origin}/prototypes/launchpad/`);
    await offlinePage.waitForFunction(()=>document.querySelector('#feed-status').textContent.includes('unavailable'));
    assert.equal(await offlinePage.locator('.project').count(),17);
    console.log('PASS first visit with unavailable API renders the bundled snapshot');
    await offline.close();
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
