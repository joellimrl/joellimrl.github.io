// Run against the built artifact: PREVIEW_URL=http://127.0.0.1:8765/dist node tests/production-browser-check.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const manifest = require('../data/projects.json');
const origin = process.env.PREVIEW_URL || 'http://127.0.0.1:8765/dist';

(async () => {
  const browser = await chromium.launch({channel:process.env.BROWSER_CHANNEL || 'chrome',headless:true});
  try {
    const context=await browser.newContext({viewport:{width:1440,height:1080}});
    const page=await context.newPage();
    const errors=[],apiRequests=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('request',request=>{if(request.url().includes('api.github.com'))apiRequests.push(request.url());});
    await page.goto(`${origin}/`);
    await page.waitForFunction(()=>document.querySelector('#feed-status').textContent.startsWith('Collection updated'));
    assert.equal(await page.locator('.project').count(),manifest.projects.length);
    assert.equal(await page.locator('.prototype-nav').count(),0);
    assert.match(await page.title(),/Joel Lim/);
    await page.locator('#search').fill('football');
    assert.equal(await page.locator('.project h3').textContent(),'World Cup 2026');
    await page.locator('#search').fill('not-a-project');
    assert.equal(await page.locator('#empty').isVisible(),true);
    await page.locator('#clear-search').click();
    assert.equal(await page.locator('.project').count(),manifest.projects.length);
    await page.getByRole('button',{name:'HTML',exact:true}).click();
    assert.equal(await page.locator('.project').count(),manifest.projects.filter(p=>p.language==='HTML').length);
    await page.getByRole('button',{name:'All projects',exact:true}).click();
    await page.locator('#sort').selectOption('name');
    assert.equal(await page.locator('.project h3').first().textContent(),'Audition Clone');
    await page.locator('#sort').selectOption('recent');
    await page.locator('#surprise').click();
    assert.equal(await page.locator('dialog').isVisible(),true);
    assert.match(await page.locator('dialog a').getAttribute('href'),/^https:\/\//);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog').isVisible(),false);
    for(const width of [1440,1024,768,430,390,320]) {
      await page.setViewportSize({width,height:900});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`Overflow at ${width}`);
    }
    await page.setViewportSize({width:1440,height:1080});
    await page.evaluate(()=>{document.activeElement.blur();window.scrollTo(0,0);return document.fonts.ready;});
    await page.screenshot({path:'/tmp/joel-playground-production.png'});
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:'/tmp/joel-playground-production-mobile.png'});
    // A daily manifest change appears immediately when a visitor reloads the published list.
    const added={...manifest.projects[0],name:'newDailyProject',title:'New Daily Project',description:'Fresh from the daily build',url:'https://example.org/new/',code:'https://github.com/joellimrl/newDailyProject'};
    await page.route('**/data/projects.json',route=>route.fulfill({json:{...manifest,projects:[added,...manifest.projects]}}));
    await page.locator('#refresh').click();
    await page.waitForFunction(n=>document.querySelectorAll('.project').length===n,manifest.projects.length+1);
    await page.unroute('**/data/projects.json');
    await page.route('**/data/projects.json',route=>route.abort());
    await page.reload();
    await page.waitForFunction(()=>document.querySelector('#feed-status').textContent.includes('saved collection'));
    assert.equal(await page.locator('.project').count(),manifest.projects.length+1);
    assert.deepEqual(apiRequests,[],'visitors do not call GitHub API');
    assert.deepEqual(errors,[]);
    console.log('PASS production: local manifest, no GitHub API calls, search, filters, sort, random project, daily manifest replacement, cached failure, six viewport sizes');
    await context.close();
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
