import React,{useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ImagePlus,Trash2} from 'lucide-react';
import {uploadProductPhoto} from './store-api';
import {MAX_PRODUCT_PHOTOS,MAX_SOURCE_PHOTO_BYTES} from './photos';

export default function PhotoEditor({images,onChange,token,disabled,onBusy}) {
  const input=useRef(null),uploadLock=useRef(false);
  const [progress,setProgress]=useState(null),[errors,setErrors]=useState([]);
  const working=!!progress,locked=disabled||working;
  async function addFiles(files) {
    if(locked||uploadLock.current)return;
    const selected=[...files];if(!selected.length)return;
    if(images.length+selected.length>MAX_PRODUCT_PHOTOS){setErrors([`You can have up to ${MAX_PRODUCT_PHOTOS} photos. Remove a photo or select fewer files.`]);return;}
    uploadLock.current=true;onBusy(true);setErrors([]);setProgress({done:0,total:selected.length});
    let next=[...images];const problems=[];
    try {
      for(let index=0;index<selected.length;index++) {
        const file=selected[index];
        try {
          if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Choose a JPG, PNG or WebP image. Convert HEIC photos to JPG first.');
          if(file.size>MAX_SOURCE_PHOTO_BYTES)throw Error('Choose a photo smaller than 10 MB.');
          const photo=await uploadProductPhoto(file,token);
          next=[...next,photo.url];onChange(next);
        }catch(e){problems.push(`${file.name}: ${e.message}`);}
        setProgress({done:index+1,total:selected.length});
      }
    }finally{setErrors(problems);setProgress(null);uploadLock.current=false;onBusy(false);if(input.current)input.current.value='';}
  }
  function move(index,delta){const next=[...images];[next[index],next[index+delta]]=[next[index+delta],next[index]];onChange(next);}
  function cover(index){onChange([images[index],...images.filter((_,i)=>i!==index)]);}
  return <fieldset className="photo-editor" disabled={disabled}>
    <legend>Product photos <span>({images.length}/{MAX_PRODUCT_PHOTOS})</span></legend>
    <p className="photo-help">Choose up to eight photos from your phone or computer. The first photo is the cover shown in the shop.</p>
    <div className={`photo-dropzone ${locked?'is-busy':''}`} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();addFiles(e.dataTransfer.files);}}>
      <ImagePlus size={28}/>
      <label className="photo-picker-label" htmlFor="product-photo-files">Choose photos from device</label>
      <input ref={input} id="product-photo-files" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={locked||images.length>=MAX_PRODUCT_PHOTOS} onChange={e=>addFiles(e.target.files)}/>
      <p>Or drop photos here · JPG, PNG or WebP · up to 10 MB each</p>
      <small>Photos are resized for faster loading before upload.</small>
    </div>
    {progress&&<div className="photo-progress" role="status"><span>Uploading photos: {progress.done} of {progress.total}</span><progress aria-label="Photo upload progress" value={progress.done} max={progress.total}/></div>}
    {!!errors.length&&<div role="alert" className="form-error"><strong>Some photos could not be added.</strong><ul>{errors.map((error,i)=><li key={i}>{error}</li>)}</ul><p>Successfully uploaded photos are kept. You can retry the others.</p></div>}
    {images.length>0?<ol className="photo-editor-grid">{images.map((url,index)=><li key={url}>
      <div className="photo-preview"><img src={url} alt={`Product photo ${index+1}`}/><span>{index===0?'Cover photo':`Photo ${index+1}`}</span></div>
      <div className="photo-reorder"><button type="button" disabled={locked||index===0} aria-label={`Move photo ${index+1} earlier`} onClick={()=>move(index,-1)}><ArrowLeft size={16}/></button><button type="button" disabled={locked||index===images.length-1} aria-label={`Move photo ${index+1} later`} onClick={()=>move(index,1)}><ArrowRight size={16}/></button><button className="remove-photo" type="button" disabled={locked} aria-label={`Remove photo ${index+1}`} onClick={()=>onChange(images.filter((_,i)=>i!==index))}><Trash2 size={16}/></button></div>
      <button className="cover-photo-button" type="button" disabled={locked||index===0} onClick={()=>cover(index)}>{index===0?'Current cover':`Use photo ${index+1} as cover`}</button>
    </li>)}</ol>:<p className="photo-help">Add at least one photo before saving this product. You can add detail shots, different angles and size comparisons.</p>}
  </fieldset>;
}
