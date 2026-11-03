import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {IMAGE_KEY} from './images.js';

// The same interface as the R2 methods used by the Worker. Files never touch public/ or source code.
export function localImageStore(directory) {
  return {
    async put(key,bytes){if(!IMAGE_KEY.test(key))throw Error('Invalid photo key');await mkdir(directory,{recursive:true});await writeFile(join(directory,key),bytes,{flag:'wx'});},
    async get(key){if(!IMAGE_KEY.test(key))return null;try{return {body:await readFile(join(directory,key))};}catch(e){if(e.code==='ENOENT')return null;throw e;}}
  };
}
