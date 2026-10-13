/** Menu and battle tracks loop; the victory fanfare plays once. */
export class BattleMusic {
 constructor(){this.audio=new Audio();this.audio.loop=true;this.audio.preload='auto';this.stage=null;this.options={music:true,musicVolume:.4};}
 async play(stage,options){
  this.options=options;
  this.audio.loop=stage.loop!==false;
  if(this.stage!==stage.id){this.stage=stage.id;this.audio.src='/assets/music/'+(stage.musicFile||stage.id+'.ogg');this.audio.load();}
  this.audio.volume=options.musicVolume;
  if(!options.music){this.audio.pause();return;}
  try{await this.audio.play();}catch{return false;}
  return true;
 }
 playMenu(options){return this.play({id:'menu',musicFile:'menu.mp3'},options);}
 playVictory(options){return this.play({id:'victory',musicFile:'victory.mp3',loop:false},options);}
 configure(options){this.options=options;this.audio.volume=options.musicVolume;if(!options.music)this.audio.pause();else if(this.stage&&!this.audio.ended)this.audio.play().catch(()=>{});}
 stop(){this.audio.pause();this.stage=null;this.audio.removeAttribute('src');this.audio.load();}
}

/** Independent one-shot effects, controlled by the sound-effects option. */
export class SoundEffects {
 constructor(){this.channels=new Map();}
 async play(id,options){
  if(!options.sound)return false;
  let audio=this.channels.get(id);
  if(!audio){audio=new Audio('/assets/music/'+id+'.mp3');audio.loop=false;audio.preload='auto';this.channels.set(id,audio);}
  audio.currentTime=0;
  try{await audio.play();}catch{return false;}
  return true;
 }
 configure(options){if(!options.sound)for(const audio of this.channels.values())audio.pause();}
}
