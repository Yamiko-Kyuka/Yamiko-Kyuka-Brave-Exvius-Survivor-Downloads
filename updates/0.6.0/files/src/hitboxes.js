import {moveEntity} from './terrain.js';
import {enemyRadius} from './enemy-collisions.js';

export const PLAYER_RADIUS=14;
export const playerRadius=s=>s.radius??PLAYER_RADIUS;
export const isBoss=e=>Boolean(e.elite||e.miniboss||e.superboss);
const alive=e=>e.hp>0&&!e.dying;
const radius=e=>e.radius??enemyRadius(e.size,isBoss(e));

/** Boss bodies are solid, including false death; walking and dashing share this check. */
export function movePlayer(s,dx,dy){
 const bosses=(s.enemies||[]).filter(e=>isBoss(e)&&alive(e));
 if(!bosses.length)return moveEntity(s.terrain,s,dx,dy,playerRadius(s));
 const terrain={walkable:(x,y,r)=>{
  if(s.terrain&&!s.terrain.walkable(x,y,r))return false;
  return bosses.every(e=>Math.hypot(x-e.x,y-e.y)>=r+radius(e)-.01);
 }};
 moveEntity(terrain,s,dx,dy,playerRadius(s));
}
/** A moving boss cannot stack its body on the player. Walls also constrain separation. */
export function separatePlayerBosses(s){
 if(s.crystalEncounter?.phase==='pull')return;
 for(let pass=0;pass<3;pass++)for(const e of s.enemies||[]){
  if(!isBoss(e)||!alive(e))continue;
  const dx=s.x-e.x,dy=s.y-e.y,d=Math.hypot(dx,dy),reach=playerRadius(s)+radius(e);
  if(d>=reach-.01)continue;
  const nx=d>1e-8?dx/d:1,ny=d>1e-8?dy/d:0,overlap=reach-d,from={x:s.x,y:s.y};
  moveEntity(s.terrain,s,nx*overlap,ny*overlap,playerRadius(s));
  const moved=Math.max(0,(s.x-from.x)*nx+(s.y-from.y)*ny);
  if(overlap-moved>.01&&(!e.miniboss||e.mobileBoss))moveEntity(s.terrain,e,-nx*(overlap-moved),-ny*(overlap-moved),radius(e));
 }
}

/** Ground markers use the same world-space centers and radii as collision checks. */
export function drawHitboxes(ctx,s,ox,oy){
 const ring=(entity,r,boss)=>{
  const color=boss?'#ff465f':'#91e9dd',x=entity.x+ox,y=entity.y+oy;
  ctx.save();ctx.strokeStyle=color;ctx.fillStyle=color;ctx.globalAlpha=.16;
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.85;ctx.strokeStyle='#121827';ctx.lineWidth=(boss?8:5)/(s.zoom||1);ctx.stroke();
  ctx.strokeStyle=color;ctx.globalAlpha=entity.fakeDeath ? .85 : 1;ctx.lineWidth=(boss?4:2.5)/(s.zoom||1);ctx.stroke();
  if(boss){ctx.lineWidth=4/(s.zoom||1);for(let i=0;i<4;i++){const a=i*Math.PI/2;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*(r-4),y+Math.sin(a)*(r-4));ctx.lineTo(x+Math.cos(a)*(r+3),y+Math.sin(a)*(r+3));ctx.stroke();}}
  ctx.restore();
 };
 for(const e of s.enemies||[])if(isBoss(e)&&alive(e))ring(e,radius(e),true);
 if(!s.over&&!s.ending)ring(s,playerRadius(s),false);
}
