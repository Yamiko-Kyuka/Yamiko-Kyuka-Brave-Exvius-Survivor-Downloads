import {AnimationPlayer,actionSequence,clipFor} from './animation.js';

export function revealVariant(entity,preferred){
 const hasLimit=v=>actionSequence(v,'limit').some(c=>c.state.startsWith('limit_atk'));
 return (preferred&&hasLimit(preferred)?preferred:null)||entity.variants.find(v=>v.playable&&hasLimit(v))||entity.variants.find(hasLimit)||preferred||entity.variants[0];
}
export function revealFraming(clips,width,height,maxScale=3.5){
 let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
 for(const clip of clips.filter(Boolean))for(const [, ,x,y,w,h]of clip.frames){left=Math.min(left,x-clip.anchor[0]);top=Math.min(top,y-clip.anchor[1]);right=Math.max(right,x+w-clip.anchor[0]);bottom=Math.max(bottom,y+h-clip.anchor[1]);}
 if(!Number.isFinite(left))return {scale:1,x:width/2,y:height*.7};
 const scale=Math.min(maxScale,(width-64)/Math.max(1,right-left),(height-40)/Math.max(1,bottom-top));
 return {scale,x:width/2-(left+right)/2*scale,y:height/2-(top+bottom)/2*scale};
}

/** A separate top-layer dialog preserves any level reward or result underneath. */
export class HeroUnlockReveal{
 constructor({dialog,cache,loadEntity,onDone=()=>{}}){
  Object.assign(this,{dialog,cache,loadEntity,onDone,queue:[],current:null,animation:null,serial:0,total:0,index:0});
  this.canvas=dialog.querySelector('canvas');this.button=dialog.querySelector('button');
  this.button.onclick=()=>this.dismiss();dialog.addEventListener('cancel',e=>{e.preventDefault();this.dismiss();});
 }
 get active(){return Boolean(this.current);}
 enqueue(heroes){
  for(const hero of heroes)if(hero&&this.current?.id!==hero.id&&!this.queue.some(h=>h.id===hero.id))this.queue.push(hero);
  if(!this.active){this.total=this.queue.length;this.index=0;this.next();}else this.total=this.index+this.queue.length;
 }
 next(){
  this.current=this.queue.shift()||null;this.animation=null;const serial=++this.serial;
  if(!this.current){this.dialog.close();this.dialog.removeAttribute('data-hero');this.onDone();return;}
  const hero=this.current;this.index++;this.dialog.dataset.hero=hero.id;this.dialog.dataset.animationState='loading';
  this.dialog.querySelector('[data-unlock-name]').textContent=hero.name;
  this.dialog.querySelector('[data-unlock-series]').textContent=hero.title;
  this.dialog.querySelector('[data-unlock-weapon]').textContent=hero.weapon+' rejoint vos choix d’amélioration.';
  this.dialog.querySelector('[data-unlock-status]').textContent='Le héros approche…';
  this.button.textContent=this.queue.length?'SUIVANT · '+this.index+' / '+this.total:'CONTINUER';
  this.canvas.getContext('2d').clearRect(0,0,this.canvas.width,this.canvas.height);
  if(!this.dialog.open)this.dialog.showModal();this.button.focus();
  this.loadEntity(hero.id).then(async entity=>{
   const variant=revealVariant(entity),clips=actionSequence(variant,'limit');
   await this.cache.preload([...clips,...actionSequence(variant,'victory'),clipFor(variant,'idle')]);
   if(serial!==this.serial)return;
   // Frame the hero's body, so wide Limit Break effects cannot shrink or offset it.
   this.animation=new AnimationPlayer(variant);this.framing=revealFraming([clipFor(variant,'idle')],this.canvas.width,this.canvas.height,10.5);
   this.animation.play(clips.length?'limit':'victory',{onComplete:()=>this.animation?.play('victory')});
   this.dialog.querySelector('[data-unlock-status]').textContent='';
  }).catch(()=>{
   if(serial===this.serial)this.dialog.querySelector('[data-unlock-status]').textContent='Votre héros est bien débloqué. Son animation est momentanément indisponible.';
  });
 }
 dismiss(){if(this.active)this.next();}
 tick(dt){
  const anim=this.animation;if(!this.active||!anim)return;
  const ready=()=>this.cache.ready(anim.clip,anim.elapsed,{loop:!anim.busy});
  if(!ready()){this.cache.loadClip(anim.clip,anim.elapsed,{loop:!anim.busy}).catch(()=>{});return;}
  anim.update(dt);if(!ready()){this.cache.loadClip(anim.clip,anim.elapsed,{loop:!anim.busy}).catch(()=>{});return;}
  const ctx=this.canvas.getContext('2d');ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
  this.cache.draw(ctx,anim.clip,anim.elapsed,this.framing.x,this.framing.y,{scale:this.framing.scale,flip:false,loop:!anim.busy});
  this.dialog.dataset.animationState=anim.clip?.state||'idle';
 }
}
