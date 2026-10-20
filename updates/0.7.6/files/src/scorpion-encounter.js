// Difficulty changes objective interactions as well as attack pressure.
import {ORIGIN,TILE} from './terrain.js';
import {hurtInArena} from './arena-pressure.js';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const angleDiff=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
export const SCORPION_LASER_HALF_ANGLE=.43;
export function scorpionRules(rank){
 rank=Math.min(5,Math.max(0,rank));
 return {rank,interval:[2.7,2.35,2.05,1.8,1.55,1.3][rank],windup:[1.2,1.1,1,.9,.8,.72][rank],laserWindup:[2.5,2.45,2.4,2.35,2.3,2.25][rank],laserEvery:10,laserDuration:3,laserTick:.75,shutter:rank===1,relays:rank>=2,orderedRelays:rank>=4,generatorWindow:rank>=4?(rank===5?8:10):Infinity,armoredServos:rank>=3,servoExposure:[0,0,0,8,7,6][rank],sync:[8,7.2,6.5,6,5.2,4.5][rank],missileWindup:[1.6,1.55,1.5,1.45,1.35,1.25][rank],missileEvery:[6,6,5.5,4.8,4.4,4][rank],repairEvery:7-rank*.5,doubleGap:rank===5?1:1.3};
}
export const scorpionLaserWindup=rank=>scorpionRules(rank).laserWindup;
function covers(c,falling=false){
 const cx=Math.round((c.center.x-ORIGIN)/TILE),cy=Math.round((c.center.y-ORIGIN)/TILE);
 return [-4,3].flatMap((dy,row)=>[-4,2].map((dx,col)=>({index:row*2+col,x:ORIGIN+(cx+dx+1)*TILE,y:ORIGIN+(cy+dy+.5)*TILE,broken:false,solid:!falling,landingAt:c.clock+(falling?.65:0),prop:{x:cx+dx,y:cy+dy,w:2,h:1,art:3,scorpionCover:true}})));
}
export function scorpionCoverProps(c){return(c.scorpionCovers||[]).filter(o=>o.solid&&!o.broken).map(o=>o.prop);}
function generatorOpen(c){const r=c.scorpionRules;return r.relays?c.scorpionRelays.every(o=>o.done)&&c.clock<c.scorpionGeneratorUntil:!r.shutter||(c.clock-c.scorpionMechanicBorn)%3.2<1.5;}
function accessible(s,c,o){return o.art==='scorpion-servo'?(!c.scorpionRules.armoredServos||o.exposedUntil>c.clock):generatorOpen(c)&&((s.x-c.boss.x)*Math.cos(c.scorpionFacing)+(s.y-c.boss.y)*Math.sin(c.scorpionFacing)<-35);}
function target(s,c,p,index,leg){
 const hp=Math.ceil(Math.max(50,(s.baseDamage||32)*(leg?2.5:3.2))*(1+c.rules.rank*.13));
 const o={...p,index,id:'scorpion-'+(leg?'servo':'generator')+'-'+index,name:leg?(index?'Servo de patte droite':'Servo de patte gauche'):'Générateur de champ',art:leg?'scorpion-servo':'scorpion-generator',radius:leg?28:29,size:60,hp,maxHp:hp,hit:0,dying:0,done:false,active:false,exposedUntil:0,mechanicTarget:true,objectiveKind:'scorpion',variant:c.boss.variant};
 o.aimable=()=>!o.done&&accessible(s,c,o);
 o.receiveDamage=damage=>{if(c.phase!=='mechanic'||o.done||!accessible(s,c,o))return 0;const amount=Math.min(o.hp,Math.max(0,damage));o.hp-=amount;if(o.hp<=0){o.hp=0;o.done=true;o.active=false;o.brokenAt=c.clock;s.onBossSound?.(leg?'servo-break':'generator-break');c.firstKillAt??=c.clock;c.raidEffects.push({x:o.x,y:o.y,born:c.clock,color:leg?'#ffc687':'#9feaff'});}return amount;};
 return o;
}
export function beginScorpionMechanic(s,c){
 c.scorpionRules=scorpionRules(c.rules.rank);c.scorpionMechanicBorn=c.clock;c.scorpionStage=c.segmentIndex?'repair':'generator';c.scorpionFacing=Math.PI/2;
 c.scorpionLasers=[];c.scorpionRepairAt=c.clock+c.scorpionRules.repairEvery;c.scorpionRepairPulse=0;c.scorpionCovers??=covers(c);c.scorpionLastTargets=null;c.scorpionGeneratorUntil=Infinity;
 // Coils are in front of the two shelters: hiding both redirects the laser and overloads a coil.
 c.scorpionRelays=!c.segmentIndex&&c.scorpionRules.relays?c.scorpionCovers.slice(2).map((o,index)=>({coverIndex:o.index,x:c.boss.x+(o.x-c.boss.x)*.72,y:c.boss.y+(o.y-c.boss.y)*.72,index,art:'scorpion-relay',done:false,active:!c.scorpionRules.orderedRelays||index===0})):[];
 const rear={x:c.boss.x,y:c.boss.y-150},legs=[{x:c.boss.x-150,y:c.boss.y+70},{x:c.boss.x+150,y:c.boss.y+70}];
 c.raidObjects=(c.segmentIndex?legs:[rear]).map((p,i)=>target(s,c,p,i,Boolean(c.segmentIndex)));c.targets=c.raidObjects;c.hint=c.segmentIndex?'Auto-réparation':'Générateur de champ';
 c.attackAt=c.clock+.75;c.scorpionLaserNext??=c.clock+3.4;c.scorpionLastLaser=c.clock-20;c.scorpionLastMissiles=c.clock-20;
 for(const o of c.raidObjects){o.shielded=o.art==='scorpion-generator'?!generatorOpen(c):c.scorpionRules.armoredServos;o.active=!o.shielded;}
}
export function tickScorpionMechanic(s,c){
 const targets=c.raidObjects,r=c.scorpionRules;if(targets.every(o=>o.done)){c.scorpionLastTargets=[...targets];return true;}
 if(!c.segmentIndex){if(r.relays&&c.clock>=c.scorpionGeneratorUntil){for(const o of c.scorpionRelays){o.done=false;o.active=!r.orderedRelays||o.index===0;}c.scorpionGeneratorUntil=Infinity;c.failures=(c.failures||0)+1;}}
 else{
  if(c.firstKillAt!==null&&c.clock-c.firstKillAt>r.sync){for(const o of targets){o.done=false;o.hp=o.maxHp;o.brokenAt=null;o.exposedUntil=0;}c.firstKillAt=null;c.failures=(c.failures||0)+1;c.scorpionRepairAt=c.clock;}
  if(c.clock>=c.scorpionRepairAt){c.scorpionRepairAt=c.clock+r.repairEvery;c.scorpionRepairPulse=c.clock;s.onBossSound?.('repair');const ceiling=c.boss.maxHp-c.segmentIndex*c.boss.segmentHp;c.boss.hp=Math.min(ceiling,c.boss.hp+c.boss.segmentHp*(.06+r.rank*.006));c.raidEffects.push({x:c.boss.x,y:c.boss.y,born:c.clock,color:'#8dffc1'});}
 }
 for(const o of targets){o.shielded=o.art==='scorpion-generator'?!generatorOpen(c):r.armoredServos&&o.exposedUntil<=c.clock;o.active=!o.done&&!o.shielded;}
 return false;
}
function hasLaser(c){return c.casts.some(a=>a.type==='scorpion-tail')||c.scorpionLasers?.length||c.followups?.some(f=>f.spec.type==='scorpion-tail');}
export function tickScorpionLaserCycle(s,c,schedule){
 if(c.kind!=='scorpion'||c.clock<c.scorpionLaserNext||hasLaser(c))return;
 const double=c.rules.rank>=4&&((c.scorpionLaserCycle=(c.scorpionLaserCycle||0)+1)%2);
 schedule(c.profile.attackSpecs.find(a=>a.type===(double?'scorpion-double-tail':'scorpion-tail')));c.scorpionLaserNext=c.clock+10;
}
export function nextScorpionAttack(s,c){
 const specs=c.profile.attackSpecs.filter(a=>!['scorpion-tail','scorpion-double-tail'].includes(a.type)),r=c.scorpionRules,random=c.scorpionRandom||Math.random;let spec;
 if(!c.scorpionOpened){c.scorpionOpened=true;spec=specs.at(-1);}
 else if(c.phase==='mechanic'&&r.armoredServos&&c.segmentIndex&&c.raidObjects.some(o=>!o.done&&o.exposedUntil<c.clock+1)&&c.clock-c.scorpionLastMissiles>=r.missileEvery)spec=specs.find(a=>a.type==='scorpion-stingers');
 else{
  const usable=id=>specs.some(a=>a.id===id)&&(specs.length===1||id!==c.scorpionPrevious);
  let bag=c.scorpionBag?.filter(usable)||[];if(!bag.length)bag=specs.map(a=>a.id).filter(usable);
  const id=bag[Math.min(bag.length-1,Math.floor(random()*bag.length))];spec=specs.find(a=>a.id===id);c.scorpionBag=bag.filter(id=>id!==spec.id);
 }
 c.scorpionPrevious=spec.id;c.attackAt=c.clock+r.interval*(c.segmentIndex?.9:1)*(.88+random()*.24);return spec;
}
export function scheduleScorpionAttack(s,c,spec,base,add){
 if(!spec.type.startsWith('scorpion-'))return false;const r=c.scorpionRules||scorpionRules(c.rules.rank),windup=r.windup;
 const tail=()=>{
  const rebuilt=covers(c,true);if(c.scorpionCovers.some(o=>o.broken)){c.scorpionCovers=c.scorpionCovers.map((o,i)=>o.broken?rebuilt[i]:o);c.scorpionTerrainDirty=true;}
  // A compulsory shelter attack must leave time to reach the nearest remaining cover.
  const travel=Math.min(...c.scorpionCovers.filter(o=>!o.broken).map(o=>{const dx=o.x-c.boss.x,dy=o.y-c.boss.y,d=Math.hypot(dx,dy);return Math.hypot(s.x-o.x-dx/d*95,s.y-o.y-dy/d*95)/Math.max(150,s.speed||217)+.35;}));
  const duration=Math.max(r.laserWindup,travel);add('scorpion-tail',{windup:duration,halfAngle:SCORPION_LASER_HALF_ANGLE,color:'#91dcff',trackingLaser:true,laserDuration:base.laserDuration||r.laserDuration});c.scorpionLastLaser=c.clock;
 };
 if(spec.type==='scorpion-tail'||spec.type==='scorpion-double-tail'){
  tail();if(spec.type==='scorpion-double-tail'){c.followups??=[];c.followups.push({at:c.clock+c.casts.at(-1).windup+r.laserDuration+r.doubleGap,spec:{...spec,type:'scorpion-tail'},options:{followup:true,laserDuration:1.2}});}
 }else if(spec.type==='scorpion-cannons'){
  for(let i=0;i<3+(r.rank>=3?1:0);i++){const delay=windup+i*(.24-r.rank*.015);add('fan',{shots:5+Math.floor(r.rank/2),windup:delay,trackUntil:c.clock+delay-.35,color:'#ffbc83',projectileKind:'scorpion-round',projectileRadius:4,projectileSpeed:300+r.rank*28});}
 }else if(spec.type==='scorpion-emp')add('scorpion-emp',{radius:190+r.rank*10,windup:windup+.15,color:'#9cf2e1'});
 else if(spec.type==='scorpion-stingers'){
  for(let i=0;i<3;i++){const dx=(i-1)*85,dy=i===1?0:60;add('meteor',{tx:base.tx+dx,ty:base.ty+dy,trackOffsetX:dx,trackOffsetY:dy,radius:42,windup:r.missileWindup+i*.23,trackUntil:c.clock+r.missileWindup-.8,color:'#ffb987',scorpionMissile:true});}c.scorpionLastMissiles=c.clock;
 }else if(spec.type==='scorpion-strike')add('cone',{radius:250,windup,trackUntil:c.clock+windup-.5,color:'#ffc17e'});
 else if(spec.type==='scorpion-overkill'){
  for(let i=0;i<3;i++)add('fan',{angle:base.angle+(i-1)*.55,shots:7,windup:windup+i*.2,color:'#ff9f75',projectileKind:'scorpion-round',projectileRadius:5,projectileSpeed:390});
  c.followups??=[];c.followups.push({at:c.clock+windup+.65,spec:{id:'overkill-emp',name:'Surcharge électromagnétique',type:'scorpion-emp'},options:{followup:true}});
 }return true;
}
export function tickScorpionTargeting(s,c){
 if(c.kind!=='scorpion')return;
 for(const a of c.casts){if(a.trackingLaser)a.angle=Math.atan2(s.y-a.y,s.x-a.x);else if(a.trackUntil!==undefined&&!a.locked){a.angle=Math.atan2(s.y-a.y,s.x-a.x);if(a.scorpionMissile){a.tx=s.x+a.trackOffsetX;a.ty=s.y+a.trackOffsetY;}if(c.clock>=a.trackUntil)a.locked=true;}}
}
export function fireScorpionCast(s,c,a){
 if(a.scorpionMissile&&c.phase==='mechanic'&&c.segmentIndex&&c.scorpionRules.armoredServos)for(const o of c.raidObjects)if(!o.done&&Math.hypot(o.x-a.tx,o.y-a.ty)<a.radius+o.radius){o.exposedUntil=c.clock+c.scorpionRules.servoExposure;s.onBossSound?.('servo-open');c.raidEffects.push({x:o.x,y:o.y,born:c.clock,color:'#ffb075'});}
 if(a.type==='scorpion-tail'){c.scorpionLasers??=[];c.scorpionLasers.push({...a,born:c.clock,expires:c.clock+(a.laserDuration||3),nextDamageAt:c.clock,damageTicks:0,relaysHit:new Set()});c.raidEffects.push({x:c.boss.x,y:c.boss.y,born:c.clock,color:'#b6eaff'});return true;}
 if(a.type==='scorpion-emp'){c.raidHazards.push({...a,activeAt:c.clock,expires:c.clock+.45,damage:23,hit:false});return true;}return false;
}
export function tickScorpionAttacks(s,c,refresh){
 if(c.kind!=='scorpion')return;
 for(const o of c.scorpionCovers||[])if(!o.broken&&!o.solid&&c.clock>=o.landingAt){o.solid=true;c.scorpionTerrainDirty=true;c.raidEffects.push({x:o.x,y:o.y,born:c.clock,color:'#a9b7ab'});}
 if(c.scorpionTerrainDirty){c.scorpionTerrainDirty=false;refresh(s,c);}
 for(const a of c.scorpionLasers||[]){
  if(c.clock>=a.expires){for(const o of c.scorpionCovers||[])if(o.solid&&!o.broken&&a.struckCovers?.has(o.index)){o.broken=true;o.solid=false;o.brokenAt=c.clock;s.onBossSound?.('cover-break');c.scorpionTerrainDirty=true;c.raidEffects.push({x:o.x,y:o.y,born:c.clock,color:'#ffcf99'});}const next=c.scorpionRelays?.find(o=>!o.done);if(next)next.active=true;continue;}
  a.angle=Math.atan2(s.y-a.y,s.x-a.x);a.struckCovers??=new Set();
  for(const o of c.scorpionCovers||[])if(o.solid&&!o.broken&&angleDiff(Math.atan2(o.y-a.y,o.x-a.x),a.angle)<a.halfAngle+.12)a.struckCovers.add(o.index);
  if(c.phase==='mechanic'&&!c.segmentIndex){
   for(const o of c.scorpionRelays||[])if(!o.done&&o.active&&angleDiff(Math.atan2(o.y-a.y,o.x-a.x),a.angle)<.16&&s.terrain.lineClear(a.x,a.y,o.x,o.y)){o.done=true;o.active=false;a.relaysHit.add(o.index);c.raidEffects.push({x:o.x,y:o.y,born:c.clock,color:'#c5efff'});}
   // Ordered coils cannot both be completed during the same sweep.
   if(a.relaysHit.size&&c.scorpionRelays.every(o=>o.done)&&c.scorpionGeneratorUntil===Infinity)c.scorpionGeneratorUntil=a.expires+c.scorpionRules.generatorWindow;
  }
  if(c.clock>=a.nextDamageAt){a.nextDamageAt=c.clock+c.scorpionRules.laserTick;s.onBossSound?.('laser');if(dist(s,a)<c.arenaHalf*3&&s.terrain.lineClear(a.x,a.y,s.x,s.y)&&hurtInArena(s,12,{continuous:true}))a.damageTicks++;}
 }
 c.scorpionLasers=(c.scorpionLasers||[]).filter(a=>c.clock<a.expires);
 if(c.scorpionTerrainDirty){c.scorpionTerrainDirty=false;refresh(s,c);}
}
