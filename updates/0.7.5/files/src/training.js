import {heroes,weapons,powerups,ownedWeaponIds,chooseUpgrade} from './model.js';
import {applyPermanentUpgrades} from './permanent-upgrades.js';
import {Terrain} from './terrain.js';
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Math.floor(Number(n)||min)));
const rarities=new Set(['normal','magic','rare','epic','legendary']);
/** Real-time rolling damage, including crits and delayed multi-hits, with bounded history. */
export class TrainingMeter{
 constructor(){this.reset();}
 reset(){this.clock=0;this.events=[];this.total=0;this.hits=0;this.best=0;this.critical=0;this.multiHits=0;}
 tick(dt){this.clock+=Math.max(0,dt);while(this.events.length&&this.events[0].at<this.clock-3)this.events.shift();}
 hit({target,amount,style}){if(!target?.trainingDummy||!Number.isFinite(amount)||amount<=0)return;this.total+=amount;this.hits++;this.best=Math.max(this.best,amount);if(style==='critical')this.critical++;if(style==='multihit')this.multiHits++;this.events.push({at:this.clock,amount});}
 get dps(){return this.events.reduce((sum,e)=>sum+e.amount,0)/3;}
}
export function trainingTerrain(){return new Terrain({id:'midgar'},{passage:'Salle d’entraînement',areas:[{x:29,y:31,w:22,h:18,style:0,name:'Cour des héros'}],paths:[],props:[]});}
export function trainingDummy(){return {id:'training-dummy',name:'Mannequin d’entraînement',trainingDummy:true,mechanicTarget:true,miniboss:true,x:0,y:-80,radius:34,hp:1e15,maxHp:1e15,hit:0,receiveDamage:damage=>damage};}
export function trainingChoices(save){const owned=new Set(save.unlocked);return {heroes:heroes.filter(h=>!h.unavailable&&owned.has(h.id)),weapons:ownedWeaponIds(save.unlocked).map(id=>weapons[id]),powerups:Object.values(powerups)};}
export function normalizeTrainingConfig(config,save){
 const choices=trainingChoices(save),hero=choices.heroes.find(h=>h.id===config?.heroId)||choices.heroes[0],allowed=new Set(choices.weapons.map(w=>w.id));
 const unique=(list,key)=>[...new Map((list||[]).map(x=>[x[key],x])).values()].slice(0,6);
 const weaponList=unique(config?.weapons,'id').filter(w=>allowed.has(w.id)).map(w=>({id:w.id,level:clamp(w.level,1,8),rarity:rarities.has(w.rarity)?w.rarity:'normal'}));
 return {heroId:hero.id,weapons:weaponList.length?weaponList:[{id:hero.weaponId,level:1,rarity:'normal'}],powerups:unique(config?.powerups,'id').filter(p=>powerups[p.id]).map(p=>({id:p.id,level:clamp(p.level,1,powerups[p.id].maxLevel),rarity:powerups[p.id].legendaryOnly?'legendary':rarities.has(p.rarity)?p.rarity:'normal'}))};
}
/** Rebuild from the hero and save bonuses so repeated editing never compounds stats. */
export function applyTrainingConfig(s,config,save){
 const normalized=normalizeTrainingConfig(config,save),hero=heroes.find(h=>h.id===normalized.heroId);
 Object.assign(s,hero,{baseDamage:hero.damage,baseRange:hero.range,powerups:[],weapons:[],ownedHeroes:[...save.unlocked],action:null,multiHitQueue:[],projectiles:[],effects:[],damageNumbers:[],aegisShield:false,aegisCooldown:0,stasisCooldown:0,phoenixUsed:false,freezeTimer:0,hasteTimer:0,legendaryClock:0,screenFlash:null,pickupNotice:null});
 applyPermanentUpgrades(s,save);
 for(const w of normalized.weapons){chooseUpgrade(s,{type:'weapon',id:w.id,rarity:w.rarity});for(let i=1;i<w.level;i++){
   const equipped=s.weapons.find(e=>e.id===w.id),branch=weapons[w.id].upgrades.find(b=>(equipped.upgrades?.[b.id]||0)<b.max);if(branch)chooseUpgrade(s,{type:'weapon',id:w.id,upgrade:branch.id,rarity:w.rarity});
  }}
 for(const p of normalized.powerups)for(let i=0;i<p.level;i++)chooseUpgrade(s,{type:'powerup',id:p.id,rarity:p.rarity});
 s.weaponId=s.weapons[0].id;s.hp=s.maxHp;s.training.config=normalized;s.training.meter.reset();s.training.configRevision=(s.training.configRevision||0)+1;return normalized;
}
export function initializeTraining(s,save){
 s.training={meter:new TrainingMeter(),config:null,configRevision:0};s.turbo=false;s.phase='training';s.terrain=trainingTerrain();s.x=0;s.y=70;s.time=0;s.level=1;s.xp=0;s.enemies=[trainingDummy()];s.exploration=null;s.crystalEncounter=null;s.superboss=null;s.pickups=[];s.gems=[];s.limitBreakLevel=0;s.targetingMode='auto';
 s.onDamageDealt=hit=>s.training.meter.hit(hit);applyTrainingConfig(s,{heroId:s.id,weapons:[{id:s.weaponId,level:1}],powerups:[]},save);
}
export function drawTrainingArena(ctx,s,ox,oy,w,h){
 ctx.save();ctx.fillStyle='#101b2a';ctx.fillRect(s.x-w/s.zoom+ox,s.y-h/s.zoom+oy,w*2/s.zoom,h*2/s.zoom);
 const left=-704+ox,top=-576+oy,width=1408,height=1152;
 ctx.fillStyle='#283540';ctx.fillRect(left,top,width,height);
 for(let y=-576;y<576;y+=64)for(let x=-704;x<704;x+=64){ctx.fillStyle=((x/64+y/64)&1)?'#293844':'#2c3b47';ctx.fillRect(x+ox+1,y+oy+1,62,62);}
 ctx.strokeStyle='#b69a654f';ctx.lineWidth=3;ctx.strokeRect(left+28,top+28,width-56,height-56);
 ctx.strokeStyle='#8ba9b448';ctx.lineWidth=2;for(const r of [150,290,430]){ctx.beginPath();ctx.arc(ox,oy-80,r,0,Math.PI*2);ctx.stroke();}
 for(const x of [-610,610])for(const y of [-480,480]){ctx.fillStyle='#111e2b';ctx.fillRect(x+ox-26,y+oy-30,52,62);ctx.fillStyle='#6e8795';ctx.fillRect(x+ox-20,y+oy-62,40,74);ctx.fillStyle='#c2ad78';ctx.fillRect(x+ox-25,y+oy-66,50,9);ctx.fillRect(x+ox-25,y+oy+7,50,9);ctx.fillStyle='#9fe5eb';ctx.shadowColor='#89dce9';ctx.shadowBlur=14;ctx.fillRect(x+ox-5,y+oy-47,10,30);ctx.shadowBlur=0;}
 ctx.textAlign='center';ctx.font='20px Cinzel, serif';ctx.fillStyle='#cfbc92';ctx.fillText('COUR DES HÉROS',ox,oy-385);ctx.restore();
}
export function drawTrainingDummy(ctx,e,ox,oy){
 const x=e.x+ox,y=e.y+oy,pulse=e.hit>0;
 ctx.save();ctx.translate(x,y);ctx.fillStyle='#070e1888';ctx.beginPath();ctx.ellipse(0,55,44,12,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#3c4b58';ctx.fillRect(-30,43,60,12);ctx.fillStyle='#b39b6d';ctx.fillRect(-26,40,52,5);
 ctx.fillStyle='#765339';ctx.fillRect(-6,-38,12,80);ctx.fillStyle='#a47d50';ctx.fillRect(-45,-8,90,10);
 const wood=ctx.createRadialGradient(-12,-12,2,0,0,37);wood.addColorStop(0,pulse?'#f7d79a':'#bb9565');wood.addColorStop(.65,'#8c643e');wood.addColorStop(1,'#4c382b');ctx.fillStyle=wood;ctx.beginPath();ctx.arc(0,0,34,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#d6bb85';ctx.lineWidth=4;ctx.stroke();ctx.lineWidth=1;ctx.strokeStyle='#e4c78988';for(const r of [10,22]){ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();}
 ctx.strokeStyle='#67452f';ctx.beginPath();ctx.moveTo(-26,-9);ctx.lineTo(24,-9);ctx.moveTo(-26,12);ctx.lineTo(24,12);ctx.stroke();
 ctx.fillStyle=pulse?'#fff7c7':'#c3e3e8';ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(8,0);ctx.lineTo(0,12);ctx.lineTo(-8,0);ctx.closePath();ctx.fill();
 ctx.font='12px Cinzel, serif';ctx.textAlign='center';ctx.fillStyle='#f0ddb4';ctx.fillText('Mannequin',0,-51);ctx.restore();
}
