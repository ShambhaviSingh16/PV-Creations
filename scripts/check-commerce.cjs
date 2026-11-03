// Run npm run server + npm run dev first. Set PV_TEST_OWNER_TOKEN from the local server terminal.
const {chromium}=require('../.qa/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1400,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.route('https://fonts.gstatic.com/**',r=>r.abort());page.setDefaultTimeout(60000);
 await page.goto('http://127.0.0.1:5173/',{waitUntil:'domcontentloaded',timeout:120000});
 await page.locator('.product-card').first().waitFor();
 await page.locator('.hero-buttons .text-button').click();
 const generalChat=await page.getByRole('link',{name:'Discuss my idea on WhatsApp'}).getAttribute('href');
 assert.ok(generalChat.startsWith('https://wa.me/919380250104?text='));
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'View The sunshine bouquet',exact:true}).click();
 await page.getByRole('button',{name:'Make it personal',exact:true}).click();
 const productChat=await page.getByRole('link',{name:'Discuss my idea on WhatsApp'}).getAttribute('href');
 assert.ok(decodeURIComponent(productChat).includes('The sunshine bouquet'));
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Add The sunshine bouquet to bag',exact:true}).click();
 await page.getByRole('button',{name:'Open shopping bag, 1 items'}).click();
 await page.getByRole('button',{name:'Continue to checkout'}).click();
 for(const [name,value] of [['Full name','Browser Test'],['Email address','browser@example.com'],['Phone number','9999999999'],['Street address / apartment','123 Test Street'],['City','New Delhi'],['State / union territory','Delhi'],['PIN code','110001']])await page.getByLabel(name,{exact:true}).fill(value);
 await page.getByRole('checkbox').check();
 await page.getByRole('button',{name:'Review order & delivery charges'}).click();
 await page.getByRole('heading',{name:'Review your order',exact:true}).waitFor();
 assert.match(await page.locator('.dialog').innerText(),/779/);
 await page.getByRole('button',{name:'Simulate payment — local test'}).click();
 await page.getByRole('heading',{name:'A little love is on its way.'}).waitFor();
 const reference=(await page.locator('.reference').innerText()).replace('Reference: ','');
 await page.screenshot({path:'.qa/checkout-confirmation.png'});
 await page.keyboard.press('Escape');
 await page.goto('http://127.0.0.1:5173/#admin',{waitUntil:'domcontentloaded'});
 await page.getByLabel('Development token').fill(process.env.PV_TEST_OWNER_TOKEN||'');
 await page.getByRole('button',{name:'Open workspace'}).click();
 await page.getByRole('button',{name:'Orders',exact:false}).waitFor();
 const order=page.locator('.admin-order').filter({hasText:reference});await order.getByRole('button',{name:'Mark in production'}).click();
 await order.getByText('in production',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Products',exact:false}).click();
 await page.locator('.admin-products article').first().getByRole('button',{name:'Edit'}).click();
 await page.getByRole('heading',{name:'Edit piece'}).waitFor();
 await page.screenshot({path:'.qa/owner-products.png'});
 for(const width of [390,768,1400]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`owner overflow ${width}`);}
 assert.deepEqual(errors,[]);
 console.log('PASS: WhatsApp recipient and product-specific message, server-connected checkout, shipping total, simulated captured payment, persisted order, authenticated owner access, preparation status, product editor and responsive dashboard.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
