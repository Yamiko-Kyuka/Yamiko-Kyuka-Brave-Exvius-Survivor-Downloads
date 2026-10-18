import {effectiveVolume} from './audio-settings.js';

const voices={slash:[.14,750,.55],holy:[.20,620,.12],shot:[.10,180,.85],arrow:[.12,1150,.60],fire:[.19,190,.75],ice:[.18,1150,.20],burst:[.17,110,.75],wave:[.20,430,.50],thunder:[.15,920,.65],orb:[.20,340,.12],beam:[.18,560,.15],meteor:[.22,85,.80],boomerang:[.16,880,.40],orbit:[.19,490,.20]};
const identity=id=>[...id].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,17);
/** Small original PCM signatures: soft attack/release, no MP3 latency, one sound per weapon volley. */
export function weaponSoundData(weapon,sampleRate=44100){
 const [duration,base,noiseMix]=voices[weapon.kind]||voices.orb,seed=identity(weapon.id),pitch=.88+(seed%29)/100,count=Math.ceil(duration*sampleRate),data=new Float32Array(count);
 let noise=seed||1,phase=0,lastNoise=0;
 for(let i=0;i<count;i++){
  const t=i/sampleRate,u=t/duration;noise=(Math.imul(noise,1664525)+1013904223)>>>0;const n=noise/2147483648-1;lastNoise+=.24*(n-lastNoise);
  const frequency=base*pitch*(weapon.kind==='holy'||weapon.kind==='ice'?.85+u*.5:1.5-u*1.1);phase+=Math.PI*2*frequency/sampleRate;
  const tone=Math.sin(phase)+.18*Math.sin(phase*2.01),air=weapon.kind==='thunder'?n*.7:lastNoise;
  const envelope=Math.min(1,t/.008)*Math.pow(1-u,2.3)*Math.min(1,(duration-t)/.025);
  data[i]=envelope*((1-noiseMix)*tone+noiseMix*air)*.65;
 }
 return data;
}
export class WeaponAudio{
 constructor(){this.buffers=new Map();this.active=new Set();this.last=new Map();}
 prepare(context,weapons){
  if(!context)return;this.context=context;
  if(!this.output){this.output=context.createGain();this.output.gain.value=.13;const limiter=context.createDynamicsCompressor();limiter.threshold.value=-22;limiter.knee.value=15;limiter.ratio.value=5;this.output.connect(limiter);limiter.connect(context.destination);}
  for(const weapon of Object.values(weapons)){if(this.buffers.has(weapon.id))continue;const data=weaponSoundData(weapon,context.sampleRate),buffer=context.createBuffer(1,data.length,context.sampleRate);buffer.copyToChannel(data,0);this.buffers.set(weapon.id,buffer);}
 }
 play(weapon,options){
  const ctx=this.context,volume=effectiveVolume(options,'combat');if(!ctx||ctx.state!=='running'||!options?.sound||!volume||!this.buffers.has(weapon.id))return false;
  const now=ctx.currentTime;if(now-(this.last.get(weapon.id)??-1)<.045||this.active.size>=12)return false;this.last.set(weapon.id,now);
  const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=this.buffers.get(weapon.id);source.playbackRate.value=.98+(this.active.size%3)*.015;gain.gain.value=volume/Math.sqrt(1+this.active.size*.45);source.connect(gain);gain.connect(this.output);this.active.add(source);
  source.onended=()=>{this.active.delete(source);source.disconnect();gain.disconnect();};source.start();return true;
 }
 stop(){for(const source of this.active)source.stop();this.active.clear();}
}
