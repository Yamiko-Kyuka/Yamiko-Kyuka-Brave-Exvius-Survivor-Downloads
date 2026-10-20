import {enemyBodiesTouch} from './enemy-geometry.js';
import {beginScorpionMechanic,tickScorpionMechanic,scorpionCoverProps} from './scorpion-encounter.js';
import {recordBossMechanic} from './boss-rating.js';
import {AnimationPlayer} from './animation.js';
import {Terrain,ORIGIN,TILE,moveEntity} from './terrain.js';
import {raidMechanics} from './raid-design.js';
import {hurtInArena} from './arena-pressure.js';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const point=(c,x,y)=>({x:c.center.x+x,y:c.center.y+y});
export function restoreRaidTerrain(s,c){
 const solid=(c.raidObjects||[]).filter(o=>o.solid&&!o.done).map(o=>({...o.prop}));
 s.terrain=new Terrain(s.stage,{...c.plan,props:[...c.plan.props,...solid,...scorpionCoverProps(c)]});
 if(!s.terrain.walkable(s.x,s.y,s.radius||14))Object.assign(s,s.terrain.nearestFloor(s.x,s.y,s.radius||14));
}
function positions(c,n,kind){
 if(kind==='ram'||kind==='shelter')return [[0,-4],[-4,3],[3,3]].map(([dx,dy])=>{const cx=Math.round((c.center.x-ORIGIN)/TILE),cy=Math.round((c.center.y-ORIGIN)/TILE);return {x:ORIGIN+(cx+dx+.5)*TILE,y:ORIGIN+(cy+dy+.5)*TILE,prop:{x:cx+dx,y:cy+dy,w:1,h:1,art:3,raidObject:true}};});
 if(n===2)return [point(c,-280,-80),point(c,280,-80)];
 const r=Math.min(330,c.arenaHalf*.53);return Array.from({length:n},(_,i)=>{const a=-Math.PI/2+i*Math.PI*2/n;return point(c,Math.cos(a)*r,Math.sin(a)*r);});
}
function object(s,c,p,index,spec){
 const hp=Math.max(35,(s.baseDamage||32)*1.6*(1+c.rules.rank*.12)),o={...p,index,x:p.x,y:p.y,id:'raid-'+c.kind+'-'+c.revision+'-'+index,name:spec.name,art:spec.art,radius:30,size:52,hp,maxHp:hp,hit:0,dying:0,mechanicTarget:true,objectiveKind:'raid-'+spec.kind,active:spec.kind!=='ordered'&&spec.kind!=='procession'&&spec.kind!=='meteor-core',done:false,hold:0,variant:c.boss.variant,anim:new AnimationPlayer(c.boss.variant)};
 o.aimable=()=>['break','ordered'].includes(spec.kind)?(!o.done&&(spec.kind!=='ordered'||o.active)):['meteor-core','thermal'].includes(spec.kind)&&o.exposedUntil>c.clock;
 o.receiveDamage=damage=>{
  if(c.phase!=='mechanic'||o.done||!['break','ordered','meteor-core','thermal'].includes(spec.kind))return 0;
  if(spec.kind==='ordered'&&(o.index!==c.progress||dist(s,o)>130))return 0;
  if((spec.kind==='meteor-core'||spec.kind==='thermal')&&!(o.exposedUntil>c.clock))return 0;
  const amount=Math.min(o.hp,Math.max(0,damage));o.hp-=amount;
  if(o.hp<=0){o.hp=0;o.done=true;o.active=false;c.raidEffects.push({x:o.x,y:o.y,born:c.clock});if(spec.kind==='ordered'||spec.kind==='meteor-core')c.progress++;if(spec.kind==='thermal')c.firstKillAt??=c.clock;}
  return amount;
 };
 return o;
}
export function startRaidMechanic(s,c){
 s.enemies=s.enemies.filter(e=>!e.mechanicTarget&&!e.raidSummon);s.hostileProjectiles=[];
 c.mechanic=c.profile.mechanics[c.mechanicIndex];c.activeMechanic=raidMechanics[c.mechanic];if(!c.activeMechanic)throw Error('Mécanique inconnue : '+c.mechanic);
 c.phase='mechanic';c.revision=(c.revision||0)+1;c.progress=0;c.carried=false;c.firstKillAt=null;c.mechanicMeteor=null;c.raidSummons=[];c.absorbed=0;c.soulsReleased=false;c.lastHeroHp=s.hp;c.charge=null;c.casts=[];c.followups=[];c.reflections=[];c.raidHazards=[];c.raidEffects??=[];c.objectiveShot=0;
 c.deadline=c.clock+c.rules.deadline;c.attackAt=c.clock+3;c.nextObjectiveCast=c.clock+2.5;
 const spec=c.activeMechanic,kind=spec.kind,n=spec.count||c.rules.objectives;
 if(kind==='scorpion'){beginScorpionMechanic(s,c);s.enemies.push(...c.raidObjects);c.boss.fakeDeath=false;restoreRaidTerrain(s,c);return;}
 if(kind==='ram'&&c.ramInventory?.some(o=>!o.done))c.raidObjects=c.ramInventory;
 else{c.raidObjects=positions(c,n,kind).map((p,i)=>object(s,c,p,i,spec));if(kind==='ram')c.ramInventory=c.raidObjects;}
 c.targets=c.raidObjects;
 for(const o of c.raidObjects){o.solid=kind==='ram'||kind==='shelter';if(o.solid&&!o.prop)throw Error('Obstacle sans empreinte');if(kind==='thermal')o.color=o.index?'#92dfff':'#ff9977';if(kind==='ordered')o.color=['#ff9f77','#9ee5ff','#ead080','#d4a7ff'][o.index];}
 if(['carry','procession'].includes(kind))c.raidSource={...point(c,0,Math.min(c.arenaHalf,c.plan.areas[0].h*TILE/2)-120),art:c.mechanic==='magnet-crane'?'battery':'brazier'};else c.raidSource=null;
 if(['procession','ordered','meteor-core'].includes(kind))c.raidObjects[0].active=true;
 s.enemies.push(...c.raidObjects);c.boss.fakeDeath=kind==='souls';restoreRaidTerrain(s,c);
 c.hint=spec.name;
}
export function finishRaidMechanic(s,c){
 recordBossMechanic(c);if(c.kind==='scorpion'){c.scorpionLasers=[];c.followups=[];c.attackAt=c.clock+.7;}
 s.enemies=s.enemies.filter(e=>!e.mechanicTarget&&!e.raidSummon);s.hostileProjectiles=[];c.mechanicMeteor=null;c.carried=false;c.raidSource=null;c.casts=[];c.charge=null;c.boss.fakeDeath=false;
 c.mechanicIndex++;
 if(c.mechanicIndex<c.profile.mechanics.length){startRaidMechanic(s,c);return;}
 c.phase='combat';c.vulnerableUntil=c.clock+c.rules.open;c.targets=[];c.raidEffects.push({x:c.boss.x,y:c.boss.y,born:c.clock,color:'#fff0b9'});restoreRaidTerrain(s,c);
 s.pickupNotice={name:'Barrière brisée',life:1.5};
}
function reset(s,c){c.failures=(c.failures||0)+1;startRaidMechanic(s,c);s.pickupNotice={name:'Le rituel se reforme',life:1.5};}
function releaseSouls(s,c){
 c.soulsReleased=true;c.raidSummons=[];const variant=c.profile.skeletonVariant||s.crystalAssets?.skeleton;if(!variant)throw Error('Squelettes de l’ossuaire absents');
 for(let i=0;i<12;i++){const a=-Math.PI/2+i*Math.PI/6,r=c.arenaHalf-90,p=point(c,Math.cos(a)*r,Math.sin(a)*r),hp=Math.max(35,(s.baseDamage||32)*1.4*(1+c.rules.rank*.14)),e={...p,id:variant.unitId,name:'Âme de l’ossuaire',variant,anim:new AnimationPlayer(variant),hp,maxHp:hp,size:52,radius:14,speed:22,baseSpeed:22,hit:0,attack:0,dying:0,summoned:true,raidSummon:true,nativeFacing:'right'};c.raidSummons.push(e);s.enemies.push(e);}
}
function tickSouls(s,c,dt){
 if(!c.soulsReleased)return false;
 for(const e of c.raidSummons){if(e.hp<=0||e.dying||e.absorbed)continue;const dx=c.boss.x-e.x,dy=c.boss.y-e.y,len=Math.hypot(dx,dy)||1;if(!s.freezeTimer)moveEntity(s.terrain,e,dx/len*e.speed*dt,dy/len*e.speed*dt,e.radius);
  if(enemyBodiesTouch(e,c.boss)){e.absorbed=true;e.hp=0;e.dying=.001;c.absorbed++;}
 }
 if(c.absorbed>=2){if(c.segmentIndex>0){c.segmentIndex--;c.boss.hp=Math.min(c.boss.maxHp,c.boss.hp+c.boss.segmentHp);}reset(s,c);return false;}
 return c.raidSummons.every(e=>e.hp<=0||e.dying||e.absorbed);
}
function prepareMeteor(s,c){
 const target=c.raidObjects[c.progress];if(!target)return;
 const travel=(dist(s,target)+120)/Math.max(100,Math.min(160,s.speed||160));
 c.mechanicMeteor={stage:'tracking',x:s.x,y:s.y,born:c.clock,endsAt:c.clock+Math.max(3.3,travel+.5),duration:Math.max(3.3,travel+.5),radius:58};
 c.boss.anim.play('attack');
}
function tickMeteor(s,c){
 const o=c.raidObjects[c.progress];if(!o)return true;
 for(const t of c.raidObjects){t.active=t===o;t.exposed=t.exposedUntil>c.clock;}
 if(o.exposedUntil>0&&o.exposedUntil<=c.clock&&!o.done){o.exposedUntil=0;o.exposed=false;}
 if(!c.mechanicMeteor&&!o.exposedUntil)prepareMeteor(s,c);
 const m=c.mechanicMeteor;if(!m)return false;
 if(m.stage==='tracking'){m.x=s.x;m.y=s.y;if(c.clock>=m.endsAt){m.stage='locked';m.born=c.clock;m.duration=1.6;m.endsAt=c.clock+1.6;}return false;}
 if(c.clock<m.endsAt)return false;
 if(dist(m,o)<=o.radius+18){o.exposedUntil=c.clock+c.rules.exposure;o.exposed=true;}else s.pickupNotice={name:'La lentille reste protégée',life:1.5};
 if(dist(s,m)<m.radius+(s.radius||14))hurtInArena(s,27);
 c.raidEffects.push({x:m.x,y:m.y,born:c.clock,color:'#ffc58b'});c.mechanicMeteor=null;return false;
}
export function tickRaidMechanic(s,c,dt){
 if(c.phase==='combat'){if(c.clock>=c.vulnerableUntil){c.mechanicIndex=0;reset(s,c);}return;}
 if(c.phase!=='mechanic')return;
 if(c.clock>=c.deadline){reset(s,c);return;}
 const kind=c.activeMechanic.kind,objects=c.raidObjects;
 if(c.rules.carryFragile&&s.hp<c.lastHeroHp)c.carried=false;c.lastHeroHp=s.hp;
 let done=false;
 if(kind==='scorpion')done=tickScorpionMechanic(s,c);
 if(['hold','souls'].includes(kind)){
  for(const o of objects)if(!o.done){o.active=true;o.hold=dist(s,o)<62?o.hold+dt:Math.max(0,o.hold-dt*1.4);if(o.hold>=c.rules.hold){o.done=true;o.active=false;c.raidEffects.push({x:o.x,y:o.y,born:c.clock});}}
  if(objects.every(o=>o.done)){if(kind==='souls'){if(!c.soulsReleased)releaseSouls(s,c);done=tickSouls(s,c,dt);}else done=true;}
 }
 if(['carry','procession'].includes(kind)){
  if(!c.carried&&dist(s,c.raidSource)<48)c.carried=true;
  for(const o of objects){o.active=!o.done&&(kind==='carry'||o.index===c.progress);if(!o.active||!c.carried)continue;o.hold=dist(s,o)<56?o.hold+dt:0;if(o.hold>=c.rules.hold){o.done=true;o.active=false;c.carried=false;c.progress++;c.raidEffects.push({x:o.x,y:o.y,born:c.clock});}}
  done=objects.every(o=>o.done);
 }
 if(['break','ordered','reflect','shelter'].includes(kind))done=objects.every(o=>o.done||o.hp<=0);
 if(kind==='ordered')for(const o of objects)o.active=o.index===c.progress&&!o.done;
 if(kind==='meteor-core')done=tickMeteor(s,c);
 if(kind==='thermal'){
  for(const o of objects){o.exposed=o.exposedUntil>c.clock;o.active=o.exposed&&!o.done;}
  done=objects.every(o=>o.done);
  if(!done&&c.firstKillAt!==null&&c.clock-c.firstKillAt>c.rules.sync){for(const o of objects){o.done=false;o.hp=o.maxHp;o.exposedUntil=c.clock+c.rules.exposure;}c.firstKillAt=null;s.pickupNotice={name:'Les cœurs se reforment',life:1.5};}
 }
 if(kind==='gates'){
  const n=objects.length,r=Math.min(320,c.arenaHalf*.5);objects.forEach((o,i)=>{const a=-Math.PI/2+i*Math.PI*2/n+c.clock*.09;o.x=c.center.x+Math.cos(a)*r;o.y=c.center.y+Math.sin(a)*r;o.active=i===c.progress&&!o.done;});
  const entry=objects.find(o=>!o.done&&dist(s,o)<42);
  if(entry&&entry.index===c.progress){entry.done=true;c.progress++;}else if(entry&&c.rules.rank>=4){objects.forEach(o=>o.done=false);c.progress=0;}
  done=c.progress===n;
 }
 if(done)finishRaidMechanic(s,c);
 c.raidEffects=c.raidEffects.filter(e=>c.clock-e.born<1.2);
}
export function raidBeamHit(s,c,cast){
 if(c.phase!=='mechanic'||cast.revision!==c.revision)return;
 const kind=c.activeMechanic.kind,along=o=>(o.x-cast.x)*Math.cos(cast.angle)+(o.y-cast.y)*Math.sin(cast.angle),across=o=>Math.abs(-(o.x-cast.x)*Math.sin(cast.angle)+(o.y-cast.y)*Math.cos(cast.angle));
 for(const o of c.raidObjects){if(o.done||along(o)<=0||across(o)>o.radius+16)continue;
  if(kind==='reflect'){o.done=true;o.hp=0;c.raidEffects.push({x:o.x,y:o.y,born:c.clock});c.reflections??=[];c.reflections.push({x:o.x,y:o.y,tx:c.boss.x,ty:c.boss.y,born:c.clock});}
  if(kind==='thermal'&&cast.element===(o.index===0?'ice':'fire')){o.exposedUntil=c.clock+c.rules.exposure;o.exposed=true;}
  if(kind==='shelter'&&along(s)>along(o)+55&&across(s)<45){
   // Keep this shot stopped by the stone while immediately clearing its rubble.
   const end=s.terrain.trace(cast.x,cast.y,cast.x+Math.cos(cast.angle)*c.arenaHalf*3,cast.y+Math.sin(cast.angle)*c.arenaHalf*3);
   cast.blockedLength=Math.hypot(end.x-cast.x,end.y-cast.y);o.done=true;c.raidEffects.push({x:o.x,y:o.y,born:c.clock});restoreRaidTerrain(s,c);
  }
 }
}
export function raidRamHit(s,c,end){
 if(c.phase!=='mechanic'||c.activeMechanic.kind!=='ram'||!end.blocked)return false;
 const hit=c.raidObjects.find(o=>!o.done&&Math.hypot(end.x-Math.max(o.x-32,Math.min(end.x,o.x+32)),end.y-Math.max(o.y-32,Math.min(end.y,o.y+32)))<=c.boss.radius+8);
 if(!hit)return false;hit.done=true;hit.hp=0;c.raidEffects.push({x:hit.x,y:hit.y,born:c.clock,color:'#c8c9b4'});restoreRaidTerrain(s,c);finishRaidMechanic(s,c);return true;
}
