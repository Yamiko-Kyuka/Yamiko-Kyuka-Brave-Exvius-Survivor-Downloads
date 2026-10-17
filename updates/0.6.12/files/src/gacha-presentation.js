import {AnimationPlayer,clipFor} from './animation.js';

export const summonStyles={
 normal:{effect:'spark',particles:8,opening:.5,color:'#edf3ff',name:'Normal'},
 magic:{effect:'motes',particles:14,opening:.65,color:'#42f29a',name:'Magique'},
 rare:{effect:'shards',particles:20,opening:.8,color:'#55aaff',name:'Rare'},
 epic:{effect:'sigil',particles:28,opening:1,color:'#ce80ff',name:'Épique'},
 legendary:{effect:'sunburst',particles:40,opening:1.3,color:'#ffd04e',name:'Légendaire'}
};
export function summonPhase(elapsed,rarity){
 const steps=[['approach',.8],['turn',1.2],['drop',.6],['collect',.6],['deliver',1.4],['opening',(summonStyles[rarity]||summonStyles.normal).opening]];
 let start=0;for(const [name,duration] of steps){if(elapsed<start+duration)return {name,progress:Math.max(0,(elapsed-start)/duration)};start+=duration;}return {name:'reveal',progress:1};
}
const lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t*t*(3-2*t);
const captions={approach:'Le Mog s’approche du distributeur…',turn:'Kupo ! Le Mog tourne la molette.',drop:'Une capsule tombe…',collect:'Le Mog récupère la capsule.',deliver:'Le Mog vous apporte la capsule…',opening:'Le Mog ouvre la capsule…'};

