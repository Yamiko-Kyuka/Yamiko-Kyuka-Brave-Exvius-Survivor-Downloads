import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import pngjs from './vendor/pngjs/lib/png.js';
const {PNG}=pngjs;
/** Decode one original atlas at a time; persist only tiles actually requested. */
export function createTileGenerator(root,index,readResource){let descriptors=null,atlasId=null,atlasPromise=null;const pending=new Map();
 async function clips(){if(!descriptors){descriptors=(async()=>{const map=new Map(),catalog=JSON.parse(await readFile(path.join(root,'assets/animation-catalog.json'),'utf8'));for(const entity of catalog){const data=JSON.parse(await readFile(path.join(root,entity.manifest),'utf8'));for(const variant of data.variants)for(const list of Object.values(variant.animations))for(const clip of list)for(const tile of clip.tiles||[])map.set(tile.resource,{source:clip.resource,x:tile.colStart*clip.fw,y:tile.rowStart*clip.fh,w:tile.cols*clip.fw,h:tile.rows*clip.fh});}return map;})();}return descriptors;}
 async function generate(id){const spec=(await clips()).get(id),item=index[id];if(!spec||!item?.derived)throw Error('Unknown generated tile');if(atlasId!==spec.source){atlasId=spec.source;atlasPromise=readResource(spec.source).then(data=>PNG.sync.read(data,{skipRescale:false}));}const original=await atlasPromise;if(spec.x+spec.w>original.width||spec.y+spec.h>original.height)throw Error('Invalid tile rectangle');const tile=new PNG({width:spec.w,height:spec.h});for(let row=0;row<spec.h;row++){const begin=((spec.y+row)*original.width+spec.x)*4;original.data.copy(tile.data,row*spec.w*4,begin,begin+spec.w*4);}const data=PNG.sync.write(tile,{colorType:6});const destination=path.resolve(root,item.archive);if(!destination.startsWith(root))throw Error('Invalid tile path');await mkdir(path.dirname(destination),{recursive:true});await writeFile(destination,data);return data;}
 return id=>{if(!pending.has(id))pending.set(id,generate(id).finally(()=>pending.delete(id)));return pending.get(id);};
}
