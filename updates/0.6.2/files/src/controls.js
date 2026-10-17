import {movePlayer} from './hitboxes.js';
export function screenAim(s,point,width,height){
 if(!point?.active)return null;
 return {x:s.x+(point.x-width/2)/s.zoom,y:s.y+(point.y-height/2)/s.zoom,active:true};
}
export function startDash(s){
 if(!s||s.crystalEncounter?.phase==='pull'||s.paused||s.over||s.ending||s.dash||s.dodgeCooldown>0)return false;
 const dx=s.aim?.active?s.aim.x-s.x:(s.facing?-1:1),dy=s.aim?.active?s.aim.y-s.y:0,length=Math.hypot(dx,dy);
 if(length<1)return false;
 s.dash={dx:dx/length,dy:dy/length,remaining:.16};s.dodgeCooldown=1.1;s.invuln=Math.max(s.invuln,.22);s.facing=dx<0;
 // An evade can interrupt an attack, but never grants a free hit on interruption.
 s.action=null;s.anim.sequence=[];s.anim.onComplete=null;s.anim.play('dodge');
 return true;
}
export function tickDash(s,dt){
 if(!s.dash)return false;const t=Math.min(dt,s.dash.remaining);
 const from={x:s.x,y:s.y};movePlayer(s,s.dash.dx*(110/.16)*t,s.dash.dy*(110/.16)*t);s.dash.remaining-=t;
 s.effects.push({kind:'dash',...from,tx:s.x,ty:s.y,color:'#b5edff',life:.16,maxLife:.16});
 if(s.dash.remaining<=1e-8){s.dash=null;if(s.anim.event==='dodge'){s.anim.sequence=[];s.anim.elapsed=0;s.anim.event=s.anim.base;}}return true;
}
/** FFBE heroes are drawn facing left; monsters usually face right. */
export function spriteFlip(facingLeft,nativeFacing='left'){
 return nativeFacing==='left'?!facingLeft:Boolean(facingLeft);
}
