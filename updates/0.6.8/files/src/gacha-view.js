import {GACHA_COST,drawSkin,equipSkin,gachaOdds,gachaPool,gachaUnlocked,normalizeCosmetics} from './gacha.js';
import {AnimationPlayer,clipFor} from './animation.js';
import {revealFraming} from './hero-unlock-reveal.js';
export class GachaView{
 constructor({root,getSave,persist,heroes,loadVariant,cache,onEquip}){
  Object.assign(this,{root,getSave,persist,heroes,loadVariant,cache,onEquip,busy:false,elapsed:0,skin:null,preview:null,serial:0});
  this.$=id=>root.querySelector('#'+id);this.$('gachaMachine').onclick=()=>this.spin();this.$('gachaEquip').onclick=async()=>{if(this.skin&&equipSkin(this.getSave(),this.skin.heroId,this.skin.id)){await persist();this.onEquip?.();this.render();}};
  for(const h of heroes){const o=document.createElement('option');o.value=h.id;o.textContent=h.name;this.$('gachaHeroFilter').append(o);}this.$('gachaHeroFilter').onchange=()=>this.collection();
 }
 render(){
  const save=this.getSave(),open=gachaUnlocked(save),pool=gachaPool(save),cosmetics=normalizeCosmetics(save.cosmetics),remaining=pool.filter(s=>!cosmetics.owned.includes(s.id)).length,machine=this.$('gachaMachine');
  this.$('gachaGate').hidden=open;for(const row of this.root.querySelectorAll('[data-gacha-stage]'))row.classList.toggle('complete',['aeon','primal','transcendence'].some(d=>Number(save.difficultyWins?.[row.dataset.gachaStage]?.[d])>0));
  machine.disabled=this.busy||!open||save.coins<GACHA_COST||!pool.length;machine.setAttribute('aria-label',this.busy?'Tirage en cours':'Tourner le Gachapon · 20 000 gils');
  this.$('gachaPrice').textContent=this.busy?'LA CAPSULE ARRIVE…':!open?'GACHA VERROUILLÉ':!pool.length?'COLLECTION COMPLÈTE':save.coins<GACHA_COST?'20 000 GILS · GILS INSUFFISANTS':'TOURNER · 20 000 GILS';
  const acquired=cosmetics.owned.length-this.heroes.length;this.$('gachaOwned').textContent=acquired+' apparence'+(acquired===1?' obtenue':'s obtenues')+' · '+remaining+' à découvrir';
  this.$('gachaOdds').replaceChildren();for(const r of gachaOdds(save)){const chip=document.createElement('span');chip.style.color=r.color;chip.textContent=r.name+' '+(r.probability*100).toLocaleString('fr-FR',{maximumFractionDigits:2})+' %';this.$('gachaOdds').append(chip);}
  if(this.skin){const ownedHero=save.unlocked.includes(this.skin.heroId);this.$('gachaEquip').disabled=!ownedHero;this.$('gachaEquip').textContent=ownedHero?(cosmetics.selected[this.skin.heroId]===this.skin.id?'APPARENCE ÉQUIPÉE':'ÉQUIPER CETTE APPARENCE'):'HÉROS À DÉBLOQUER DANS SUCCÈS';}
  this.collection();
 }
 collection(){
  const save=this.getSave(),owned=new Set(normalizeCosmetics(save.cosmetics).owned),odds=gachaOdds(save),heroId=this.$('gachaHeroFilter').value;
  import('./skin-catalog.js').then(({skinCatalog})=>{this.$('gachaCollection').replaceChildren();for(const skin of skinCatalog.filter(s=>s.heroId===heroId)){
   const r=odds.find(r=>r.id===skin.rarity),row=document.createElement('div');row.className='skin-collection-row';row.style.setProperty('--skin-color',r.color);const name=document.createElement('span'),rate=document.createElement('small');name.textContent=skin.name;rate.textContent=skin.classic?'✓ CLASSIQUE':(owned.has(skin.id)?'✓ POSSÉDÉE · ':'')+r.name+' · '+(r.probability/Math.max(1,r.count)*100).toLocaleString('fr-FR',{maximumFractionDigits:3})+' % par tirage';row.append(name,rate);this.$('gachaCollection').append(row);
  }});
 }
 spin(){
  if(this.busy)return;const skin=drawSkin(this.getSave());if(!skin){this.render();return;}
  this.skin=skin;this.busy=true;this.elapsed=0;this.preview=null;this.$('gachaPreview').getContext('2d').clearRect(0,0,600,320);this.serial++;this.$('gachaResult').hidden=true;this.$('gachaRefund').hidden=true;this.$('gachaMachine').dataset.phase='spinning';const rarity=gachaOdds(this.getSave()).find(r=>r.id===skin.rarity);this.$('gachaMachine').style.setProperty('--capsule-color',rarity.color);this.$('gachaNotice').textContent='Une capsule se prépare…';
  this.persist();this.render();
 }
 async reveal(){
  const skin=this.skin,serial=this.serial,hero=this.heroes.find(h=>h.id===skin.heroId),rarity=gachaOdds(this.getSave()).find(r=>r.id===skin.rarity);this.$('gachaMachine').dataset.phase='reveal';this.$('gachaResult').hidden=false;this.$('gachaResult').style.setProperty('--skin-color',rarity.color);this.$('gachaSkinRarity').textContent='✦ '+rarity.name;this.$('gachaSkinName').textContent=skin.name;this.$('gachaSkinHero').textContent=hero.name;this.$('gachaRefund').hidden=!skin.duplicate;this.$('gachaRefund').textContent=skin.duplicate?'DOUBLON · + '+skin.refund.toLocaleString('fr-FR')+' GILS REMBOURSÉS':'';this.$('gachaNotice').textContent=skin.duplicate?'Apparence déjà possédée · moitié de la mise remboursée.':'Nouvelle apparence obtenue !';this.busy=false;this.render();
  try{const variant=await this.loadVariant(skin),idle=clipFor(variant,'idle'),anim=new AnimationPlayer(variant);await this.cache.preload([idle]);if(serial!==this.serial)return;this.preview={anim,framing:revealFraming([idle],600,320)};}catch{this.$('gachaNotice').textContent=(skin.duplicate?'Doublon remboursé.':'Apparence ajoutée à votre collection.')+' Aperçu indisponible pour le moment.';}
 }
 tick(dt){
  if(this.busy){this.elapsed+=dt;if(this.elapsed>=.9)this.$('gachaMachine').dataset.phase='drop';if(this.elapsed>=2.1)this.reveal();}
  const p=this.preview;if(this.root.hidden||!p)return;const clip=p.anim.clip;if(!this.cache.ready(clip,p.anim.elapsed,{loop:!p.anim.busy})){this.cache.loadClip(clip,p.anim.elapsed,{loop:!p.anim.busy}).catch(()=>{});return;}p.anim.update(dt);if(!this.cache.ready(p.anim.clip,p.anim.elapsed,{loop:!p.anim.busy})){this.cache.loadClip(p.anim.clip,p.anim.elapsed,{loop:!p.anim.busy}).catch(()=>{});return;}const ctx=this.$('gachaPreview').getContext('2d');ctx.clearRect(0,0,600,320);this.cache.draw(ctx,p.anim.clip,p.anim.elapsed,p.framing.x,p.framing.y,{scale:p.framing.scale,loop:!p.anim.busy});
 }
}
