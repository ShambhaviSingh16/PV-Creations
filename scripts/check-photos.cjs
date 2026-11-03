// npm run server + npm run dev must be running. Local test data only.
const {chromium}=require('../.qa/node_modules/playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const api='http://127.0.0.1:8787/api',token=process.env.PV_TEST_OWNER_TOKEN;
async function call(endpoint,method='GET',body){const r=await fetch(api+endpoint,{method,headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();if(!r.ok)throw Error(data.error);return data;}
(async()=>{
 assert.ok(token,'Set PV_TEST_OWNER_TOKEN from the local backend terminal.');
 const original=(await call('/admin/overview')).products[0];assert.ok(original.sample,'Use a local sample product for this check.');
 const files=['flowers.jpg','keychains.jpg','hero.jpg','flowers.jpg'].map(name=>path.resolve('public/images',name));
 const browser=await chromium.launch({channel:'msedge',headless:true});let createdId;
 try{
  const page=await browser.newPage({viewport:{width:1400,height:1000}});page.setDefaultTimeout(90000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.route('https://fonts.gstatic.com/**',r=>r.abort());
  async function login(){await page.getByLabel('Development token').fill(token);await page.getByRole('button',{name:'Open workspace'}).click();await page.getByRole('button',{name:'Products',exact:false}).click();}
  await page.goto('http://127.0.0.1:5173/#admin',{waitUntil:'domcontentloaded',timeout:120000});await login();
  await page.locator('.admin-products article').first().getByRole('button',{name:'Edit',exact:true}).click();
  assert.equal(await page.getByLabel('Image path or HTTPS URL',{exact:true}).count(),0);
  await page.locator('#product-photo-files').setInputFiles(files);
  await page.waitForFunction(()=>document.querySelectorAll('.photo-editor-grid>li').length===5&&!document.querySelector('.photo-progress'));
  const newCover=await page.locator('.photo-editor-grid>li').nth(2).locator('img').getAttribute('src');
  await page.getByRole('button',{name:'Use photo 3 as cover'}).click();assert.equal(await page.locator('.photo-editor-grid img').first().getAttribute('src'),newCover);
  await page.getByRole('button',{name:'Move photo 4 earlier'}).click();await page.getByRole('button',{name:'Remove photo 5'}).click();assert.equal(await page.locator('.photo-editor-grid>li').count(),4);
  await page.getByRole('button',{name:'Save piece',exact:true}).click();await page.getByText('Product saved. Refresh the storefront to see your changes.').waitFor();
  await page.reload({waitUntil:'domcontentloaded'});await login();await page.locator('.admin-products article').first().getByRole('button',{name:'Edit',exact:true}).click();assert.equal(await page.locator('.photo-editor-grid>li').count(),4);assert.equal(await page.locator('.photo-editor-grid img').first().getAttribute('src'),newCover);
  await page.locator('#product-photo-files').setInputFiles({name:'notes.txt',mimeType:'text/plain',buffer:Buffer.from('This is not a photo')});await page.getByRole('alert').filter({hasText:'Choose a JPG'}).waitFor();
  await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.getByRole('button',{name:'Add a handmade piece'}).click();assert.equal(await page.getByRole('button',{name:'Save piece',exact:true}).isDisabled(),true);
  await page.locator('#product-photo-files').setInputFiles(files);await page.waitForFunction(()=>document.querySelectorAll('.photo-editor-grid>li').length===4&&!document.querySelector('.photo-progress'));
  for(const [label,value] of [['Product name','Photo gallery browser test'],['Price (INR)','350'],['Available units / making slots','3'],['Materials','Cotton yarn'],['Dimensions / included items','10 cm crochet piece'],['Description','A sample crochet photo gallery for local browser testing.'],['Care instructions','Gently dust and keep dry.']])await page.getByLabel(label,{exact:true}).fill(value);
  await page.screenshot({path:'.qa/photo-owner-editor.png',fullPage:true});await page.getByRole('button',{name:'Save piece',exact:true}).click();await page.getByText('Product saved. Refresh the storefront to see your changes.').waitFor();
  const saved=(await call('/admin/overview')).products.find(p=>p.name==='Photo gallery browser test'&&p.active);assert.ok(saved);createdId=saved.id;assert.equal(saved.images.length,4);assert.ok(saved.images.every(i=>i.startsWith('/api/images/')));
  await page.goto('http://127.0.0.1:5173/',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'View Photo gallery browser test',exact:true}).click();assert.equal(await page.locator('.gallery-thumbnails button').count(),4);
  await page.getByRole('button',{name:'View product photo 3',exact:true}).click();assert.equal(await page.getByRole('button',{name:'View product photo 3',exact:true}).getAttribute('aria-pressed'),'true');assert.equal(await page.locator('.gallery-large').getAttribute('src'),`http://127.0.0.1:8787${saved.images[2]}`);
  await page.getByRole('button',{name:'Next product photo'}).click();assert.equal((await page.locator('.gallery-count').innerText()).trim(),'4 / 4');await page.getByRole('button',{name:'Previous product photo'}).click();assert.equal((await page.locator('.gallery-count').innerText()).trim(),'3 / 4');
  await page.waitForFunction(()=>document.querySelector('.gallery-large').complete&&document.querySelector('.gallery-large').naturalWidth>0);
  await page.screenshot({path:'.qa/photo-customer-gallery.png'});
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:'.qa/photo-customer-mobile.png'});
  assert.deepEqual(errors,[]);console.log('PASS: multi-file device uploads, edit/new product persistence, cover/reorder/removal, invalid-file feedback, customer gallery and mobile layout.');
 }finally{
  await browser.close();const data=await call('/admin/overview');const current=data.products.find(p=>p.id===original.id);await call(`/admin/products/${original.id}`,'PUT',{...original,expectedStock:current.stock,stock:current.stock});
  if(createdId){const created=data.products.find(p=>p.id===createdId);if(created)await call(`/admin/products/${createdId}`,'PUT',{...created,active:false,expectedStock:created.stock});}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
