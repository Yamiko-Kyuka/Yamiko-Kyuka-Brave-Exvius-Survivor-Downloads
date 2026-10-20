import {TILE,ORIGIN} from './terrain.js';

export const BEHEMOTH_CHARGE_DISTANCE=390;
export const BEHEMOTH_CHARGE_SPEED=390;

/** A single intact pillar breaks the shield. Broken columns persist across phases. */
export function prepareBehemothPillars(c){
 if(c.pillars?.some(p=>!p.broken))return;
 const cx=Math.round((c.center.x-ORIGIN)/TILE),cy=Math.round((c.center.y-ORIGIN)/TILE);
 c.pillars=[[0,-4,'NORD'],[-4,3,'SUD-OUEST'],[3,3,'SUD-EST']].map(([dx,dy,label],index)=>({x:cx+dx,y:cy+dy,w:1,h:1,art:3,mechanicPillar:true,index,label,name:'Pilier '+label.toLowerCase(),broken:false}));
}
export function pillarProps(c){return (c.pillars||[]).filter(p=>!p.broken);}
export function pillarCenter(p){return {x:ORIGIN+(p.x+.5)*TILE,y:ORIGIN+(p.y+.5)*TILE};}

/** Terrain.trace stops just before contact; only the matching solid footprint counts. */
export function struckBehemothPillar(c,end){
 if(c.phase!=='mechanic'||c.mechanic!=='charge-pillars'||!end.blocked)return null;
 return (c.pillars||[]).find(p=>{
  if(p.broken)return false;
  const x=ORIGIN+p.x*TILE,y=ORIGIN+p.y*TILE;
  return Math.hypot(end.x-Math.max(x,Math.min(end.x,x+TILE)),end.y-Math.max(y,Math.min(end.y,y+TILE)))<=c.boss.radius+7;
 })||null;
}
export function breakBehemothPillar(c,p){p.broken=true;p.brokenAt=c.clock;}

/** Chunky Zanarkand stone columns, with the exact solid base visibly outlined. */
export function drawBehemothPillars(ctx,c,ox,oy){
 if(!c.pillars)return;
 ctx.save();ctx.imageSmoothingEnabled=false;
 for(const p of c.pillars){
  const center=pillarCenter(p),x=Math.round(center.x+ox),y=Math.round(center.y+oy),age=c.clock-(p.brokenAt??c.clock);
  ctx.fillStyle='#07121c99';ctx.beginPath();ctx.ellipse(x+8,y+19,44,23,0,0,Math.PI*2);ctx.fill();
  if(p.broken){
   ctx.fillStyle='#334754';ctx.fillRect(x-30,y-14,60,35);ctx.fillStyle='#78919a';
   for(let i=0;i<7;i++){const a=i*2.4,flight=Math.max(0,1-age/.55),spread=20+Math.min(1,age/.5)*28,px=x+Math.cos(a)*spread,py=y+Math.sin(a)*spread*.5-Math.sin(Math.min(1,age/.55)*Math.PI)*38*flight;ctx.fillRect(Math.round(px)-6,Math.round(py)-6,12,9);}
   if(age<.8){ctx.globalAlpha=(1-age/.8)*.65;ctx.fillStyle='#c5c1a0';ctx.beginPath();ctx.ellipse(x,y-12,30+age*45,18+age*20,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
   continue;
  }
  ctx.fillStyle='#172e3b';ctx.fillRect(x-32,y-32,64,64);
  ctx.strokeStyle=c.phase==='mechanic'?'#f1d58c':'#728d9b';ctx.lineWidth=3;ctx.strokeRect(x-31,y-31,62,62);
  ctx.fillStyle='#8fa8ae';ctx.fillRect(x-28,y-28,56,18);ctx.fillRect(x-25,y-125,50,17);
  ctx.fillStyle='#536f7d';ctx.fillRect(x-19,y-108,38,82);
  ctx.fillStyle='#9bb7bc';ctx.fillRect(x-19,y-108,9,82);
  ctx.fillStyle='#344e61';ctx.fillRect(x+10,y-108,9,82);
  ctx.fillStyle='#708c98';ctx.fillRect(x-29,y-132,58,10);ctx.fillRect(x-25,y-17,50,12);
  ctx.strokeStyle='#294658';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+8,y-106);ctx.lineTo(x-4,y-85);ctx.lineTo(x+4,y-71);ctx.lineTo(x-9,y-54);ctx.stroke();
 }
 ctx.restore();
}
