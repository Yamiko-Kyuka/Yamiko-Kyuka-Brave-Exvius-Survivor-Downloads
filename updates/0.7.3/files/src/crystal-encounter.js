import {beginBossRating,tickBossRating,awardBossRating,recordBossDamage,recordBossMechanic} from './boss-rating.js';
import {bossTuning} from './boss-difficulty.js';
import {mitigatedDamage} from './permanent-upgrades.js';
import {Terrain,moveEntity,TILE,ORIGIN} from './terrain.js';
import {AnimationPlayer,clipFor} from './animation.js';
import {superbossHealth} from './bosses.js';
import {dealDamage} from './combat.js';
import {playerRadius} from './hitboxes.js';
import {equipmentEffects} from './model.js';

// Seal an existing authored room rather than creating disconnected random obstacles.
export const reliquary={passage:'Reliquaire scellé',areas:[{name:'Reliquaire du Dragon Zombie',shape:'rect',x:10,y:7,w:14,h:14,style:1}],paths:[],props:[]};
export async function loadCrystalEncounter(stage,manifest,cache){
 if(stage.id!=='crystal-tower')return null;
 const response=await fetch('/assets/bosses/dracozombie/variant.json');
 if(!response.ok)throw Error('Animations du Dragon Zombie indisponibles');
 const dragon=await response.json();
 const skeleton=(await manifest('asset-89643')).variants.find(v=>v.unitId==='1120010');
 if(!dragon||!skeleton)throw Error('Animations du reliquaire indisponibles');
 await cache.preload([dragon,skeleton].flatMap(v=>['idle','atk'].map(k=>clipFor(v,k))));
 return {dragon,skeleton};
}
function body(variant,x,y,size,hp){return {variant,x,y,id:variant.unitId,anim:new AnimationPlayer(variant),size,hp,maxHp:hp,radius:size===180?64:12,speed:25,baseSpeed:25,hit:0,attack:0,dying:0,nativeFacing:'right'};}
export function beginCrystalEncounter(s){
 if(s.stage.id!=='crystal-tower'||s.crystalCompleted||s.crystalEncounter||s.phase!=='survival'||s.time+1e-6<120||!s.crystalAssets)return false;
 const terrain=new Terrain(s.stage,reliquary),center={x:ORIGIN+17*TILE,y:ORIGIN+14*TILE},returnPoint={x:s.x,y:s.y};
 const segment=Math.ceil(superbossHealth(s,{health:100})*bossTuning(s).hp/2);
 const boss={...body(s.crystalAssets.dragon,center.x,center.y,180,segment*2),name:'Dragon Zombie',achievementId:'dragon-zombie',elite:true,miniboss:true,collisionMass:1e12,speed:0,baseSpeed:0,segmentCount:2,segmentHp:segment};
 const c=s.crystalEncounter={boss,terrain:s.terrain,returnPoint,storedEnemies:s.enemies,storedGems:s.gems,storedPickups:s.pickups,storedPortals:s.spawnPortals||[],clock:0,phase:'pull',pullTime:0,center,arenaHalf:reliquary.areas[0].w*TILE/2,beamAt:2,poolAt:5,beams:[],pools:[],wave:[],absorbed:0,round:0};
 boss.receiveDamage=damage=>{
  if(c.phase==='pull')return 0;
  const floor=boss.hp>segment?segment:0,amount=Math.min(Math.max(0,damage)*(c.phase==='combat'?1:.1),boss.hp-floor);
  boss.hp-=amount;
  if(c.phase==='combat'&&boss.hp===segment&&floor===segment)falseDeath(s,c);
  return amount;
 };
 beginBossRating(s,c);
 s.terrain=terrain;s.enemies=[boss];s.gems=[];s.pickups=[];s.projectiles=[];s.hostileProjectiles=[];s.dash=null;s.action=null;s.anim.sequence=[];
 s.x=center.x;s.y=center.y+310;c.pullFrom={x:s.x,y:s.y};c.pullTo={x:center.x,y:center.y+160};
 s.phase='crystal-miniboss';s.time=120;s.invuln=1;s.pickupNotice={name:'Une chaîne vous entraîne dans le reliquaire !',life:3};return true;
}
function falseDeath(s,c){
 c.phase='false-death';c.absorbed=0;c.round++;c.boss.fakeDeath=true;c.wave=[];
 s.pickupNotice={name:'Fausse mort ! Interceptez les 12 squelettes.',life:4};
 for(let i=0;i<12;i++){
  const a=-Math.PI/2+i*Math.PI/6,dx=Math.cos(a),dy=Math.sin(a),reach=(c.arenaHalf-69)/Math.max(Math.abs(dx),Math.abs(dy));
  const skeleton={...body(s.crystalAssets.skeleton,c.center.x+dx*reach,c.center.y+dy*reach,44,Math.max(45,s.baseDamage*3*s.difficulty.hp)),name:'Squelette du reliquaire',summoned:true,clockPosition:i===0?12:i};
  c.wave.push(skeleton);s.enemies.push(skeleton);
 }
}
function hurt(s,damage){if(s.invuln>0||s.godMode||s.over||s.ending)return;const amount=mitigatedDamage(s,damage*s.difficulty.damage);recordBossDamage(s,amount);s.hp-=amount;s.invuln=.65;}
/** The stage clock freezes, while the encounter and Limit Break use active simulation time. */
export function tickCrystalEncounter(s,dt){
 const c=s.crystalEncounter;if(!c||c.scripted)return false;
 if(c.boss.hp<=0){endCrystalEncounter(s);return true;}
 tickBossRating(c,dt);c.clock+=dt;
 if(c.phase==='pull'){
  c.pullTime+=dt;const t=Math.min(1,c.pullTime/.6),ease=1-(1-t)**3;
  s.x=c.pullFrom.x+(c.pullTo.x-c.pullFrom.x)*ease;s.y=c.pullFrom.y+(c.pullTo.y-c.pullFrom.y)*ease;
  if(t===1)c.phase='combat';return false;
 }
 for(const e of c.wave){
  if(e.hp<=0||e.dying||e.absorbed)continue;
  const dx=c.boss.x-e.x,dy=c.boss.y-e.y,d=Math.hypot(dx,dy)||1;
  if(!s.freezeTimer)moveEntity(s.terrain,e,dx/d*e.speed*dt,dy/d*e.speed*dt,e.radius);
  // Absorb at contact before crowd separation can push the skeleton away.
  if(Math.hypot(e.x-c.boss.x,e.y-c.boss.y)<=c.boss.radius+e.radius+1){
   e.absorbed=true;e.hp=0;c.absorbed++;
   if(c.absorbed===2){c.boss.hp=c.boss.maxHp;s.pickupNotice={name:'Deux squelettes absorbés : le segment est restauré !',life:3};}
  }
 }
 s.enemies=s.enemies.filter(e=>!e.absorbed);
 if(c.phase==='false-death'&&c.wave.every(e=>e.hp<=0||e.dying||e.absorbed)){
  if(c.absorbed<2)recordBossMechanic(c);else c.failures=(c.failures||0)+1;
  c.phase='combat';c.boss.fakeDeath=false;c.wave=[];
  s.pickupNotice={name:c.absorbed>=2?'Le dragon se relève : deux segments.':'Le dragon se relève : dernier segment !',life:3};
 }
 // Fixed cadence: lock aim, wait a full second, fire. Runs even during false death.
 if(c.clock+1e-6>=c.beamAt){c.beamAt+=2;c.beams.push({angle:Math.atan2(s.y-c.boss.y,s.x-c.boss.x),age:0,born:c.clock,hit:false});if(!c.boss.fakeDeath)c.boss.anim.play('attack');}
 for(const beam of c.beams){beam.age=c.clock-beam.born;if(beam.age<1||beam.age>1.35||beam.hit)continue;
  const dx=s.x-c.boss.x,dy=s.y-c.boss.y,along=dx*Math.cos(beam.angle)+dy*Math.sin(beam.angle),across=Math.abs(-dx*Math.sin(beam.angle)+dy*Math.cos(beam.angle));
  if(along>=0&&along<=780&&across<12+playerRadius(s)){hurt(s,18);beam.hit=true;}
 }
 c.beams=c.beams.filter(b=>b.age<1.35);
 // No automatic persistent poison puddles at the player's feet.
 for(const pool of c.pools){pool.age+=dt;if(pool.age>=.5&&Math.hypot(s.x-pool.x,s.y-pool.y)<pool.radius+playerRadius(s))hurt(s,7);}
 return false;
}
export function endCrystalEncounter(s){
 const c=s.crystalEncounter;if(!c||c.boss.hp>0)return false;
 awardBossRating(s,c);
 s.terrain=c.terrain;Object.assign(s,c.returnPoint);s.enemies=c.storedEnemies;s.gems=c.storedGems;s.pickups=c.storedPickups;s.spawnPortals=c.storedPortals||[];
 s.pickups.push({kind:'level',x:s.x,y:s.y});s.projectiles=[];s.hostileProjectiles=[];s.effects=[];s.crystalCompleted=true;s.crystalEncounter=null;s.phase='survival';s.lastElite=Math.max(s.lastElite,1);s.spawn=1;s.invuln=2;
 s.kills++;s.defeatedCrystalBoss=c.boss;s.limitBreakLevel=1;s.limitCharge=0;
 s.pickupNotice={name:'Dragon Zombie vaincu · Limite niv. 1 débloquée !',life:5};return true;
}
export function tickLimitBreak(s,dt){if(s.limitBreakLevel>=1)s.limitCharge=Math.min(60,(s.limitCharge||0)+dt);}
export function castLimitBreak(s){
 if(!s||s.paused||s.over||s.ending||s.crystalEncounter?.phase==='pull'||!s.limitBreakLevel||s.limitCharge<60)return false;
 s.limitCharge=0;const radius=260,damage=s.damage*25*equipmentEffects(s).damage;
 for(const e of s.enemies)if(Math.hypot(e.x-s.x,e.y-s.y)<=radius+(e.radius||0)&&(!s.terrain||s.terrain.lineClear(s.x,s.y,e.x,e.y)))dealDamage(s,e,damage,'#ffe18a','limit');
 s.effects.push({kind:'explosion',x:s.x,y:s.y,radius,color:'#ffe18a',life:.8,maxLife:.8});s.screenFlash={color:'#ffe18a',life:.25,maxLife:.25};s.pickupNotice={name:'LIMITE NIVEAU 1 · Éclat des cristaux',life:2};return true;
}
export function drawCrystalEncounter(ctx,s,ox,oy){
 const c=s.crystalEncounter;if(!c||c.scripted)return;
 ctx.save();
 for(const p of c.pools){ctx.strokeStyle='#bbe574';ctx.fillStyle=p.age<.5?'#cae78933':'#5c8e2abb';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x+ox,p.y+oy,p.radius,0,Math.PI*2);ctx.fill();ctx.stroke();}
 for(const b of c.beams){ctx.save();ctx.translate(c.boss.x+ox,c.boss.y+oy);ctx.rotate(b.angle);ctx.strokeStyle=b.age<1?'#c3eb78':'#deffaa';ctx.fillStyle='#94c74a88';ctx.lineWidth=b.age<1?2:22;if(b.age<1)ctx.setLineDash([12,8]);else ctx.fillRect(0,-20,780,40);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(780,0);ctx.stroke();ctx.restore();}
 if(c.phase==='pull'){const dx=s.x-c.boss.x,dy=s.y-c.boss.y,length=Math.hypot(dx,dy),a=Math.atan2(dy,dx);ctx.translate(c.boss.x+ox,c.boss.y+oy);ctx.rotate(a);ctx.strokeStyle='#d5cee3';ctx.lineWidth=3;for(let x=0;x<length;x+=14){ctx.beginPath();ctx.ellipse(x,0,10,5,0,0,Math.PI*2);ctx.stroke();}}
 ctx.restore();
}
