import {productPhotos,MAX_SOURCE_PHOTO_BYTES,MAX_UPLOAD_PHOTO_BYTES} from './photos';
export const API_URL=(!import.meta.env.DEV&&location.pathname==='/admin'?location.origin:import.meta.env.VITE_API_URL||(import.meta.env.DEV?'http://127.0.0.1:8787':'')).replace(/\/$/,'');
export async function api(path,{method='GET',body,token}={}){
 if(!API_URL)throw new Error('The store service is not connected yet.');
 if(body&&path.startsWith('/admin/products')){const images=productPhotos(body).map(canonicalPhoto);body={...body,images,image:images[0]||''};}
 const response=await fetch(`${API_URL}/api${path}`,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(25000)});
 let data;try{data=await response.json();}catch{throw new Error('The store service is unavailable. Please try again later.');}
 if(!response.ok)throw new Error(data.error||'This request could not be completed.');if(Array.isArray(data.products))data.products=data.products.map(p=>{const images=productPhotos(p).map(photoUrl);return {...p,images,image:images[0]||p.image};});return data;
}
export function whatsappUrl(number,message){return /^[1-9][0-9]{9,14}$/.test(number||'')?`https://wa.me/${number}?text=${encodeURIComponent(message)}`:null;}
let razorpayScript;
export function loadRazorpay(){if(window.Razorpay)return Promise.resolve();if(!razorpayScript)razorpayScript=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://checkout.razorpay.com/v1/checkout.js';s.onload=resolve;s.onerror=()=>{razorpayScript=null;s.remove();reject(new Error('Payment checkout could not load. Check your connection and retry.'));};document.head.appendChild(s);});return razorpayScript;}

export function photoUrl(value){return value?.startsWith('/api/images/')?`${API_URL}${value}`:value;}
function canonicalPhoto(value){if(API_URL&&value.startsWith(`${API_URL}/api/images/`))return value.slice(API_URL.length);return value;}

async function preparePhoto(file){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Choose a JPG, PNG or WebP photo.');
 if(file.size>MAX_SOURCE_PHOTO_BYTES)throw new Error('Choose a photo smaller than 10 MB.');
 const url=URL.createObjectURL(file);const image=new Image();
 try{
  image.src=url;await image.decode();
  const width=image.naturalWidth,height=image.naturalHeight;
  if(!width||!height||width*height>40000000)throw new Error('This photo is too large to prepare. Choose a version under 40 megapixels.');
  const scale=Math.min(1,1600/Math.max(width,height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
  const context=canvas.getContext('2d');if(!context)throw new Error('This browser cannot prepare photos. Try a different browser.');context.drawImage(image,0,0,canvas.width,canvas.height);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',0.84));canvas.width=1;canvas.height=1;
  if(!blob||blob.size>MAX_UPLOAD_PHOTO_BYTES)throw new Error('This photo could not be made small enough. Choose a smaller version.');
  return blob;
 }catch(e){if(e.name==='EncodingError')throw new Error('This file could not be read as a photo. Try a different JPG, PNG or WebP image.');throw e;}finally{URL.revokeObjectURL(url);}
}
export async function uploadProductPhoto(file,token){
 if(!API_URL)throw new Error('The store service is not connected yet.');
 const blob=await preparePhoto(file);
 const response=await fetch(`${API_URL}/api/admin/images`,{method:'POST',headers:{'Content-Type':blob.type,...(token?{Authorization:`Bearer ${token}`}:{})},body:blob,signal:AbortSignal.timeout(60000)});
 let data;try{data=await response.json();}catch{throw new Error('Photo upload could not complete. Check the store service and try again.');}
 if(!response.ok)throw new Error(data.error||'Photo upload failed. Please try again.');return {...data,url:photoUrl(data.url)};
}
