const AUDIO_REVISION='0.5.4';
export const musicTracks={
 menu:{file:'menu.mp3',title:'Menu theme'},
 midgar:{file:'midgar.ogg',title:'Midgar · Mako — alerte réacteur'},
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
  this.audio.volume=options.musicVolume;
  if(!options.music){this.audio.pause();return;}
  try{await this.audio.play();}catch{return false;}
  return true;
 }
 playMenu(options){return this.play({id:'menu'},options);}
 playVictory(options){return this.play({id:'victory'},options);}
 configure(options){this.options=options;this.audio.volume=options.musicVolume;if(!options.music)this.audio.pause();else if(this.stage&&!this.audio.ended)this.audio.play().catch(()=>{});}
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
/** Short effects are fetched and decoded before interaction, then started directly on the audio clock. */
export class SoundEffects {
 constructor(context=null){this.context=context;this.buffers=new Map();this.channels=new Map();this.pending=null;this.error=null;}
 prepare(){
  if(this.pending)return this.pending;
  this.pending=(async()=>{
   try{this.context??=new (globalThis.AudioContext||globalThis.webkitAudioContext)({latencyHint:'interactive'});}catch{return;}
   await Promise.all(['menu-click','level-up'].map(async id=>{
    try{const response=await fetch(audioUrl(id+'.mp3'));if(!response.ok)throw Error('HTTP '+response.status);const buffer=await this.context.decodeAudioData(await response.arrayBuffer());this.buffers.set(id,{buffer,...audibleWindow(buffer)});}catch(error){this.error='Un bruitage ne peut pas être chargé.';console.error('Bruitages :',id,error);}
   }));
  })();return this.pending;
 }
 unlock(){this.prepare();if(this.context?.state==='suspended')return this.context.resume().catch(()=>{});return Promise.resolve();}
 play(id,options){
  if(!options.sound)return false;
  const clip=this.buffers.get(id);if(!clip||!clip.duration)return false;
  const start=()=>{
   const previous=this.channels.get(id);if(previous&&!previous.ended)previous.source.stop();
   const source=this.context.createBufferSource();source.buffer=clip.buffer;source.loop=false;source.connect(this.context.destination);
   const channel={source,loop:false,ended:false,offset:clip.offset,duration:clip.duration,startedAt:this.context.currentTime};
   source.onended=()=>{channel.ended=true;};this.channels.set(id,channel);source.start(this.context.currentTime,clip.offset,clip.duration);return true;
  };
  if(this.context.state==='suspended')return this.context.resume().then(start).catch(()=>false);
  return start();
 }
 configure(options){if(!options.sound)for(const channel of this.channels.values())if(!channel.ended){channel.source.stop();channel.ended=true;}}
}
