import {playerRadius} from './hitboxes.js';
export const PORTAL_DURATION=.9;
export const ordinaryHealthMultipliers={normal:2,crystal:3,light:4.5,aeon:6,primal:8,transcendence:10};
export function roamingHealth(s,profile,elite=false){return (28+s.time*.22)*s.difficulty.hp*profile.hp*(elite?6:(ordinaryHealthMultipliers[s.difficulty.id]??2)); }
export function spawnDensity(time){return 1.5+1.5*Math.max(0,Math.min(1,time/90));}
export function spawnInterval(s){return Math.max(.2,1-s.time/400)/s.stage.rate/spawnDensity(s.time)/(s.difficulty?.density||1);}
export function monsterSize(profile,elite=false){const ordinary=(profile.size||40)*1.5;return elite?Math.max(84,ordinary*1.5):ordinary;}

/** Announced arrivals inside the playable room, independent of camera zoom. */
export function nearbySpawnPoint(s,radius,random=Math.random){
 const min=Math.max(320,playerRadius(s)+radius+220),max=600,terrain=s.terrain;
 const free=p=>terrain.walkable(p.x,p.y,radius)&&Math.hypot(p.x-s.x,p.y-s.y)>=min
  &&(s.enemies||[]).every(e=>e.hp<=0||e.dying||Math.hypot(p.x-e.x,p.y-e.y)>=radius+(e.radius||16)+6);
 for(let i=0;i<64;i++){
  const a=random()*Math.PI*2,d=Math.sqrt(min*min+random()*(max*max-min*min)),p={x:s.x+Math.cos(a)*d,y:s.y+Math.sin(a)*d};
  if(free(p))return p;
 }
 const candidates=[];
 for(const index of terrain.floor){const p=terrain.center(index),d=Math.hypot(p.x-s.x,p.y-s.y);if(d<=max&&free(p))candidates.push(p);}
 return candidates.length?candidates[Math.min(candidates.length-1,Math.floor(random()*candidates.length))]:null;
}
export function addSpawnPortal(s,e){
 s.spawnPortals??=[];s.spawnPortals.push({x:e.x,y:e.y,radius:Math.max(20,e.radius*1.15),elite:e.elite,life:1.25,maxLife:1.25});
}
export function tickSpawnPortals(s,dt){
 if(s.phase!=='survival'){s.spawnPortals=[];return;}
 s.spawnPortals=(s.spawnPortals||[]).filter(p=>(p.life-=dt)>0);
}
export function emergenceScale(e){return e.portalSpawn?Math.max(0,Math.min(1,(PORTAL_DURATION-(e.spawnProtection||0)-.2)/.7)):1;}
export function roamingEliteDue(s){
 if(s.phase!=='survival'||s.crystalEncounter)return false;
 const interval=30/(s.difficulty?.eliteDensity||1),slot=Math.floor((s.time+1e-6)/interval),due=slot*interval;
 if(slot<=0||Math.abs(due/120-Math.round(due/120))<1e-6||slot===s.lastRoamingEliteSlot)return false;
 s.lastRoamingEliteSlot=slot;return true;
}
export function drawSpawnPortals(ctx,s,ox,oy){
 ctx.save();
 for(const p of s.spawnPortals||[]){
  const age=p.maxLife-p.life,opening=Math.min(1,age/.25),fade=Math.min(1,p.life/.25),r=p.radius*opening,x=p.x+ox,y=p.y+oy;
  ctx.globalAlpha=.85*fade;ctx.fillStyle='#05030e';ctx.beginPath();ctx.ellipse(x,y,r,r*.48,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=p.elite?'#cda75b':'#76539c';ctx.lineWidth=p.elite?3:2;ctx.stroke();
  ctx.strokeStyle='#b39ad9';ctx.globalAlpha=.6*fade;ctx.lineWidth=2;
  for(let i=0;i<3;i++){const angle=age*4+i*Math.PI*2/3;ctx.beginPath();ctx.ellipse(x,y,r*(.5+i*.12),r*.22,angle,0,Math.PI*1.4);ctx.stroke();}
 }
 ctx.restore();
}
