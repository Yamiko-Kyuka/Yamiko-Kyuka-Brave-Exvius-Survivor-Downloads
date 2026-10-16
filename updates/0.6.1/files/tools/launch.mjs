import net from 'node:net';
import {spawn} from 'node:child_process';
const port=await new Promise((resolve,reject)=>{const probe=net.createServer();probe.once('error',reject);probe.listen(0,'127.0.0.1',()=>{const port=probe.address().port;probe.close(()=>resolve(port));});});
process.env.PORT=String(port);process.env.HOST='127.0.0.1';
const {server}=await import('./server.mjs');
if(!server.listening)await new Promise((resolve,reject)=>{server.once('listening',resolve);server.once('error',reject);});
const url=`http://127.0.0.1:${port}/`;
if(process.argv.includes('--launcher'))console.log('BES_GAME '+JSON.stringify({url}));
if(!process.argv.includes('--launcher')){
const [command,args]=process.platform==='win32'?['cmd',['/c','start','',url]]:process.platform==='darwin'?['open',[url]]:['xdg-open',[url]];
spawn(command,args,{stdio:'ignore',windowsHide:true}).on('error',()=>console.log('Ouvrez le navigateur à cette adresse : '+url));
}
console.log('BRAVE EXVIUS SURVIVOR — '+url+'\nLaissez cette fenêtre ouverte pendant la partie. Ctrl+C pour arrêter.');
process.on('SIGINT',()=>server.close(()=>process.exit(0)));
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
