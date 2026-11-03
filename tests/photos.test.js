import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';
import {sqliteAdapter} from '../backend/sqlite-adapter.js';
import {createApp} from '../backend/app.js';
import {localImageStore} from '../backend/local-image-store.js';
import {inspectImage} from '../backend/images.js';
import {sampleProducts} from '../src/catalog.js';
import {MAX_UPLOAD_PHOTO_BYTES} from '../src/photos.js';

const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
const ownerHeaders={Authorization:'Bearer photo-test-owner'};
async function setup(){
 const directory=await mkdtemp(join(tmpdir(),'pv-photos-'));
 const db=sqliteAdapter();db.exec(readFileSync(new URL('../backend/schema.sql',import.meta.url),'utf8'));
 const storage=localImageStore(directory),env={DEVELOPMENT_ADMIN_TOKEN:'photo-test-owner',PRODUCT_IMAGES:storage};
 return {db,storage,directory,app:createApp({db,env,local:true}),async close(){db.close();assert.ok(resolve(directory).startsWith(resolve(tmpdir())+sep)&&basename(directory).startsWith('pv-photos-'));await rm(directory,{recursive:true,force:true});}};
}
const request=(path,options={})=>new Request(`http://local${path}`,options);
async function upload(app){const response=await app(request('/api/admin/images',{method:'POST',headers:{...ownerHeaders,'Content-Type':'image/png'},body:png}));assert.equal(response.status,201);return response.json();}

test('photo uploads require owner authentication; raster contents are checked, not filename or MIME alone',async()=>{const fixture=await setup();try{
 assert.equal((await fixture.app(request('/api/admin/images',{method:'POST',headers:{'Content-Type':'image/png'},body:png}))).status,401);
 const bad=await fixture.app(request('/api/admin/images',{method:'POST',headers:{...ownerHeaders,'Content-Type':'image/png'},body:'<svg onload="alert(1)"></svg>'}));assert.equal(bad.status,415);
 const svg=await fixture.app(request('/api/admin/images',{method:'POST',headers:{...ownerHeaders,'Content-Type':'image/svg+xml'},body:'<svg/>'}));assert.equal(svg.status,415);
 const photo=await upload(fixture.app);assert.match(photo.url,/^\/api\/images\/[a-f0-9-]{36}\.png$/);assert.equal(photo.width,1);assert.equal(photo.height,1);
}finally{await fixture.close();}});

test('uploaded bytes persist and public serving is restricted to generated raster keys',async()=>{const fixture=await setup();try{
 const photo=await upload(fixture.app);const response=await fixture.app(request(photo.url));assert.equal(response.status,200);assert.equal(response.headers.get('Content-Type'),'image/png');assert.equal(response.headers.get('X-Content-Type-Options'),'nosniff');assert.deepEqual(Buffer.from(await response.arrayBuffer()),png);
 const reopened=localImageStore(fixture.directory);assert.deepEqual(Buffer.from((await reopened.get(photo.url.split('/').pop())).body),png);
 assert.equal((await fixture.app(request('/api/images/not-a-photo.svg'))).status,404);
 assert.equal((await fixture.app(request('/api/images/00000000-0000-0000-0000-000000000000.png'))).status,404);
 const head=await fixture.app(request(photo.url,{method:'HEAD'}));assert.equal(head.status,200);assert.equal((await head.arrayBuffer()).byteLength,0);
}finally{await fixture.close();}});

test('oversized and oversized-dimension uploads are rejected; missing storage fails clearly',async()=>{const fixture=await setup();try{
 assert.throws(()=>inspectImage(new Uint8Array(MAX_UPLOAD_PHOTO_BYTES+1)),e=>e.status===413);
 const huge=Uint8Array.from(png);new DataView(huge.buffer).setUint32(16,99999);assert.throws(()=>inspectImage(huge),e=>e.status===400);
 const noStorage=createApp({db:fixture.db,env:{DEVELOPMENT_ADMIN_TOKEN:'photo-test-owner'},local:true});
 const result=await noStorage(request('/api/admin/images',{method:'POST',headers:{...ownerHeaders,'Content-Type':'image/png'},body:png}));assert.equal(result.status,503);
 const over=await fixture.app(request('/api/admin/images',{method:'POST',headers:{...ownerHeaders,'Content-Type':'image/png','Content-Length':String(MAX_UPLOAD_PHOTO_BYTES+1)},body:png}));assert.equal(over.status,413);
}finally{await fixture.close();}});

test('new and existing products save more than three photos, ordered cover, removals, and legacy images',async()=>{const fixture=await setup();try{
 const images=[];for(let i=0;i<5;i++)images.push((await upload(fixture.app)).url);
 const data={...sampleProducts[0],images,image:images[4],active:true,stock:8};
 const create=await fixture.app(request('/api/admin/products',{method:'POST',headers:{...ownerHeaders,'Content-Type':'application/json'},body:JSON.stringify(data)}));assert.equal(create.status,201);const {id}=await create.json();
 let store=await (await fixture.app(request('/api/store'))).json();let product=store.products.find(p=>p.id===id);assert.deepEqual(product.images,images);assert.equal(product.image,images[0]);
 const ordered=[images[3],images[0],images[2],images[1]];
 const edit=await fixture.app(request(`/api/admin/products/${id}`,{method:'PUT',headers:{...ownerHeaders,'Content-Type':'application/json'},body:JSON.stringify({...data,images:ordered,expectedStock:8})}));assert.equal(edit.status,200);
 store=await (await fixture.app(request('/api/store'))).json();product=store.products.find(p=>p.id===id);assert.deepEqual(product.images,ordered);assert.equal(product.image,images[3]);
 const overflow=await fixture.app(request('/api/admin/products',{method:'POST',headers:{...ownerHeaders,'Content-Type':'application/json'},body:JSON.stringify({...data,images:Array(9).fill(images[0])})}));assert.equal(overflow.status,400);
 const empty=await fixture.app(request('/api/admin/products',{method:'POST',headers:{...ownerHeaders,'Content-Type':'application/json'},body:JSON.stringify({...data,image:'',images:[]})}));assert.equal(empty.status,400);
 const legacy=await fixture.app(request('/api/admin/products',{method:'POST',headers:{...ownerHeaders,'Content-Type':'application/json'},body:JSON.stringify({...sampleProducts[0],active:true})}));assert.equal(legacy.status,201);
}finally{await fixture.close();}});