/** Presentation only: the single wallet transaction belongs to GachaView. */
export class GachaPresentation{
 constructor({dialog,machine,loadEntity,cache,onReveal,onDismiss,onEquip}){
  Object.assign(this,{dialog,loadEntity,cache,onReveal,onDismiss,onEquip,elapsed:0,active:false,revealed:false,phase:null,mog:null});
  this.$=id=>dialog.querySelector('#'+id);this.canvas=this.$('summonMog');
  const art=machine.querySelector('svg').cloneNode(true);
  // Give every gradient a unique ID when the machine appears twice.
  const ids=new Map([...art.querySelectorAll('[id]')].map(e=>[e.id,'summon-'+e.id]));
  for(const e of art.querySelectorAll('*')){if(ids.has(e.id))e.id=ids.get(e.id);for(const attr of [...e.attributes]){let value=attr.value;for(const [oldId,newId] of ids)value=value.replaceAll('url(#'+oldId+')','url(#'+newId+')');if(value!==attr.value)e.setAttribute(attr.name,value);}}
  this.$('summonMachine').append(art);this.art=art;
  this.$('summonSkip').onclick=()=>this.reveal();this.$('summonContinue').onclick=()=>this.dismiss();this.$('summonEquip').onclick=()=>this.onEquip?.();
  dialog.addEventListener('cancel',e=>{e.preventDefault();this.revealed?this.dismiss():this.reveal();});
 }
 prepare(){
  if(!this.preparing)this.preparing=this.loadEntity('asset-89616').then(async entity=>{
   const variant=entity.variants.find(v=>v.unitId==='904000101')||entity.variants[0];
   await this.cache.preload([clipFor(variant,'idle')]);
   this.mog=new AnimationPlayer(variant);return this.mog;
  }).catch(()=>null);
  return this.preparing;
 }
 start(skin){
  this.skin=skin;this.style=summonStyles[skin.rarity]||summonStyles.normal;this.elapsed=0;this.active=true;this.revealed=false;this.phase=null;
  this.dialog.dataset.rarity=skin.rarity;this.dialog.dataset.effect='ceremony';this.dialog.dataset.phase='approach';this.dialog.style.setProperty('--summon-color',this.style.color);
  this.$('summonSkin').getContext('2d').clearRect(0,0,600,320);this.$('summonScene').hidden=false;this.$('summonReward').hidden=true;this.$('summonSkip').hidden=false;
  this.$('summonCaption').textContent='Le Mog arrive, kupo !';
  if(!this.dialog.open)this.dialog.showModal();this.$('summonSkip').focus();this.prepare();this.reducedMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 }
 reveal(){
  if(!this.active||this.revealed)return;
  this.revealed=true;this.dialog.dataset.effect=this.style.effect;this.dialog.dataset.phase='reveal';this.$('summonScene').hidden=true;this.$('summonSkip').hidden=true;this.$('summonCaption').textContent='';this.$('summonReward').hidden=false;
  const fx=this.$('summonParticles');fx.replaceChildren();
  for(let i=0;i<this.style.particles;i++){const mote=document.createElement('i');mote.style.setProperty('--angle',(i*137.508)+'deg');mote.style.setProperty('--travel',(90+(i*53)%170)+'px');mote.style.setProperty('--delay',(i%7)*.035+'s');mote.style.setProperty('--offset',(i*37)%100+'%');fx.append(mote);}
  this.onReveal();this.$('summonContinue').focus();
 }
 dismiss(){
  if(!this.active)return;
  this.active=false;this.dialog.close();this.onDismiss?.();
 }
 updateReward({skin,hero,canEquip,equipped}){
  this.$('summonTier').textContent='✦ '+this.style.name;
  this.$('summonName').textContent=skin.name;this.$('summonHero').textContent=hero.name;
  this.$('summonRefund').hidden=!skin.duplicate;this.$('summonRefund').textContent=skin.duplicate?'DOUBLON · + '+skin.refund.toLocaleString('fr-FR')+' GILS REMBOURSÉS':'';
  this.$('summonEquip').disabled=!canEquip;this.$('summonEquip').textContent=canEquip?(equipped?'APPARENCE ÉQUIPÉE':'ÉQUIPER CETTE APPARENCE'):'HÉROS À DÉBLOQUER DANS SUCCÈS';
 }
 tick(dt){
  if(!this.active||this.revealed)return;
  // A slow sprite load never loses the reward; Skip remains available throughout.
  if(!this.mog)return;
  this.elapsed+=dt;if(this.reducedMotion){if(this.elapsed>=.25)this.reveal();return;}const step=summonPhase(this.elapsed,this.skin.rarity);
  if(step.name==='reveal'){this.reveal();return;}
  if(step.name!==this.phase){
   this.phase=step.name;this.dialog.dataset.phase=this.phase;this.$('summonCaption').textContent=captions[this.phase];
   this.mog.sequence=[];this.mog.setBase('idle');
  }
  const stage=this.$('summonStage').getBoundingClientRect(),matrix=this.art.getScreenCTM();if(!matrix)return;
  const point=(x,y)=>({x:matrix.a*x+matrix.c*y+matrix.e-stage.left,y:matrix.b*x+matrix.d*y+matrix.f-stage.top});
  const wheel=point(180,337),outlet=point(180,430),w=Math.min(340,Math.max(180,stage.width*.34)),h=w*.75;
  const atWheel={x:wheel.x+w*.17,y:Math.min(stage.height*.92,wheel.y+h*.27)},atSlot={x:outlet.x+w*.12,y:outlet.y+h*.18},front={x:stage.width*.65,y:stage.height*.92};
  let pos=atWheel,scale=1;const p=ease(step.progress);let capsule={...outlet},visible=false,opening=0;
  if(this.phase==='approach')pos={x:lerp(stage.width*.86,atWheel.x,p),y:atWheel.y};
  if(this.phase==='turn')this.art.querySelector('.gacha-crank').style.transform='rotate('+720*step.progress+'deg)';
  if(this.phase==='drop'){visible=true;capsule.y-=38*(1-p);}
  if(this.phase==='collect'){visible=true;pos={x:lerp(atWheel.x,atSlot.x,p),y:lerp(atWheel.y,atSlot.y,p)};capsule={x:lerp(outlet.x,atSlot.x-w*.09,p),y:lerp(outlet.y,atSlot.y-h*.27,p)};}
  if(['deliver','opening'].includes(this.phase)){
   visible=true;const t=this.phase==='deliver'?p:1;pos={x:lerp(atSlot.x,front.x,t),y:lerp(atSlot.y,front.y,t)};scale=1+.18*t;
   capsule={x:pos.x-w*.09,y:pos.y-h*.27};
   if(this.phase==='opening'){opening=p;capsule.x=lerp(capsule.x,stage.width*.6,p);capsule.y=lerp(capsule.y,stage.height*.42,p);}
  }
  const walking=['approach','deliver'].includes(this.phase),hop=walking?Math.abs(Math.sin(this.elapsed*13))*5:this.phase==='opening'?Math.sin(step.progress*Math.PI*4)*5:0,lean=this.phase==='turn'?Math.sin(step.progress*Math.PI*4)*3:0;
  this.canvas.style.width=w+'px';this.canvas.style.left=pos.x+'px';this.canvas.style.top=(pos.y-hop)+'px';this.canvas.style.transform='translate(-50%,-93.333%) scale('+scale+') rotate('+lean+'deg)';
  const arm=this.$('summonArm');arm.style.visibility=this.phase==='turn'?'visible':'hidden';
  if(this.phase==='turn'){const theta=step.progress*Math.PI*4,hand=point(180+Math.cos(theta)*24,337+Math.sin(theta)*24),from={x:pos.x-w*.14,y:pos.y-h*.25};arm.setAttribute('viewBox','0 0 '+stage.width+' '+stage.height);this.$('summonForearm').setAttribute('d','M '+from.x+' '+from.y+' Q '+(from.x-10)+' '+(hand.y+8)+' '+hand.x+' '+hand.y);this.$('summonPaw').setAttribute('cx',hand.x);this.$('summonPaw').setAttribute('cy',hand.y);} 
  const ball=this.$('summonCapsule');ball.hidden=!visible;ball.style.left=capsule.x+'px';ball.style.top=capsule.y+'px';ball.style.setProperty('--opening',opening);ball.style.setProperty('--capsule-scale',1+opening*.9);
  this.drawMog(dt);
 }
 drawHost(canvas,dt){if(!this.mog||this.active)return;this.mog.sequence=[];this.mog.setBase('idle');this.drawMog(dt,canvas,false);}
 drawMog(dt,canvas=this.canvas,flip=this.phase==='deliver'){
  const anim=this.mog,clip=anim.clip;if(!this.cache.ready(clip,anim.elapsed,{loop:!anim.busy})){this.cache.loadClip(clip,anim.elapsed,{loop:!anim.busy}).catch(()=>{});return;}
  anim.update(dt);if(!this.cache.ready(anim.clip,anim.elapsed,{loop:!anim.busy}))return;
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,400,300);this.cache.draw(ctx,anim.clip,anim.elapsed,200,280,{scale:5.2,flip,loop:!anim.busy});
 }
}
