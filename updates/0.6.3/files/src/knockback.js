import {moveEntity} from './terrain.js';
import {equipmentEffects} from './model.js';

export function knockbackImmune(e){return Boolean(e.elite||e.roamingElite||e.superboss||e.miniboss||e.mechanicTarget||e.summoned||e.collisionMass>=1e6);}
export function applyKnockback(s,e){
 if(knockbackImmune(e)||e.hp<=0||e.dying)return false;
 const dx=e.x-s.x,dy=e.y-s.y,len=Math.hypot(dx,dy),distance=Math.min(156,26*equipmentEffects(s).knockback);
 e.knockback={dx:len?dx/len:(s.facing?-1:1),dy:len?dy/len:0,remaining:.14,speed:distance/.14};return true;
}
export function tickKnockback(s,e,dt){
 const k=e.knockback;if(!k)return false;
 if(knockbackImmune(e)||e.hp<=0||e.dying){e.knockback=null;return false;}
 const step=Math.min(dt,k.remaining);moveEntity(s.terrain,e,k.dx*k.speed*step,k.dy*k.speed*step,e.radius||16);k.remaining-=step;
 if(k.remaining<=1e-8)e.knockback=null;
 return true;
}
