import {hurtInArena} from './arena-pressure.js';
import {raidBeamHit,raidRamHit} from './raid-mechanics.js';
import {raidPalettes} from './raid-art.js';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function line(ctx,points,color,width){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
export function scheduleRaidAttack(s,c,spec,options={}){
 const angle=options.angle??Math.atan2(s.y-c.boss.y,s.x-c.boss.x),base={...spec,x:c.boss.x,y:c.boss.y,tx:s.x,ty:s.y,angle,born:c.clock,windup:c.rules.windup,revision:c.revision,color:raidPalettes[c.profile.theme].light,...options};
 const add=(type,extra={})=>{const cast={...base,type,...extra};c.casts.push(cast);return cast;};
 if(spec.type==='meteors'){for(let i=0;i<3+(c.rules.rank>=4?1:0);i++){const a=i*2.4;add('meteor',{tx:s.x+(i?Math.cos(a)*95:0),ty:s.y+(i?Math.sin(a)*95:0),radius:48,windup:base.windup+.25});}}
 else if(spec.type==='cross'){for(let i=0;i<4;i++)add('beam',{angle:angle+i*Math.PI/2});}
 else if(spec.type==='sides'){for(const n of [-1,1])for(const offset of [-72,72])add('beam',{x:c.center.x+n*(c.arenaHalf-72),y:c.center.y+offset,angle:n<0?0:Math.PI});}
 else if(spec.type==='march'){for(let i=0;i<5;i++)add('meteor',{tx:c.center.x+(i-2)*120,ty:s.y,radius:62,windup:base.windup+i*.38});}
 else if(spec.type==='double-beam'||spec.type==='double-charge'){
  add(spec.type==='double-beam'?'beam':'charge',{element:options.element||'fire'});
  c.followups??=[];c.followups.push({at:c.clock+base.windup+2.8,spec:{...spec,type:spec.type==='double-beam'?'beam':'charge'},options:{element:'ice',followup:true}});
 }else if(spec.type==='nova'){add('beam');add('donut',{windup:base.windup+1.4,radius:205,outer:c.arenaHalf*1.8});}
 else if(spec.type==='spiral'){add('fan',{shots:7});c.followups??=[];c.followups.push({at:c.clock+base.windup+.65,spec:{...spec,type:'fan'},options:{angle:angle+.38,shots:7,followup:true}});}
 else add(spec.type,{radius:spec.type==='donut'?195:spec.type==='quake'?220:undefined,outer:c.arenaHalf*1.8});
 c.boss.anim.play('attack');c.attackHistory??=[];c.attackHistory.push({id:spec.id,name:spec.name,clock:c.clock});
 return c.casts;
}
function fire(s,c,a){
 const color=a.element==='fire'?'#ffae82':a.element==='ice'?'#a1e9ff':a.color,base={owner:c.boss,x:a.x,y:a.y,damage:c.final?26:19,age:0,color,radius:9,life:4};
 if(a.type==='beam'){
  raidBeamHit(s,c,a);s.hostileProjectiles.push({...base,kind:'beam',angle:a.angle,length:a.blockedLength??c.arenaHalf*3,life:.3});
 }else if(a.type==='fan'){
  const count=a.shots||5+Math.floor(c.rules.rank/2);for(let i=0;i<count;i++){const angle=a.angle+(i-(count-1)/2)*.22;s.hostileProjectiles.push({...base,kind:a.element==='ice'?'ice':'bomb',angle,vx:Math.cos(angle)*185,vy:Math.sin(angle)*185});}
 }else if(a.type==='ring'){
  const count=14+c.rules.rank,gap=a.angle;for(let i=0;i<count;i++){const angle=gap+i*Math.PI*2/count;if(i<=1||i>=count-1)continue;s.hostileProjectiles.push({...base,kind:'bomb',angle,vx:Math.cos(angle)*160,vy:Math.sin(angle)*160,radius:10});}
 }else if(a.type==='meteor')s.hostileProjectiles.push({...base,kind:'meteor',x:a.tx,y:a.ty,radius:a.radius,life:.25});
 else if(a.type==='charge')c.charge={angle:a.angle,remaining:1,speed:390,revision:a.revision};
 else c.raidHazards.push({...a,activeAt:c.clock,expires:c.clock+.45,damage:25,hit:false});
 c.raidEffects.push({x:a.type==='meteor'?a.tx:a.x,y:a.type==='meteor'?a.ty:a.y,born:c.clock,color});
}
function patternObjective(s,c){
 if(c.phase!=='mechanic'||c.clock<c.nextObjectiveCast)return;
 const kind=c.activeMechanic.kind;if(!['reflect','thermal','shelter','ram'].includes(kind))return;
 const offset=dist(c.boss,c.center);
 if(kind==='ram'&&(c.charge||c.casts.some(a=>a.type==='charge')||offset>12))return;
 c.nextObjectiveCast=c.clock+(kind==='thermal'?4.5:4.6);const element=kind==='thermal'?(c.objectiveShot++%2?'ice':'fire'):undefined;
 scheduleRaidAttack(s,c,{id:'objective-'+c.mechanic,name:c.activeMechanic.name,type:kind==='ram'?'charge':'beam'},{element,objective:true});
}
export function tickRaidPatterns(s,c,dt){
 c.raidHazards??=[];c.raidEffects??=[];c.followups??=[];
 const ram=c.phase==='mechanic'&&c.activeMechanic?.kind==='ram';
 if(ram&&!c.charge&&!c.casts.some(a=>a.type==='charge')&&dist(c.boss,c.center)>4){
  const dir=s.terrain.direction(c.boss,c.center,c.boss.radius),len=Math.hypot(dir.x,dir.y)||1,step=Math.min(160*dt,dist(c.boss,c.center)),end=s.terrain.trace(c.boss.x,c.boss.y,c.boss.x+dir.x/len*step,c.boss.y+dir.y/len*step,c.boss.radius);c.boss.x=end.x;c.boss.y=end.y;
 }
 patternObjective(s,c);
 for(const f of c.followups.filter(f=>c.clock>=f.at))scheduleRaidAttack(s,c,f.spec,f.options);c.followups=c.followups.filter(f=>c.clock<f.at);
 // Astrolabe targeting is a deliberate placement sequence; attacks resume during exposure/combat.
 const placement=c.phase==='mechanic'&&c.activeMechanic?.kind==='meteor-core'&&c.mechanicMeteor;
 if(c.clock>=c.attackAt&&!placement){
  const specs=c.profile.attackSpecs,spec=specs[c.patternStep++%specs.length];c.attackAt=c.clock+(6.4-c.rules.rank*.3);
  if(!(ram&&spec.type.includes('charge')))scheduleRaidAttack(s,c,spec);
 }
 const ready=c.casts.filter(a=>c.clock-a.born>=a.windup);c.casts=c.casts.filter(a=>c.clock-a.born<a.windup);for(const a of ready)if(a.revision===c.revision)fire(s,c,a);
 if(c.charge){const q=c.charge,t=Math.min(dt,q.remaining),from={x:c.boss.x,y:c.boss.y},end=s.terrain.trace(from.x,from.y,from.x+Math.cos(q.angle)*q.speed*t,from.y+Math.sin(q.angle)*q.speed*t,c.boss.radius);c.boss.x=end.x;c.boss.y=end.y;q.remaining-=t;
  const dx=end.x-from.x,dy=end.y-from.y,u=Math.max(0,Math.min(1,((s.x-from.x)*dx+(s.y-from.y)*dy)/(dx*dx+dy*dy||1)));if(Math.hypot(s.x-from.x-dx*u,s.y-from.y-dy*u)<c.boss.radius+(s.radius||14))hurtInArena(s,27);
  if(end.blocked){c.charge=null;raidRamHit(s,c,end);}else if(q.remaining<=0)c.charge=null;
 }
 for(const a of c.raidHazards){if(a.hit)continue;const distance=dist(s,a),angle=Math.atan2(s.y-a.y,s.x-a.x),diff=Math.abs(Math.atan2(Math.sin(angle-a.angle),Math.cos(angle-a.angle)));
  const hit=a.type==='cone'?distance<440&&diff<.6:a.type==='donut'?distance>a.radius-14&&distance<a.outer:a.type==='quake'?Math.abs(distance-220)<30:false;
  if(hit&&hurtInArena(s,a.damage))a.hit=true;
 }
 c.raidHazards=c.raidHazards.filter(a=>c.clock<a.expires);c.reflections=(c.reflections||[]).filter(r=>c.clock-r.born<.5);
}
function paint(ctx,c,a,ox,oy,active=false){
 const ratio=Math.max(0,Math.min(1,(c.clock-a.born)/a.windup)),x=a.x+ox,y=a.y+oy,col=active?'#ffdbb0':'#f3b47e';
 ctx.save();ctx.translate(x,y);ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=3;
 if(a.type==='beam'||a.type==='charge'){
  ctx.rotate(a.angle);const length=a.type==='charge'?390:c.arenaHalf*3,width=a.type==='charge'?c.boss.radius*2:30;
  ctx.globalAlpha=.11+ratio*.12;ctx.fillRect(0,-width/2,length,width);ctx.globalAlpha=.95;line(ctx,[[0,-width/2],[length,-width/2]],col,2);line(ctx,[[0,width/2],[length,width/2]],col,2);
  for(let d=70;d<length;d+=100){line(ctx,[[d-13,-8],[d,0],[d-13,8]],'#ffe5b5',2);}line(ctx,[[0,-width/2],[length*ratio,-width/2]],'#fff0d0',5);
 }else if(a.type==='meteor'){
  const tx=a.tx-a.x,ty=a.ty-a.y,r=a.radius;ctx.globalAlpha=.16;ctx.beginPath();ctx.arc(tx,ty,r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.95;ctx.stroke();ctx.beginPath();ctx.arc(tx,ty,r+5,-Math.PI/2,-Math.PI/2+Math.PI*2*ratio);ctx.strokeStyle='#fff0bd';ctx.lineWidth=4;ctx.stroke();
  if(ratio>.55){const yy=ty-(1-ratio)*210;line(ctx,[[tx,yy-35],[tx,yy]],'#ffbd8566',11);ctx.fillStyle='#ffe6b9';ctx.beginPath();ctx.arc(tx,yy,8,0,Math.PI*2);ctx.fill();}
 }else if(a.type==='cone'){
  ctx.rotate(a.angle);ctx.globalAlpha=.15;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,440,-.6,.6);ctx.closePath();ctx.fill();ctx.globalAlpha=.9;ctx.stroke();
 }else if(a.type==='donut'){
  ctx.globalAlpha=.14;ctx.beginPath();ctx.arc(0,0,a.outer,0,Math.PI*2);ctx.arc(0,0,a.radius,0,Math.PI*2,true);ctx.fill();ctx.globalAlpha=.95;ctx.beginPath();ctx.arc(0,0,a.radius,0,Math.PI*2);ctx.stroke();
 }else if(a.type==='ring'){
  ctx.rotate(a.angle);ctx.globalAlpha=.8;for(let i=2;i<13;i++){const angle=i*Math.PI*2/14;line(ctx,[[Math.cos(angle)*80,Math.sin(angle)*80],[Math.cos(angle)*125,Math.sin(angle)*125]],col,3);}ctx.strokeStyle='#a8e9d4';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,130,-.4,.4);ctx.stroke();
 }else if(a.type==='quake'){ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(0,0,220*ratio,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=.18;ctx.beginPath();ctx.arc(0,0,220,0,Math.PI*2);ctx.stroke();}
 else{ctx.rotate(a.angle);for(let i=-2;i<=2;i++){const angle=i*.22;line(ctx,[[Math.cos(angle)*80,Math.sin(angle)*80],[Math.cos(angle)*145,Math.sin(angle)*145]],col,3);}}
 ctx.restore();
}
export function drawRaidPatterns(ctx,s,c,ox,oy){
 for(const a of c.casts)paint(ctx,c,a,ox,oy);for(const a of c.raidHazards||[])paint(ctx,c,a,ox,oy,true);
 for(const r of c.reflections||[]){ctx.save();ctx.globalAlpha=1-(c.clock-r.born)/.5;line(ctx,[[r.x+ox,r.y+oy],[r.tx+ox,r.ty+oy]],'#caffee',6);ctx.restore();}
 const m=c.mechanicMeteor;if(m){paint(ctx,c,{...m,type:'meteor',tx:m.x,ty:m.y,x:m.x,y:m.y,windup:m.duration},ox,oy);}
}
