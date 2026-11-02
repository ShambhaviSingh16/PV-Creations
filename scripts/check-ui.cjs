// Temporary-tool dependency: npm install --prefix .qa playwright
// Uses installed Microsoft Edge; no browser download required.
const { chromium } = require('../.qa/node_modules/playwright');
const assert = require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.route('https://fonts.googleapis.com/**', route=>route.abort()); await page.route('https://fonts.gstatic.com/**', route=>route.abort()); page.setDefaultTimeout(60000); const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:120000});
 await page.getByRole('heading',{name:'A little piece of home.'}).waitFor();
 assert.equal(await page.locator('.product-card').count(),4);
 await page.locator('img').evaluateAll(images=>images.forEach(i=>i.loading='eager')); await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0)); assert.equal(await page.locator('img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0)),true);
 await page.getByRole('button',{name:'Flowers',exact:true}).last().click();
 assert.equal(await page.locator('.product-card').count(),2);
 await page.getByRole('button',{name:'All pieces',exact:true}).click();
 await page.getByRole('button',{name:'Save The sunshine bouquet',exact:true}).click();
 await page.getByRole('button',{name:'Add The sunshine bouquet to bag',exact:true}).click();
 await page.getByRole('button',{name:'Open shopping bag, 1 items'}).click();
 await page.getByRole('button',{name:'Increase quantity of The sunshine bouquet'}).click();
 await page.getByRole('button',{name:'Preview checkout'}).click();
 await page.getByText('No order has been placed and no payment will be taken.',{exact:false}).waitFor();
 await page.keyboard.press('Escape');
 await page.reload({waitUntil:'domcontentloaded',timeout:120000});
 await page.getByRole('button',{name:'Open shopping bag, 2 items'}).waitFor();
 await page.getByRole('button',{name:'Saved pieces (1)'}).waitFor();
 await page.getByRole('button',{name:'Search products'}).click();
 await page.getByRole('textbox',{name:'Search handmade pieces'}).fill('no-matching-product');
 assert.equal(await page.locator('.product-card').count(),0);
 await page.getByRole('button',{name:'Close search'}).click();
 await page.locator('.hero-buttons .text-button').click();
 await page.getByRole('heading',{name:'A little idea. A lot of possibility.'}).waitFor();
 await page.keyboard.press('Escape');
 await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:'.qa/desktop.png',fullPage:true});
 for(const width of [390,768,1440]){
   await page.setViewportSize({width,height:900});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow at ${width}`);
 }
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'Toggle navigation'}).click();
 await page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('button',{name:'Little keepsakes'}).click();
 assert.equal(await page.locator('.product-card').count(),1);
 await page.locator('.product-name').click();
 await page.locator('#variant').selectOption('Teddy');
 await page.getByRole('button',{name:'Add to bag',exact:true}).click();
 await page.getByRole('button',{name:'Open shopping bag, 3 items'}).click();
 await page.getByText('Teddy',{exact:true}).waitFor();
 await page.keyboard.press('Escape');
 await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:'.qa/mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('PASS: images, catalog filtering, favourites, search, cart quantity/persistence, checkout preview, custom dialog, variants, mobile navigation, no horizontal overflow or runtime errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
