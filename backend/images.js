import {fail} from './commerce.js';
import {MAX_UPLOAD_PHOTO_BYTES} from '../src/photos.js';

export const IMAGE_KEY = /^[a-f0-9-]{36}\.(?:jpg|png|webp)$/;
const ascii = (bytes, start, count) => String.fromCharCode(...bytes.slice(start, start + count));

// Inspect raster headers independently of the filename or browser-supplied MIME type.
export function inspectImage(bytes) {
  if (!bytes.length) fail(400, 'Choose a photo to upload.');
  if (bytes.length > MAX_UPLOAD_PHOTO_BYTES) fail(413, 'This photo is too large. Choose a smaller image.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let type, ext, width, height;
  if (bytes.length >= 45 && bytes.slice(0,8).every((v,i)=>v===[137,80,78,71,13,10,26,10][i]) && ascii(bytes,12,4)==='IHDR' && ascii(bytes,bytes.length-8,4)==='IEND') {
    type='image/png'; ext='png'; width=view.getUint32(16); height=view.getUint32(20);
  } else if (bytes.length >= 30 && ascii(bytes,0,4)==='RIFF' && ascii(bytes,8,4)==='WEBP' && view.getUint32(4,true)+8===bytes.length) {
    type='image/webp'; ext='webp';
    const chunk=ascii(bytes,12,4);
    if(chunk==='VP8X') {width=1+bytes[24]+(bytes[25]<<8)+(bytes[26]<<16);height=1+bytes[27]+(bytes[28]<<8)+(bytes[29]<<16);}
    else if(chunk==='VP8 ' && bytes[23]===157 && bytes[24]===1 && bytes[25]===42){width=view.getUint16(26,true)&16383;height=view.getUint16(28,true)&16383;}
    else if(chunk==='VP8L' && bytes[20]===47){const bits=view.getUint32(21,true);width=(bits&16383)+1;height=((bits>>>14)&16383)+1;}
  } else if (bytes.length >= 32 && bytes[0]===255 && bytes[1]===216 && bytes.at(-2)===255 && bytes.at(-1)===217) {
    type='image/jpeg'; ext='jpg'; let offset=2;
    while(offset+4<bytes.length) {
      if(bytes[offset++]!==255) break;
      while(bytes[offset]===255) offset++;
      const marker=bytes[offset++];
      if(marker===0xda||marker===0xd9)break;
      if(marker===0x01||(marker>=0xd0&&marker<=0xd7))continue;
      if(offset+2>bytes.length)break;
      const length=view.getUint16(offset);
      if(length<2||offset+length>bytes.length)break;
      if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)&&length>=8){height=view.getUint16(offset+3);width=view.getUint16(offset+5);break;}
      offset+=length;
    }
  }
  if(!type||!width||!height)fail(415,'Choose a valid JPG, PNG or WebP photo. SVG, HEIC and other files are not supported.');
  if(width>4096||height>4096||width*height>16000000)fail(400,'This image has too many pixels. Use the photo picker to prepare a smaller version.');
  return {type,ext,width,height};
}

export async function uploadImage(request, storage) {
  if(!storage)fail(503,'Photo storage is not connected yet. Please ask the developer to connect it.');
  if(!['image/jpeg','image/png','image/webp'].includes(request.headers.get('Content-Type')?.split(';')[0]))fail(415,'Choose a JPG, PNG or WebP photo.');
  if(Number(request.headers.get('Content-Length'))>MAX_UPLOAD_PHOTO_BYTES)fail(413,'This photo is too large.');
  const reader=request.body?.getReader();if(!reader)fail(400,'Choose a photo to upload.');
  const chunks=[];let size=0;
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>MAX_UPLOAD_PHOTO_BYTES){await reader.cancel();fail(413,'This photo is too large.');}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  const image=inspectImage(bytes);const key=`${crypto.randomUUID()}.${image.ext}`;
  await storage.put(key,bytes,{httpMetadata:{contentType:image.type,cacheControl:'public, max-age=31536000, immutable'}});
  return {url:`/api/images/${key}`,width:image.width,height:image.height};
}

export async function serveImage(request, storage, headers={}) {
  const key=new URL(request.url).pathname.slice('/api/images/'.length);
  if(!IMAGE_KEY.test(key)||!storage)fail(404,'Photo not found.');
  const object=await storage.get(key);if(!object)fail(404,'Photo not found.');
  const etag=object.httpEtag;
  const responseHeaders={'Content-Type':({'jpg':'image/jpeg','png':'image/png','webp':'image/webp'})[key.split('.').pop()],'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",...headers,...(etag?{ETag:etag}:{})};
  if(etag&&request.headers.get('If-None-Match')===etag)return new Response(null,{status:304,headers:responseHeaders});
  return new Response(request.method==='HEAD'?null:object.body,{headers:responseHeaders});
}
