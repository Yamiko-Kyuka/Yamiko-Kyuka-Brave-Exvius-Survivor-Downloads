import {effectiveVolume} from './audio-settings.js';
export const bossSoundVoices={
 'laser-charge':[.65,320,.15],laser:[.5,90,.45],cannon:[.10,135,.8],missile:[.23,520,.65],impact:[.30,75,.8],emp:[.4,160,.4],strike:[.24,95,.7],
 'cover-break':[.38,110,.95],'generator-break':[.50,600,.3],'servo-open':[.26,720,.2],'servo-break':[.34,180,.7],repair:[.42,440,.15],warning:[.22,880,.1]
};
/** Original procedural PCM, with bounded gain, soft edges and no external downloads. */
export function bossSoundData(id,sampleRate=44100){
 const [duration,base,mix]=bossSoundVoices[id]||bossSoundVoices.impact,data=new Float32Array(Math.ceil(duration*sampleRate));let seed=31,phase=0,low=0;
 for(const c of id)seed=(Math.imul(seed,31)+c.charCodeAt(0))>>>0;
 for(let i=0;i<data.length;i++){
  const t=i/sampleRate,u=t/duration;seed=(Math.imul(seed,1664525)+1013904223)>>>0;low+=.18*(seed/2147483648-1-low);
  const rise=id==='laser-charge'||id==='repair',frequency=base*(rise?.55+u*2:1.6-u*1.3);phase+=Math.PI*2*frequency/sampleRate;
  const envelope=Math.min(1,t/.008)*Math.min(1,(duration-t)/.035)*(rise?Math.sin(Math.PI*u)**.65:(1-u)**1.8);
  data[i]=envelope*((1-mix)*(Math.sin(phase)+Math.sin(phase*2.02)*.16)+mix*low)*.65;
 }return data;
}
export class BossAudio{
 constructor(){this.buffers=new Map();this.active=new Set();this.last=new Map();}
 prepare(context){
  if(!context)return;this.context=context;if(this.output)return;
  this.output=context.createGain();const limiter=context.createDynamicsCompressor();limiter.threshold.value=-20;limiter.ratio.value=5;this.output.connect(limiter);limiter.connect(context.destination);
  for(const id of Object.keys(bossSoundVoices)){const data=bossSoundData(id,context.sampleRate),buffer=context.createBuffer(1,data.length,context.sampleRate);buffer.copyToChannel(data,0);this.buffers.set(id,buffer);}
 }
 configure(options){if(this.output)this.output.gain.value=options?.sound?effectiveVolume(options,'combat')*.24:0;}
 play(id,options){
  this.configure(options);const ctx=this.context;if(!ctx||ctx.state!=='running'||!options?.sound||!effectiveVolume(options,'combat')||!this.buffers.has(id))return false;
  if(this.active.size>=8||ctx.currentTime-(this.last.get(id)??-1)<.07)return false;this.last.set(id,ctx.currentTime);
  const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=this.buffers.get(id);gain.gain.value=1/Math.sqrt(1+this.active.size*.3);source.connect(gain);gain.connect(this.output);this.active.add(source);source.onended=()=>{this.active.delete(source);source.disconnect();gain.disconnect();};source.start();return true;
 }
 stop(){for(const source of this.active)source.stop();this.active.clear();}
}
export function bossCastSound(type){return type==='scorpion-tail'?'laser':type==='scorpion-emp'?'emp':['fan','ring','spiral'].includes(type)?'cannon':['beam','cross','sides','nova'].includes(type)?'laser':['meteor','meteors','march'].includes(type)?'impact':'strike';}
