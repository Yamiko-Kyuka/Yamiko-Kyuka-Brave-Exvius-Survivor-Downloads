import {readFile,mkdir,stat,rename,unlink} from 'node:fs/promises';
import {createReadStream,createWriteStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {Readable,Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

export async function verifyFile(file,entry){try{if((await stat(file)).size!==entry.bytes)return false;const hash=createHash('sha256');for await(const chunk of createReadStream(file))hash.update(chunk);return hash.digest('hex')===entry.sha256;}catch(error){if(error.code==='ENOENT')return false;throw error;}}
async function fileSize(file){try{return (await stat(file)).size;}catch(e){if(e.code==='ENOENT')return 0;throw e;}}
function problem(message,code,retryable=true){return Object.assign(new Error(message),{code,retryable});}
export function describeError(error){const cause=error.cause||error;const code=error.code||cause.code||cause.errors?.[0]?.code||'';const messages={ENOSPC:'Espace disque insuffisant.',EACCES:'Accès au dossier refusé par Windows.',EPERM:'Le fichier est bloqué ou le dossier est protégé.',ENOTFOUND:'Le serveur ne peut pas être trouvé. Vérifiez la connexion.',EAI_AGAIN:'Le serveur ne peut pas être trouvé pour le moment.',ECONNRESET:'La connexion a été coupée.',ETIMEDOUT:'La connexion ne répond plus.',UND_ERR_CONNECT_TIMEOUT:'Le serveur ne répond pas.',UND_ERR_SOCKET:'La connexion a été coupée.',CERT_HAS_EXPIRED:'Le certificat du serveur est expiré.',UNABLE_TO_VERIFY_LEAF_SIGNATURE:'Le certificat du serveur ne peut pas être vérifié.',DEPTH_ZERO_SELF_SIGNED_CERT:'Le certificat du serveur ne peut pas être vérifié.'};const text=messages[code]||[error.message,cause!==error?cause.message:''].filter(Boolean).join(' — ');return (code?code+' : ':'')+text.replace(/(https?:\/\/)[^/\s@]+@/g,'$1[identifiants]@');}
function canRetry(error){const code=error.code||error.cause?.code;return error.retryable!==false&&!['ENOSPC','EACCES','EPERM','CERT_HAS_EXPIRED','UNABLE_TO_VERIFY_LEAF_SIGNATURE','DEPTH_ZERO_SELF_SIGNED_CERT'].includes(code);}
function retryAfter(response){const value=response.headers.get('retry-after');if(!value)return 0;const seconds=Number(value);return Math.min(30000,Math.max(0,Number.isFinite(seconds)?seconds*1000:Date.parse(value)-Date.now()));}

export async function installResources(root,{entries=null,fetchResource=fetch,concurrency=1,maxAttempts=4,idleTimeoutMs=120000,retryDelayMs=2000,sleep=delay,log=console.log,onProgress=()=>{}}={}){
 root=path.resolve(root);entries??=JSON.parse(await readFile(path.join(root,'assets/download-report.json'),'utf8'));concurrency=Math.max(1,Math.min(3,Math.floor(concurrency)||1));maxAttempts=Math.max(1,Math.floor(maxAttempts)||1);
 let cursor=0,completed=0,downloaded=0,verifiedBytes=0,stopped=false;const failures=[],received=new Map(),pending=[];
 const totalBytes=entries.reduce((n,e)=>n+e.bytes,0);
 function progress(phase,extra={}){onProgress({phase,completed,total:entries.length,downloaded,verifiedBytes,totalBytes,receivedBytes:verifiedBytes+[...received.values()].reduce((a,b)=>a+b,0),...extra});}
 function paths(entry){const destination=path.resolve(root,entry.file);if(!destination.startsWith(root+path.sep))throw problem('Chemin de ressource invalide.','INVALID_PATH',false);return {destination,temporary:destination+'.part'};}
 async function promote(entry,destination,temporary){try{await stat(destination);await rename(destination,destination+'.local-backup-'+Date.now());}catch(error){if(error.code!=='ENOENT')throw error;}await rename(temporary,destination);received.delete(entry.file);verifiedBytes+=entry.bytes;completed++;progress('verifying');}
 // Verify the complete library first, so retries skip every valid original and account for partial bytes.
 progress('checking');
 for(const entry of entries){const {destination,temporary}=paths(entry);if(await verifyFile(destination,entry)){completed++;verifiedBytes+=entry.bytes;progress('checking');continue;}
  const size=await fileSize(temporary);if(size===entry.bytes&&await verifyFile(temporary,entry)){await promote(entry,destination,temporary);continue;}
  if(size>=entry.bytes&&size>0){await unlink(temporary);received.delete(entry.file);}else if(size>0)received.set(entry.file,size);
  pending.push(entry);progress('checking');
 }
 async function transfer(entry,destination,temporary){
  let offset=await fileSize(temporary);if(offset>=entry.bytes){if(offset===entry.bytes&&await verifyFile(temporary,entry)){await promote(entry,destination,temporary);return;}await unlink(temporary);offset=0;received.delete(entry.file);}
  const url=new URL(entry.url,'https://www.spriters-resource.com');if(url.protocol!=='https:'||url.hostname!=='www.spriters-resource.com')throw problem('Source de ressource invalide.','INVALID_URL',false);
  const controller=new AbortController();let timer,response;const arm=()=>{clearTimeout(timer);timer=setTimeout(()=>controller.abort(problem('La connexion ne répond plus.','ETIMEDOUT')),idleTimeoutMs);};
  try{
   arm();const headers={'User-Agent':'BraveExviusSurvivor-AssetImport/0.3.4','Accept-Encoding':'identity'};if(offset)headers.Range=`bytes=${offset}-`;
   response=await fetchResource(url,{headers,signal:controller.signal});arm();
   if(response.status===416){await unlink(temporary).catch(()=>{});received.delete(entry.file);throw problem('Le serveur a refusé la reprise ; le fichier sera retéléchargé.','INVALID_RANGE');}
   if(!response.ok){const code='HTTP_'+response.status;const error=problem(`Le serveur a répondu HTTP ${response.status}.`,code,[408,425,429,500,502,503,504].includes(response.status));error.retryAfterMs=retryAfter(response);throw error;}
   let range;
   if(response.status===206){range=/^bytes (\d+)-(\d+)\/(\d+)$/.exec(response.headers.get('content-range')||'');if(!range||Number(range[1])!==offset||Number(range[3])!==entry.bytes||Number(range[2])<offset||Number(range[2])>=entry.bytes)throw problem('Réponse de reprise invalide.','INVALID_RANGE');}
   else if(offset){offset=0;received.delete(entry.file);}
   if(!response.body)throw problem('Le serveur n’a pas transmis le fichier.','EMPTY_RESPONSE');
   let size=offset;
   const checker=new Transform({transform(chunk,encoding,callback){arm();size+=chunk.length;if(size>entry.bytes){callback(problem('La taille du fichier reçu est incorrecte.','INVALID_SIZE'));return;}received.set(entry.file,size);progress('downloading');callback(null,chunk);}});
   await pipeline(Readable.fromWeb(response.body),checker,createWriteStream(temporary,{flags:offset?'a':'w'}),{signal:controller.signal});
   if(range&&size!==Number(range[2])+1)throw problem('Le transfert a été coupé avant la fin.','INCOMPLETE_DOWNLOAD');
   if(size!==entry.bytes)throw problem('Le transfert a été coupé avant la fin.','INCOMPLETE_DOWNLOAD');
   clearTimeout(timer);progress('verifying');if(!await verifyFile(temporary,entry))throw problem('L’intégrité du fichier téléchargé est incorrecte ; il sera retéléchargé.','CHECKSUM_MISMATCH');
   downloaded++;await promote(entry,destination,temporary);
  }catch(error){
   const reason=controller.signal.aborted?controller.signal.reason:error;
   if(['CHECKSUM_MISMATCH','INVALID_SIZE','INVALID_RANGE'].includes(reason.code)){await unlink(temporary).catch(()=>{});received.delete(entry.file);}else{const size=await fileSize(temporary);if(size)received.set(entry.file,Math.min(size,entry.bytes));}
   throw reason;
  }finally{clearTimeout(timer);controller.abort();if(response?.body)await response.body.cancel().catch(()=>{});}
 }
 async function one(entry){const {destination,temporary}=paths(entry);await mkdir(path.dirname(destination),{recursive:true});for(let attempt=1;attempt<=maxAttempts;attempt++){
  try{await transfer(entry,destination,temporary);return;}catch(error){if(attempt===maxAttempts||!canRetry(error))throw error;const wait=Math.max(Math.min(30000,retryDelayMs*2**(attempt-1)),error.retryAfterMs||0);log(`Reprise ${attempt+1}/${maxAttempts} : ${entry.name} — ${describeError(error)}`);progress('retrying',{attempt:attempt+1,maxAttempts,retryIn:wait/1000,message:describeError(error)});await sleep(wait);}
 }}
 async function worker(){while(!stopped&&cursor<pending.length){const entry=pending[cursor++];try{await one(entry);if(completed<=6||completed%25===0||completed===entries.length)log(`${completed} / ${entries.length} ressources vérifiées · ${downloaded} téléchargées`);}catch(error){stopped=true;failures.push({name:entry.name,error});log('Échec : '+entry.name+' — '+describeError(error));}}}
 await Promise.all(Array.from({length:Math.min(concurrency,pending.length)},worker));if(failures.length){const first=failures[0];throw Object.assign(new Error(`${first.name} — ${describeError(first.error)} Les fichiers complets et partiels sont conservés. Cliquez sur Réessayer pour reprendre.`),{cause:first.error,code:first.error.code});}
 progress('complete');return {completed,downloaded};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=fileURLToPath(new URL('../',import.meta.url)),launcher=process.argv.includes('--launcher');let lastProgress=0;
 const send=value=>console.log('BES_PROGRESS '+JSON.stringify(value));
 if(!launcher)console.log('BRAVE EXVIUS SURVIVOR — préparation de la bibliothèque complète');
 try{await installResources(root,{log:launcher?message=>console.error(message):console.log,onProgress:launcher?p=>{const now=Date.now();if(now-lastProgress>=150||['complete','retrying'].includes(p.phase)){lastProgress=now;send(p);}}:undefined});
 if(launcher)send({phase:'ready'});else{console.log('Bibliothèque complète vérifiée. Démarrage du jeu…');await import('./launch.mjs');}
 }catch(error){if(launcher)send({phase:'error',message:error.message,code:error.code||error.cause?.code||''});else console.error(error.message);process.exitCode=1;}
}
