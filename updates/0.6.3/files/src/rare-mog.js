import {moveEntity} from './terrain.js';
export const RARE_MOG_CHANCE=.00001,RARE_MOG_GILS=50000,RARE_MOG_LIFETIME=30;
export function rollRareMog(random=Math.random){return random()<RARE_MOG_CHANCE;}
export function rareMogHealth(s){return Math.ceil((12000+s.time*20)*s.difficulty.hp);}
export function rareMogReward(e){if(!e.rareMog||e.hp>0||e.escaped||e.rewarded)return 0;e.rewarded=true;return RARE_MOG_GILS;}
export function tickRareMog(s,e,dt){
 if(!e.rareMog||e.hp<=0||e.dying||e.spawnProtection>0)return false;
 e.rareMogTime=(e.rareMogTime||0)+dt;
 if(e.rareMogTime>=RARE_MOG_LIFETIME){e.escaped=true;e.hp=0;e.dying=.001;e.deathDuration=.5;s.pickupNotice={name:'Le Roi Mog s’est enfui…',life:2.5};return true;}
 const dx=e.x-s.x,dy=e.y-s.y,len=Math.hypot(dx,dy)||1;
 moveEntity(s.terrain,e,dx/len*45*dt,dy/len*45*dt,e.radius);e.facing=dx<0;return true;
}
export function drawRareMog(ctx,s,e,ox,oy){
 if(!e.rareMog||e.dying||e.spawnProtection>0)return;
 ctx.save();ctx.font='bold '+Math.round(13/s.zoom)+'px Arial';ctx.textAlign='center';ctx.lineWidth=3/s.zoom;ctx.strokeStyle='#091327';ctx.fillStyle='#ffe093';
 const text='Roi Mog · '+Math.max(0,Math.ceil(RARE_MOG_LIFETIME-(e.rareMogTime||0)))+' s';ctx.strokeText(text,e.x+ox,e.y+oy+25);ctx.fillText(text,e.x+ox,e.y+oy+25);ctx.restore();
}
