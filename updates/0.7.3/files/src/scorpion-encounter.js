// Adaptation of the uploaded FFVII Remake fight: rear field generator,
// debris intercepting the Tail Laser, then destructible auto-repair servos.
import {ORIGIN,TILE} from './terrain.js';
import {hurtInArena} from './arena-pressure.js';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const angleDiff=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
export const SCORPION_LASER_HALF_ANGLE=.43;
export const scorpionLaserWindup=rank=>3-Math.min(5,Math.max(0,rank))*.07;

function covers(c,falling=false){
 const cx=Math.round((c.center.x-ORIGIN)/TILE),cy=Math.round((c.center.y-ORIGIN)/TILE);
 return [-4,2].map((dx,index)=>({index,x:ORIGIN+(cx+dx+1)*TILE,y:ORIGIN+(cy+3.5)*TILE,broken:false,solid:!falling,landingAt:c.clock+(falling?.8:0),prop:{x:cx+dx,y:cy+3,w:2,h:1,art:3,scorpionCover:true}}));
}
export function scorpionCoverProps(c){return(c.scorpionCovers||[]).filter(o=>o.solid&&!o.broken).map(o=>o.prop);}
function target(s,c,p,index,leg){
 const hp=Math.ceil(Math.max(50,(s.baseDamage||32)*(leg?2.5:3.2))*(1+c.rules.rank*.13));
 const o={...p,index,id:'scorpion-'+(leg?'servo':'generator')+'-'+index,name:leg?(index?'Servo de patte droite':'Servo de patte gauche'):'Générateur de champ',art:leg?'scorpion-servo':'scorpion-generator',radius:leg?28:29,size:60,hp,maxHp:hp,hit:0,dying:0,done:false,active:true,mechanicTarget:true,objectiveKind:'scorpion',variant:c.boss.variant};
 const accessible=()=>leg||((s.x-c.boss.x)*Math.cos(c.scorpionFacing)+(s.y-c.boss.y)*Math.sin(c.scorpionFacing)<-35);
 o.aimable=()=>!o.done&&accessible();
 o.receiveDamage=damage=>{
  if(c.phase!=='mechanic'||o.done||!accessible())return 0;
  const amount=Math.min(o.hp,Math.max(0,damage));o.hp-=amount;
  if(o.hp<=0){o.hp=0;o.done=true;o.active=false;o.brokenAt=c.clock;c.firstKillAt??=c.clock;c.raidEffects.push({x:o.x,y:o.y,born:c.clock,color:leg?'#ffc687':'#9feaff'});}
  return amount;
 };
 return o;
}
export function beginScorpionMechanic(s,c){
 c.scorpionStage=c.segmentIndex?'repair':'generator';c.scorpionFacing=Math.PI/2;
 c.scorpionLasers=[];c.scorpionRepairAt=c.clock+9;c.scorpionRepairPulse=0;
 c.scorpionCovers??=covers(c);c.scorpionLastTargets=null;
 const rear={x:c.boss.x,y:c.boss.y-150},legs=[{x:c.boss.x-120,y:c.boss.y+55},{x:c.boss.x+120,y:c.boss.y+55}];
 c.raidObjects=(c.segmentIndex?legs:[rear]).map((p,i)=>target(s,c,p,i,Boolean(c.segmentIndex)));
 c.targets=c.raidObjects;c.hint=c.segmentIndex?'Auto-réparation':'Générateur de champ';
}
export function tickScorpionMechanic(s,c){
 const targets=c.raidObjects;if(targets.every(o=>o.done)){c.scorpionLastTargets=[...targets];return true;}
 if(!c.segmentIndex)return false;
 const sync=8-c.rules.rank*.35;
 if(c.firstKillAt!==null&&c.clock-c.firstKillAt>sync){
  for(const o of targets){o.done=false;o.active=true;o.hp=o.maxHp;o.brokenAt=null;}
  c.firstKillAt=null;c.failures=(c.failures||0)+1;c.scorpionRepairAt=c.clock;
 }
 if(c.clock>=c.scorpionRepairAt){
  c.scorpionRepairAt=c.clock+7;c.scorpionRepairPulse=c.clock;
  const ceiling=c.boss.maxHp-c.segmentIndex*c.boss.segmentHp;
  c.boss.hp=Math.min(ceiling,c.boss.hp+c.boss.segmentHp*.08);
  c.raidEffects.push({x:c.boss.x,y:c.boss.y,born:c.clock,color:'#8dffc1'});
 }
 return false;
}
export function scheduleScorpionAttack(s,c,spec,base,add){
 if(!spec.type.startsWith('scorpion-'))return false;
 const tail=()=>{
  if(!c.scorpionCovers?.some(o=>!o.broken)){c.scorpionCovers=covers(c,true);c.scorpionTerrainDirty=true;}
  add('scorpion-tail',{windup:scorpionLaserWindup(c.rules.rank),halfAngle:SCORPION_LASER_HALF_ANGLE,color:'#91dcff'});
 };
 if(spec.type==='scorpion-tail'||spec.type==='scorpion-double-tail'){
  tail();if(spec.type==='scorpion-double-tail'){c.followups??=[];c.followups.push({at:c.clock+scorpionLaserWindup(c.rules.rank)+3.5,spec:{...spec,type:'scorpion-tail'},options:{followup:true}});}
 }else if(spec.type==='scorpion-cannons'){
  for(let i=0;i<3;i++)add('fan',{shots:5+Math.floor(c.rules.rank/2),windup:base.windup+i*.24,color:'#ffbc83',projectileKind:'scorpion-round',projectileRadius:4,projectileSpeed:270});
 }else if(spec.type==='scorpion-emp')add('scorpion-emp',{radius:190,windup:base.windup+.2,color:'#9cf2e1'});
 else if(spec.type==='scorpion-stingers'){
  for(let i=0;i<3;i++)add('meteor',{tx:base.tx+(i-1)*100,ty:base.ty+(i%2)*65,radius:45,windup:base.windup+i*.3,color:'#ffb987',scorpionMissile:true});
 }else if(spec.type==='scorpion-strike')add('cone',{radius:230,windup:base.windup,color:'#ffc17e'});
 else if(spec.type==='scorpion-overkill'){
  for(let i=0;i<3;i++){const a=base.angle+(i-1)*.55;add('fan',{angle:a,shots:5,windup:base.windup+i*.3,color:'#ff9f75',projectileKind:'scorpion-round',projectileRadius:5,projectileSpeed:260});}
  c.followups??=[];c.followups.push({at:c.clock+base.windup+1.3,spec:{id:'overkill-emp',name:'Surcharge électromagnétique',type:'scorpion-emp'},options:{followup:true}});
 }
 return true;
}
export function fireScorpionCast(s,c,a){
 if(a.type==='scorpion-tail'){
  c.scorpionLasers??=[];c.scorpionLasers.push({...a,born:c.clock,expires:c.clock+.65,hit:false});
  c.raidEffects.push({x:c.boss.x,y:c.boss.y,born:c.clock,color:'#b6eaff'});return true;
 }
 if(a.type==='scorpion-emp'){c.raidHazards.push({...a,activeAt:c.clock,expires:c.clock+.45,damage:23,hit:false});return true;}
 return false;
}
export function tickScorpionAttacks(s,c,refresh){
 if(c.kind!=='scorpion')return;
 for(const o of c.scorpionCovers||[])if(!o.broken&&!o.solid&&c.clock>=o.landingAt){o.solid=true;c.scorpionTerrainDirty=true;c.raidEffects.push({x:o.x,y:o.y,born:c.clock,color:'#a9b7ab'});}
 if(c.scorpionTerrainDirty){c.scorpionTerrainDirty=false;refresh(s,c);}
 for(const a of c.scorpionLasers||[]){
  if(c.clock>=a.expires){
   for(const o of c.scorpionCovers||[])if(o.solid&&!o.broken&&angleDiff(Math.atan2(o.y-a.y,o.x-a.x),a.angle)<a.halfAngle+.12){o.broken=true;o.solid=false;o.brokenAt=c.clock;c.scorpionTerrainDirty=true;c.raidEffects.push({x:o.x,y:o.y,born:c.clock,color:'#ffcf99'});}
   continue;
  }
  if(!a.hit&&angleDiff(Math.atan2(s.y-a.y,s.x-a.x),a.angle)<a.halfAngle&&dist(s,a)<c.arenaHalf*3&&s.terrain.lineClear(a.x,a.y,s.x,s.y)&&hurtInArena(s,28))a.hit=true;
 }
 c.scorpionLasers=(c.scorpionLasers||[]).filter(a=>c.clock<a.expires);
 if(c.scorpionTerrainDirty){c.scorpionTerrainDirty=false;refresh(s,c);}
}
