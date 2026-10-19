import {effectiveVolume} from './audio-settings.js';
const AUDIO_REVISION='0.5.6';
export const musicTracks={
 menu:{file:'menu.mp3',title:'Menu theme'},
 midgar:{file:'midgar.mp3',title:'Final Fantasy VII OST — Battle Theme'},
 zanarkand:{file:'zanarkand.mp3',title:'Zanarkand map'},
 'dark-world':{file:'dark-world.mp3',title:'Dark world'},
 'crystal-tower':{file:'crystal-tower.mp3',title:'cristal tower'},
 victory:{file:'victory.mp3',title:'Victory lap',loop:false}
};
export const audioUrl=file=>'/assets/music/'+file+'?v='+AUDIO_REVISION;
/** Zone IDs always resolve to their dedicated track, including supplied MP3s. */
export class BattleMusic {
 constructor(){this.audio=new Audio();this.audio.loop=true;this.audio.preload='auto';this.stage=null;this.track=null;this.error=null;this.options={music:true,musicVolume:.4};this.audio.onerror=()=>{this.error='La musique « '+(this.track?.title||'')+' » ne peut pas être lue.';};}
 async play(stage,options){
  const track=musicTracks[stage.id]||{file:stage.musicFile||stage.id+'.ogg',title:stage.name||stage.id,loop:stage.loop};
  this.options=options;this.audio.loop=track.loop!==false;
  if(this.stage!==stage.id||this.track?.file!==track.file){this.stage=stage.id;this.track=track;this.error=null;this.audio.src=audioUrl(track.file);this.audio.load();}
  this.audio.volume=effectiveVolume(options,'music');
  if(!options.music){this.audio.pause();return;}
  try{await this.audio.play();}catch{return false;}
  return true;
 }
 playMenu(options){return this.play({id:'menu'},options);}
 playVictory(options){return this.play({id:'victory'},options);}
 configure(options){this.options=options;this.audio.volume=effectiveVolume(options,'music');if(!options.music)this.audio.pause();else if(this.stage&&!this.audio.ended)this.audio.play().catch(()=>{});}
 stop(){this.audio.pause();this.stage=null;this.track=null;this.audio.removeAttribute('src');this.audio.load();}
}
/** Locate the audible part of an uploaded clip without altering its original file. */
export function audibleWindow(buffer,threshold=.003){
 let first=buffer.length,last=-1;
 for(let channel=0;channel<buffer.numberOfChannels;channel++){
  const samples=buffer.getChannelData(channel);let i=0,j=samples.length-1;
  while(i<first&&Math.abs(samples[i])<=threshold)i++;first=Math.min(first,i);
  while(j>last&&Math.abs(samples[j])<=threshold)j--;last=Math.max(last,j);
 }
 if(last<first)return {offset:0,duration:0};
 const start=Math.max(0,first/buffer.sampleRate-.003),end=Math.min(buffer.duration,(last+1)/buffer.sampleRate+.03);
 return {offset:start,duration:end-start};
}
/** A quiet, short crystal chime, prepared once with no network or MP3 latency. */
function menuHoverClip(context){
 const rate=context.sampleRate,buffer=context.createBuffer(1,Math.ceil(rate*.14),rate),samples=buffer.getChannelData(0);
 for(let i=0;i<samples.length;i++){
  const t=i/rate,envelope=Math.min(1,t/.002)*Math.exp(-t*42)*Math.min(1,(.14-t)/.012);
  samples[i]=envelope*(.075*Math.sin(2*Math.PI*1568*t)+.022*Math.sin(2*Math.PI*3136*t)+.009*Math.sin(2*Math.PI*4704*t));
 }
 return {buffer,offset:0,duration:buffer.duration};
}
/** Quiet glass chime: inharmonic partials decay separately, with no piercing sustained tone. */
export function experiencePickupSamples(sampleRate=44100,step=0){
 const duration=.16,frequency=1320*2**([0,2,4,7,9][step%5]/12),samples=new Float32Array(Math.ceil(sampleRate*duration));
 for(let i=0;i<samples.length;i++){
  const t=i/sampleRate,u=t/duration,edge=Math.min(1,t/.0025)*(1-u)**2,phase=2*Math.PI*frequency*t;
  samples[i]=edge*(.04*Math.exp(-t*17)*Math.sin(phase)+.014*Math.exp(-t*36)*Math.sin(phase*2.73)+.005*Math.exp(-t*58)*Math.sin(phase*4.11));
 }
 return samples;
}
/** Short effects are fetched and decoded before interaction, then started directly on the audio clock. */
export class SoundEffects {
 constructor(context=null){this.context=context;this.buffers=new Map();this.channels=new Map();this.pending=null;this.error=null;this.lastHover=-Infinity;this.lastExperience=-Infinity;this.experienceStep=0;this.output=null;}
 prepare(){
  if(this.pending)return this.pending;
  this.pending=(async()=>{
   try{this.context??=new (globalThis.AudioContext||globalThis.webkitAudioContext)({latencyHint:'interactive'});}catch{return;}
   this.buffers.set('menu-hover',menuHoverClip(this.context));
   for(let step=0;step<5;step++){const samples=experiencePickupSamples(this.context.sampleRate,step),buffer=this.context.createBuffer(1,samples.length,this.context.sampleRate);buffer.getChannelData(0).set(samples);this.buffers.set('xp-'+step,{buffer,offset:0,duration:buffer.duration});}
   await Promise.all(['menu-click','level-up'].map(async id=>{
    try{const response=await fetch(audioUrl(id+'.mp3'));if(!response.ok)throw Error('HTTP '+response.status);const buffer=await this.context.decodeAudioData(await response.arrayBuffer());this.buffers.set(id,{buffer,...audibleWindow(buffer)});}catch(error){this.error='Un bruitage ne peut pas être chargé.';console.error('Bruitages :',id,error);}
   }));
  })();return this.pending;
 }
 unlock(){this.prepare();if(this.context?.state==='suspended')return this.context.resume().catch(()=>{});return Promise.resolve();}
 hover(options){
  if(!options.sound||this.context?.state!=='running')return false;
  const now=this.context.currentTime;if(now-this.lastHover<.09)return false;
  const played=this.play('menu-hover',options);if(played)this.lastHover=now;return played;
 }
 experience(options){
  const ctx=this.context;if(!options?.sound||ctx?.state!=='running'||!effectiveVolume(options,'sound'))return false;
  const gap=ctx.currentTime-this.lastExperience;if(gap<.18)return false;
  if(gap>.8)this.experienceStep=0;
  const played=this.play('xp-'+this.experienceStep,options);if(played){this.lastExperience=ctx.currentTime;this.experienceStep=(this.experienceStep+1)%5;}return played;
 }
 play(id,options){
  if(!options.sound)return false;
  const clip=this.buffers.get(id);if(!clip||!clip.duration)return false;
  const start=()=>{
   const previous=this.channels.get(id);if(previous&&!previous.ended)previous.source.stop();
   this.configure(options);const source=this.context.createBufferSource();source.buffer=clip.buffer;source.loop=false;source.connect(this.output);
   const channel={source,loop:false,ended:false,offset:clip.offset,duration:clip.duration,startedAt:this.context.currentTime};
   source.onended=()=>{channel.ended=true;};this.channels.set(id,channel);source.start(this.context.currentTime,clip.offset,clip.duration);return true;
  };
  if(this.context.state==='suspended')return this.context.resume().then(start).catch(()=>false);
  return start();
 }
 configure(options){if(this.context){if(!this.output){this.output=this.context.createGain();this.output.connect(this.context.destination);}this.output.gain.setValueAtTime(options.sound?effectiveVolume(options,'sound'):0,this.context.currentTime);}if(!options.sound)for(const channel of this.channels.values())if(!channel.ended){channel.source.stop();channel.ended=true;}}
}
