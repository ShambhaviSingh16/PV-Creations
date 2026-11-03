import React,{useState} from 'react';
import {ChevronLeft,ChevronRight} from 'lucide-react';
import {productPhotos} from './photos';

export default function ProductGallery({product}) {
  const photos=productPhotos(product);const [index,setIndex]=useState(0);
  const current=Math.min(index,Math.max(0,photos.length-1));
  return <div className="product-gallery" aria-label={`${product.name} photo gallery`}>
    <div className="gallery-main">
      <img className="gallery-large" src={photos[current]} alt={`${product.name} — photo ${current+1} of ${photos.length}`}/>
      {photos.length>1&&<><button className="gallery-previous" type="button" aria-label="Previous product photo" onClick={()=>setIndex((current-1+photos.length)%photos.length)}><ChevronLeft size={21}/></button><button className="gallery-next" type="button" aria-label="Next product photo" onClick={()=>setIndex((current+1)%photos.length)}><ChevronRight size={21}/></button><span className="gallery-count" aria-live="polite">{current+1} / {photos.length}</span></>}
    </div>
    {photos.length>1&&<div className="gallery-thumbnails" aria-label="Choose a product photo">{photos.map((url,i)=><button type="button" key={url} className={i===current?'selected':''} aria-pressed={i===current} aria-label={`View product photo ${i+1}`} onClick={()=>setIndex(i)}><img src={url} alt=""/></button>)}</div>}
  </div>;
}
