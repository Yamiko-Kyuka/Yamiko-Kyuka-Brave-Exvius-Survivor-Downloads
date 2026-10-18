import {raidProfile} from './raid-design.js';
import {createRaidArena} from './raid-arena.js';
import {tickRaidPatterns,drawRaidPatterns} from './raid-patterns.js';
import {bossTuning,extraBossPatterns} from './boss-difficulty.js';
import {AnimationPlayer,clipFor} from './animation.js';
import {Terrain,TILE,ORIGIN} from './terrain.js';
import {superbossHealth} from './bosses.js';
import {beginCrystalEncounter,tickCrystalEncounter} from './crystal-encounter.js';
import {playerRadius} from './hitboxes.js';
import {tickArenaPressure,drawArenaPressure,hurtInArena} from './arena-pressure.js';
import {startMechanic,tickMechanic,mechanicBeam,mechanicWallHit,drawMechanic,mechanicNames,finishMechanic} from './arena-mechanics.js';
import {BEHEMOTH_CHARGE_DISTANCE,BEHEMOTH_CHARGE_SPEED,struckBehemothPillar,breakBehemothPillar} from './behemoth-pillars.js';

export const encounterDefinitions={
 midgar:[
  {id:'scorpion',unit:'4060810',name:'Scorpion gardien',size:160,mechanics:['nodes'],patterns:['beam','quake'],color:'#74ebba',room:[7,10],roomName:'Poste de refroidissement'},
  {id:'air-buster',unit:'4060910',name:'Air Buster',size:175,mechanics:['beam-relays'],patterns:['salvo','meteor'],color:'#ffb780',room:[5,33],roomName:'Atelier mécanique'},
  {id:'jenova',superboss:true,mechanics:['polarity','beam-relays','sync'],patterns:['cross','salvo','meteor'],color:'#91e8ea',room:[31,32],roomName:'Chambre de contrôle'}
 ],
 zanarkand:[
  {id:'behemoth',unit:'3010110',name:'Béhémoth',size:175,mechanics:['charge-pillars'],patterns:['charge','quake'],color:'#ffba92',room:[34,9],roomName:'Parvis du temple'},
  {id:'spectral-keeper',variantFile:'/assets/bosses/spectral-keeper/variant.json',name:'Gardien des limbes',size:195,mechanics:['runes'],patterns:['meteor','twin'],color:'#bba9ff',room:[60,35],roomName:'Cour des colonnes'},
  {id:'jecht',superboss:true,mechanics:['charge-wall','runes','towers'],patterns:['salvo','charge','meteor'],color:'#ffae74',room:[31,59],roomName:'Esplanade des priants'}
 ],
 'crystal-tower':[
  {id:'dragon-zombie',legacy:true,mechanics:['skeletons']},
  {id:'xande',unit:'4050210',name:'Xande',size:180,mechanics:['meteor-seals'],patterns:['quake','salvo'],color:'#d1b1fa',room:[57,8],roomName:'Reliquaire oriental'},
  {id:'emperor',superboss:true,mechanics:['ordered-crystals','mages','runes'],patterns:['salvo','cross','meteor'],color:'#e9c98b',room:[32,4],roomName:'Salle du trône'}
 ],
 'dark-world':[
  {id:'cerberus',unit:'3011010',name:'Cerbère',size:175,mechanics:['cover'],patterns:['twin','meteor'],color:'#dcb5ff',room:[34,6],roomName:'Porte du néant'},
  {id:'two-headed',unit:'4070210',name:'Dragon à deux têtes',size:190,mechanics:['sync'],patterns:['twin','salvo'],color:'#bedfff',room:[59,32],roomName:'Sanctuaire brisé'},
  {id:'cloud-of-darkness',superboss:true,mechanics:['cover','orbits','beam-relays'],patterns:['cross','twin','salvo'],color:'#c1e998',room:[31,59],roomName:'Autel des ténèbres'}
 ]
};
export async function loadEncounterRoster(stage,enemyCatalog,cache,finalProfile){
 const roster=[];const mage=enemyCatalog.find(e=>e.variant.unitId==='1050110')?.variant;
 for(const [index,def]of encounterDefinitions[stage.id].entries()){
  const redesign=raidProfile(def.id);
  let skeletonVariant=null;
  let variant=def.superboss?finalProfile.variant:enemyCatalog.find(e=>e.variant.unitId===def.unit)?.variant;
  if(def.legacy){const dragon=await fetch('/assets/bosses/dracozombie/variant.json'),skeleton=await fetch('/assets/animation-data/asset-89643.json');if(!dragon.ok||!skeleton.ok)throw Error('Ossuaire indisponible');variant=await dragon.json();skeletonVariant=(await skeleton.json()).variants.find(v=>v.unitId==='1120010');await cache.preload([clipFor(skeletonVariant,'idle'),clipFor(skeletonVariant,'atk')]);}
  if(def.variantFile){const r=await fetch(def.variantFile);if(!r.ok)throw Error('Animations du '+def.name+' indisponibles');variant=await r.json();}
  if(!variant||!clipFor(variant,'idle'))throw Error('Animations du boss indisponibles : '+def.id);
  await cache.preload([clipFor(variant,'idle'),clipFor(variant,'atk')]);
  if(def.mechanics.includes('mages')){if(!mage)throw Error('Mages indisponibles');await cache.preload([clipFor(mage,'idle'),clipFor(mage,'atk')]);}
  roster.push({...def,...redesign,skeletonVariant,name:def.id==='dragon-zombie'?'Dragon Zombie':def.name||finalProfile.name,size:def.size||finalProfile.size,variant,mageVariant:mage,health:def.superboss?finalProfile.health:140,at:(index+1)*120,final:index===2});
 }
 return roster;
}
export function beginScheduledEncounter(s){
 if(s.crystalEncounter||s.phase!=='survival'||!s.encounterRoster)return false;
 s.completedEncounters??=[];
 if(s.crystalCompleted&&!s.completedEncounters.includes(120))s.completedEncounters.push(120);
 const profile=s.encounterRoster.find(p=>!s.completedEncounters.includes(p.at));
 if(!profile||s.time+1e-6<profile.at)return false;
 if(profile.legacy){if(!beginCrystalEncounter(s))return false;const tune=bossTuning(s);Object.assign(s.crystalEncounter,{scheduledAt:120,kind:'dragon-zombie',tuning:tune,profile:{patterns:extraBossPatterns(s.stage.id,tune.rank),color:'#a5e38d'},casts:[],patternStep:0,attackAt:4});return true;}
 return beginScriptedEncounter(s,profile);
}
export function beginScriptedEncounter(s,profile){
 if(s.crystalEncounter||s.phase!=='survival')return false;
 const tuning=bossTuning(s);profile=profile.redesigned?{...profile,...raidProfile(profile.id,tuning.rank)}:{...profile,patterns:[...profile.patterns,...extraBossPatterns(s.stage.id,tuning.rank)]};
 let width,plan,terrain,center;
 if(profile.redesigned){const arena=createRaidArena(s.stage,profile);width=arena.half*2/TILE;({plan,terrain,center}=arena);}
 else{const oldWidth=profile.final?16:12; width=Math.round(oldWidth*1.2);const [rx,ry]=profile.room,x=rx-Math.floor((width-oldWidth)/2),y=ry-Math.floor((width-oldWidth)/2),area={name:profile.roomName+' · arène scellée',shape:'rect',x,y,w:width,h:width,style:1};plan={passage:area.name,areas:[area],paths:[],props:[]};terrain=new Terrain(s.stage,plan);center={x:ORIGIN+(x+width/2)*TILE,y:ORIGIN+(y+width/2)*TILE};}
 const hp=Math.ceil(superbossHealth(s,profile)*(profile.final?1.4:1)*tuning.hp),radius=Math.min(90,profile.size*.34);
 const boss={achievementId:profile.id,x:center.x,y:center.y,id:profile.superboss?'boss-'+profile.id:profile.variant.unitId,name:profile.name,variant:profile.variant,anim:new AnimationPlayer(profile.variant),size:profile.size,radius,hp,maxHp:hp,segmentCount:profile.final?3:2,segmentHp:hp/(profile.final?3:2),miniboss:true,mobileBoss:profile.redesigned||profile.patterns.includes('charge'),superboss:profile.final,elite:true,speed:0,baseSpeed:0,hit:0,dying:0,attack:0,collisionMass:1e12,nativeFacing:profile.variant.nativeFacing||(profile.final?'left':'right')};
 const c=s.crystalEncounter={scripted:true,kind:profile.id,profile,tuning,scheduledAt:profile.at,final:profile.final,boss,center,plan,arenaHalf:width*TILE/2,terrain:s.terrain,returnPoint:{x:s.x,y:s.y},storedEnemies:s.enemies,storedGems:s.gems,storedPickups:s.pickups,storedPortals:s.spawnPortals||[],previousZoom:s.zoom,clock:0,phase:'pull',pullTime:0,pullFrom:{x:center.x,y:center.y+width*TILE*.42},pullTo:{x:center.x,y:center.y+(profile.final?200:160)},mechanicIndex:0,segmentIndex:0,targets:[],casts:[],attackAt:2,patternStep:0,pools:[],beams:[],wave:[],mageVariant:profile.mageVariant};
 if(profile.redesigned){c.redesigned=true;c.rules=profile.rules;c.raidBaseTerrain=terrain;boss.aimable=()=>c.phase==='combat';}
 boss.receiveDamage=damage=>{
  if(c.phase!=='combat')return 0;
  const floor=boss.maxHp-(c.segmentIndex+1)*boss.segmentHp,remaining=Math.max(0,boss.hp-floor),amount=Math.min(Math.max(0,damage),remaining);boss.hp-=amount;
  if(c.segmentIndex<boss.segmentCount-1&&boss.hp<=floor+1e-6){boss.hp=floor;c.segmentIndex++;c.mechanicIndex=0;startMechanic(s,c);s.pickupNotice={name:'La barrière se reforme !',life:2.5};}
  if(c.segmentIndex===boss.segmentCount-1&&boss.hp<1e-6)boss.hp=0;
  return amount;
 };
 s.terrain=terrain;s.enemies=[boss];s.gems=[];s.pickups=[];s.projectiles=[];s.hostileProjectiles=[];s.dash=null;s.action=null;s.anim.sequence=[];s.anim.onComplete=null;
 Object.assign(s,c.pullFrom);s.zoom=Math.min(s.zoom,profile.redesigned?(profile.final?.6:.72):profile.final?.8:1);s.phase='scripted-boss';if(profile.final)s.superboss=boss;s.time=profile.at;s.invuln=1;s.bossNotice=null;s.pickupNotice={name:'Une chaîne vous attire dans l’arène !',life:2.5};
 return true;
}
export function completeScriptedEncounter(s){
 const c=s.crystalEncounter;if(!c?.scripted||c.boss.hp>0)return false;
 s.terrain=c.terrain;Object.assign(s,c.returnPoint);s.zoom=c.previousZoom;s.enemies=c.storedEnemies;s.gems=c.storedGems;s.pickups=c.storedPickups;s.spawnPortals=c.storedPortals||[];
 s.projectiles=[];s.hostileProjectiles=[];s.effects=[];s.crystalEncounter=null;s.phase=c.final?'victory':'survival';s.spawn=1;s.lastElite=Math.floor(c.scheduledAt/120);s.invuln=2;s.kills++;
 s.completedEncounters??=[];if(!s.completedEncounters.includes(c.scheduledAt))s.completedEncounters.push(c.scheduledAt);
 if(c.kind==='dragon-zombie'){s.crystalCompleted=true;s.limitBreakLevel=1;s.limitCharge=0;s.defeatedCrystalBoss=c.boss;}
 s.defeatedEncounterBoss=c.boss;s.pickupNotice={name:c.boss.name+' vaincu · arène libérée !',life:3};
 if(c.final){s.awaitingVictory=true;s.pendingLevels=(s.pendingLevels||0)+1;s.enemies=[];}else s.pickups.push({kind:'level',x:s.x,y:s.y});
 return true;
}
function cast(s,c,kind,angle=Math.atan2(s.y-c.boss.y,s.x-c.boss.x)){
 const base={kind,x:c.boss.x,y:c.boss.y,angle,tx:s.x,ty:s.y,born:c.clock,windup:kind==='charge'?1.15:1.1,color:c.profile.color,revision:c.revision};
 if(kind==='starfall'){for(let i=0;i<6;i++){const a=i*Math.PI/3;c.casts.push({...base,kind:'meteor',tx:s.x+Math.cos(a)*105,ty:s.y+Math.sin(a)*105,radius:35,windup:1.35});}}
 else if(kind==='lattice'){for(const offset of [-105,0,105])c.casts.push({...base,kind:'beam',x:base.x-Math.sin(angle)*offset,y:base.y+Math.cos(angle)*offset,windup:1.35});}
 else if(kind==='spiral'){for(let i=0;i<2;i++)c.casts.push({...base,kind:'radial',angle:angle+i*Math.PI/8,windup:1.2+i*.45});}
 else if(kind==='nova'){c.casts.push({...base,kind:'radial',windup:1.4});for(const a of [angle-Math.PI/2,angle+Math.PI/2])c.casts.push({...base,kind:'beam',angle:a,windup:1.8});}
 else if(kind==='meteor')for(let i=0;i<(c.final?3:2);i++)c.casts.push({...base,tx:s.x+(i?Math.cos(i*2.4)*72:0),ty:s.y+(i?Math.sin(i*2.4)*72:0),radius:40});
 else if(kind==='twin'||kind==='cross'){const offsets=kind==='cross'?[-Math.PI/2,0,Math.PI/2]:[-.22,.22];for(const offset of offsets)c.casts.push({...base,kind:'beam',angle:angle+offset});}
 else c.casts.push(base);
 if(!c.boss.fakeDeath)c.boss.anim.play('attack');
}
function fireCast(s,c,a){
 const base={owner:c.boss,x:a.x,y:a.y,age:0,color:a.color,damage:c.final?28:21,radius:11,life:4};
 if(a.kind==='radial'){const count=8+(c.tuning?.shots||0);for(let i=0;i<count;i++){const angle=a.angle+i*Math.PI*2/count;s.hostileProjectiles.push({...base,kind:'bomb',angle,vx:Math.cos(angle)*175,vy:Math.sin(angle)*175,life:4});}}
 else if(a.kind==='beam'){mechanicBeam(s,c,a);s.hostileProjectiles.push({...base,kind:'beam',angle:a.angle,length:c.arenaHalf*3,life:.32});}
 else if(a.kind==='meteor')s.hostileProjectiles.push({...base,kind:'meteor',x:a.tx,y:a.ty,radius:a.radius,life:.18});
 else if(a.kind==='quake')s.hostileProjectiles.push({...base,kind:'quake',life:.6,maxRadius:210,radius:0});
 else if(a.kind==='charge')c.charge={angle:a.angle,remaining:c.kind==='behemoth'?BEHEMOTH_CHARGE_DISTANCE/BEHEMOTH_CHARGE_SPEED:1.6};
 else{const count=c.final?9:5;for(let i=0;i<count;i++){const angle=a.angle+(i-(count-1)/2)*.22;s.hostileProjectiles.push({...base,kind:'bomb',vx:Math.cos(angle)*210,vy:Math.sin(angle)*210,angle,radius:12});}}
}
function segmentDistance(p,x,y,tx,ty){const dx=tx-x,dy=ty-y,t=Math.max(0,Math.min(1,((p.x-x)*dx+(p.y-y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-x-dx*t,p.y-y-dy*t);}
function tickPatterns(s,c,dt){
 if(c.phase==='mechanic'&&c.mechanic==='meteor-seals')return;
 const pillarCharge=c.kind==='behemoth',chargeMechanic=['charge-wall','charge-pillars'].includes(c.mechanic),preparingCharge=c.casts.some(a=>a.kind==='charge');
 // A missed short dash must not strand the boss against a boundary out of reach of every pillar.
 if(pillarCharge&&c.phase==='mechanic'&&!c.charge&&!preparingCharge&&Math.hypot(c.boss.x-c.center.x,c.boss.y-c.center.y)>4){
  const dx=c.center.x-c.boss.x,dy=c.center.y-c.boss.y,d=Math.hypot(dx,dy),step=Math.min(d,170*dt),end=s.terrain.trace(c.boss.x,c.boss.y,c.boss.x+dx/d*step,c.boss.y+dy/d*step,c.boss.radius);
  c.boss.x=end.x;c.boss.y=end.y;
  if(end.blocked){const dir=s.terrain.direction(c.boss,c.center,c.boss.radius),len=Math.hypot(dir.x,dir.y);if(len){const detour=s.terrain.trace(c.boss.x,c.boss.y,c.boss.x+dir.x/len*step,c.boss.y+dir.y/len*step,c.boss.radius);c.boss.x=detour.x;c.boss.y=detour.y;}}
  c.nextObjectiveCast=Math.max(c.nextObjectiveCast,c.clock+.4);
 }
 if(c.phase==='mechanic'&&['beam-relays','cover','charge-wall','charge-pillars'].includes(c.mechanic)&&c.clock>=c.nextObjectiveCast){c.nextObjectiveCast=c.clock+(c.final?3.3:3.8);if(!c.charge&&!preparingCharge)cast(s,c,chargeMechanic?'charge':'beam');}
 if(c.clock>=c.attackAt){c.attackAt=c.clock+(c.final?2.8:3.5)*(c.tuning?.cadence||1);const kind=c.profile.patterns[c.patternStep++%c.profile.patterns.length];if(!(c.phase==='mechanic'&&chargeMechanic&&kind==='charge'))cast(s,c,kind);}
 const fired=c.casts.filter(a=>c.clock-a.born>=a.windup);c.casts=c.casts.filter(a=>c.clock-a.born<a.windup);for(const a of fired)fireCast(s,c,a);
 if(c.charge){const q=c.charge,t=Math.min(dt,q.remaining),speed=pillarCharge?BEHEMOTH_CHARGE_SPEED:470,from={x:c.boss.x,y:c.boss.y},end=s.terrain.trace(from.x,from.y,from.x+Math.cos(q.angle)*speed*t,from.y+Math.sin(q.angle)*speed*t,c.boss.radius);c.boss.x=end.x;c.boss.y=end.y;q.remaining-=t;
  if(segmentDistance(s,from.x,from.y,end.x,end.y)<c.boss.radius+playerRadius(s))hurtInArena(s,c.final?32:24);
  if(end.blocked){c.charge=null;const pillar=struckBehemothPillar(c,end);if(pillar){breakBehemothPillar(c,pillar);finishMechanic(s,c);}else mechanicWallHit(s,c);}else if(q.remaining<=0)c.charge=null;
 }
}
export function tickBossEncounters(s,dt){
 const c=s.crystalEncounter;if(!c)return false;
 if(!c.scripted){const ended=tickCrystalEncounter(s,dt);if(ended){s.completedEncounters??=[];if(!s.completedEncounters.includes(120))s.completedEncounters.push(120);s.defeatedEncounterBoss=s.defeatedCrystalBoss;return true;}if(c.phase!=='pull'&&c.profile?.patterns.length)tickPatterns(s,c,dt);tickArenaPressure(s,c,dt);return false;}
 if(c.boss.hp<=0)return completeScriptedEncounter(s);
 c.clock+=dt;
 if(c.phase==='pull'){c.pullTime+=dt;const t=Math.min(1,c.pullTime/.6),ease=1-(1-t)**3;s.x=c.pullFrom.x+(c.pullTo.x-c.pullFrom.x)*ease;s.y=c.pullFrom.y+(c.pullTo.y-c.pullFrom.y)*ease;if(t===1)startMechanic(s,c);return false;}
 if(c.redesigned)tickRaidPatterns(s,c,dt);else tickPatterns(s,c,dt);tickMechanic(s,c,dt);tickArenaPressure(s,c,dt);return false;
}
export function encounterInstruction(c){
 if(!c)return '';
 if(!c.scripted)return c.phase==='false-death'?`Interceptez les squelettes · ${c.absorbed} absorbé(s) · deux restaurent la vie du dragon`:'Détruisez le premier segment puis interceptez les squelettes';
 if(c.phase==='pull')return 'Arène scellée · préparez-vous';
 const prefix=c.phase==='combat'?`${Math.ceil(Math.max(0,c.vulnerableUntil-c.clock))} s pour attaquer`:c.final?`Mécanique ${c.mechanicIndex+1}/${c.profile.mechanics.length} · `:'';
 return prefix+(c.phase==='combat'?' · BARRIÈRE BRISÉE':c.hint||mechanicNames[c.mechanic]);
}
export function drawBossEncounters(ctx,s,ox,oy){
 const c=s.crystalEncounter;if(!c)return;drawArenaPressure(ctx,s,ox,oy);if(c.scripted)drawMechanic(ctx,s,c,ox,oy);if(c.redesigned)drawRaidPatterns(ctx,s,c,ox,oy);ctx.save();
 for(const a of c.redesigned?[]:c.casts||[]){const age=c.clock-a.born;ctx.strokeStyle=a.color;ctx.fillStyle=a.color;ctx.globalAlpha=.25+age/a.windup*.3;ctx.lineWidth=2;
  if(a.kind==='radial'){ctx.globalAlpha=.85;for(let i=0;i<8;i++){const angle=a.angle+i*Math.PI/4;ctx.beginPath();ctx.moveTo(a.x+ox+Math.cos(angle)*45,a.y+oy+Math.sin(angle)*45);ctx.lineTo(a.x+ox+Math.cos(angle)*100,a.y+oy+Math.sin(angle)*100);ctx.stroke();}}
  else if(a.kind==='meteor'||a.kind==='quake'){ctx.beginPath();ctx.arc((a.kind==='meteor'?a.tx:a.x)+ox,(a.kind==='meteor'?a.ty:a.y)+oy,a.kind==='meteor'?a.radius:210,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.9;ctx.stroke();}
  else{ctx.save();ctx.translate(a.x+ox,a.y+oy);ctx.rotate(a.angle);ctx.setLineDash([10,6]);ctx.strokeRect(0,a.kind==='charge'?-c.boss.radius:-16,a.kind==='charge'&&c.kind==='behemoth'?BEHEMOTH_CHARGE_DISTANCE:c.arenaHalf*3,a.kind==='charge'?c.boss.radius*2:32);ctx.restore();}
 }
 if(c.scripted&&c.phase==='pull'){ctx.strokeStyle='#ddd4ed';ctx.globalAlpha=1;ctx.lineWidth=3;const dx=s.x-c.boss.x,dy=s.y-c.boss.y,length=Math.hypot(dx,dy);ctx.translate(c.boss.x+ox,c.boss.y+oy);ctx.rotate(Math.atan2(dy,dx));for(let x=0;x<length;x+=14){ctx.beginPath();ctx.ellipse(x,0,10,5,0,0,Math.PI*2);ctx.stroke();}}
 ctx.restore();
}
