import {recordBossDamage} from './boss-rating.js';
import {mitigatedDamage} from './permanent-upgrades.js';
import {playerRadius} from './hitboxes.js';
import {tickEliteAttacks,drawEliteTelegraphs} from './elite-attacks.js';
/** Telegraphs lock their target before impact, giving the player time to aim a dash. */
const specs={
 'jenova-radiance':{name:'Rayonnement de Jenova',windup:1.1,cooldown:4,color:'#85e4e9',kind:'beam'},
 'jecht-shot':{name:'Jecht Shot',windup:.95,cooldown:4,color:'#ffaf6c',kind:'salvo'},
 'emperor-cyclone':{name:'Cyclone impérial',windup:1.1,cooldown:5,color:'#deb2ff',kind:'cyclone'},
 'darkness-particles':{name:'Faisceau de particules',windup:1.2,cooldown:4.5,color:'#b6f4a3',kind:'beam'},
 'scorpion-laser':{name:'Laser de queue',windup:.9,cooldown:5,color:'#7effc3',kind:'beam'},
 'mako-salvo':{name:'Big Bomber',windup:.85,cooldown:5,color:'#ffbc79',kind:'salvo'},
 'behemoth-quake':{name:'Choc tellurique',windup:1,cooldown:6,color:'#f2b19b',kind:'quake'},
 'xande-meteor':{name:'Météore',windup:1.2,cooldown:6,color:'#ffad83',kind:'meteor'},
 'cerberus-thunder':{name:'Triple Foudre',windup:.85,cooldown:5,color:'#dba8ff',kind:'triple'},
 'twin-breath':{name:'Double souffle',windup:1,cooldown:6,color:'#bbd8ff',kind:'twin'}
};
function hurt(s,amount){if(s.invuln>0||s.godMode||s.ending||s.over)return false;const received=mitigatedDamage(s,amount*s.difficulty.damage);recordBossDamage(s,received);s.hp-=received;s.invuln=.65;return true;}
export function tickEnemyAttacks(s,dt){
 s.hostileProjectiles??=[];
 tickEliteAttacks(s,dt);
 for(const e of s.enemies){
  const spec=specs[e.special];if(!spec||!e.elite||e.spawnProtection>0)continue;
  if(e.dying||e.hp<=0){e.specialCharge=null;continue;}
  e.specialCooldown=(e.specialCooldown??2)-dt;
  if(!e.specialCharge&&e.specialCooldown<=0&&Math.hypot(e.x-s.x,e.y-s.y)<620){
   e.specialCharge={...spec,elapsed:0,angle:Math.atan2(s.y-e.y,s.x-e.x),tx:s.x,ty:s.y,ox:e.x,oy:e.y};e.anim?.play('attack');
  }
  const charge=e.specialCharge;if(!charge)continue;charge.elapsed+=dt;
  if(charge.elapsed<charge.windup)continue;
  const base={owner:e,x:charge.ox,y:charge.oy,damage:20,age:0,life:3,color:spec.color,radius:11,kind:spec.kind};
  if(spec.kind==='cyclone'){for(let i=0;i<12;i++){const a=i*Math.PI/6+charge.angle;s.hostileProjectiles.push({...base,kind:'bomb',vx:Math.cos(a)*165,vy:Math.sin(a)*165,angle:a,radius:17,life:5});}}
  else if(spec.kind==='beam')s.hostileProjectiles.push({...base,angle:charge.angle,length:700,life:.32,damage:24});
  else if(spec.kind==='meteor')for(const offset of [[0,0],[-65,35],[65,-35]])s.hostileProjectiles.push({...base,x:charge.tx+offset[0],y:charge.ty+offset[1],life:.18,radius:45,damage:24});
  else if(spec.kind==='quake')s.hostileProjectiles.push({...base,life:.6,maxRadius:155,radius:0,damage:22});
  else{
   const count=spec.kind==='salvo'?5:spec.kind==='triple'?3:6;
   for(let i=0;i<count;i++){const a=charge.angle+(i-(count-1)/2)*.2;const speed=spec.kind==='salvo'?180:240;
    s.hostileProjectiles.push({...base,kind:spec.kind==='twin'?(i%2?'ice':'fire'):spec.kind==='triple'?'lightning':'bomb',color:spec.kind==='twin'?(i%2?'#91dbff':'#ff985d'):spec.color,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,angle:a});
   }
  }
  e.specialCharge=null;e.specialCooldown=spec.cooldown*(e.superboss&&e.hp<e.maxHp*.5?.75:1);
 }
 const fragments=[];
 const splitStone=p=>{if(p.splitDone)return;p.splitDone=true;p.life=0;for(const offset of [-Math.PI/2,Math.PI/2]){const angle=p.angle+offset;fragments.push({owner:p.owner,x:p.x,y:p.y,damage:p.damage*.45,age:0,life:1.8,color:p.color,radius:5,kind:'stone-fragment',angle,vx:Math.cos(angle)*160,vy:Math.sin(angle)*160});}};
 for(const p of s.hostileProjectiles){
  p.age+=dt;p.life-=dt;
  if(p.kind==='hell-globe'){
   if(p.age>=p.detonateAt&&!p.detonated){p.detonated=true;if(Math.hypot(s.x-p.x,s.y-p.y)<p.radius+playerRadius(s))hurt(s,p.damage);s.effects??=[];s.effects.push({kind:'explosion',x:p.x,y:p.y,radius:p.radius,color:p.color,life:.3,maxLife:.3});}
  }else if(p.kind==='beam'){
   if(s.terrain){const end=s.terrain.trace(p.x,p.y,p.x+Math.cos(p.angle)*p.length,p.y+Math.sin(p.angle)*p.length);p.length=Math.hypot(end.x-p.x,end.y-p.y);}const dx=s.x-p.x,dy=s.y-p.y,along=dx*Math.cos(p.angle)+dy*Math.sin(p.angle),across=Math.abs(-dx*Math.sin(p.angle)+dy*Math.cos(p.angle));
   if(!p.hit&&along>0&&along<p.length&&across<18+playerRadius(s)&&hurt(s,p.damage))p.hit=true;
  }else if(p.kind==='meteor'){
   if(!p.hit&&Math.hypot(s.x-p.x,s.y-p.y)<p.radius+playerRadius(s)&&hurt(s,p.damage))p.hit=true;
  }else if(p.kind==='quake'){
   p.radius=Math.min(p.maxRadius,p.age/.6*p.maxRadius);
   if(!p.hit&&Math.abs(Math.hypot(s.x-p.x,s.y-p.y)-p.radius)<7+playerRadius(s)&&hurt(s,p.damage))p.hit=true;
  }else{
   if(p.drag){const factor=Math.exp(-p.drag*dt);p.vx*=factor;p.vy*=factor;}
   const end=s.terrain?.trace(p.x,p.y,p.x+p.vx*dt,p.y+p.vy*dt,2);if(end){p.x=end.x;p.y=end.y;if(end.blocked)p.life=0;}else{p.x+=p.vx*dt;p.y+=p.vy*dt;}
   if(p.splitAfter&&(p.age>=p.splitAfter||end?.blocked)){
    splitStone(p);
   }
   if(end?.blocked)continue;
   if(Math.hypot(s.x-p.x,s.y-p.y)<p.radius+playerRadius(s)&&hurt(s,p.damage)){if(p.splitAfter)splitStone(p);p.life=0;}
  }
 }
 s.hostileProjectiles=s.hostileProjectiles.filter(p=>p.life>0);s.hostileProjectiles.push(...fragments);
}
export function drawEnemyAttacks(ctx,s,ox,oy){
 drawEliteTelegraphs(ctx,s,ox,oy);
 ctx.save();
 for(const e of s.enemies){
  const c=e.specialCharge;if(!c)continue;ctx.save();ctx.strokeStyle=c.color;ctx.fillStyle=c.color;ctx.lineWidth=2;
  const pulse=.2+.2*c.elapsed/c.windup;
  if(c.kind==='meteor')for(const [dx,dy]of [[0,0],[-65,35],[65,-35]]){ctx.globalAlpha=pulse;ctx.beginPath();ctx.arc(c.tx+dx+ox,c.ty+dy+oy,45,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.8;ctx.stroke();}
  else if(c.kind==='quake'){ctx.globalAlpha=pulse;ctx.beginPath();ctx.arc(c.ox+ox,c.oy+oy,155,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.8;ctx.stroke();}
  else{ctx.translate(c.ox+ox,c.oy+oy);ctx.rotate(c.angle);ctx.globalAlpha=pulse;ctx.beginPath();ctx.moveTo(0,0);if(c.kind==='beam'){ctx.lineTo(700,-22);ctx.lineTo(700,22);}else{ctx.lineTo(540,-180);ctx.lineTo(540,180);}ctx.closePath();ctx.fill();ctx.globalAlpha=.7;ctx.setLineDash([8,8]);ctx.stroke();}
  ctx.restore();ctx.globalAlpha=1;ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.strokeStyle='#0b1024';ctx.lineWidth=3;ctx.strokeText(c.name,e.x+ox,e.y+oy-e.size-8);ctx.fillStyle='#fff0c3';ctx.fillText(c.name,e.x+ox,e.y+oy-e.size-8);
 }
 for(const p of s.hostileProjectiles){
  ctx.save();ctx.translate(p.x+ox,p.y+oy);ctx.fillStyle=ctx.strokeStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=8;
  if(p.kind==='beam'){ctx.rotate(p.angle);ctx.globalAlpha=Math.min(1,p.life/.12);ctx.fillRect(0,-18,p.length,36);ctx.fillStyle='#eaffef';ctx.fillRect(0,-4,p.length,8);}
  else if(p.kind==='hell-globe'){
   const progress=Math.min(1,p.age/p.detonateAt);ctx.shadowBlur=0;ctx.globalAlpha=.18;ctx.beginPath();ctx.arc(0,0,p.radius,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.9;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(0,0,p.radius+3,-Math.PI/2,-Math.PI/2+progress*Math.PI*2);ctx.stroke();
   if(!p.detonated){const height=100*(1-progress);ctx.globalAlpha=1;ctx.shadowBlur=9;ctx.beginPath();ctx.arc(0,-height,12,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffe1b8';ctx.beginPath();ctx.arc(0,-height,5,0,Math.PI*2);ctx.fill();}
  }
  else if(p.kind==='bullet'){ctx.rotate(p.angle);ctx.fillRect(-12,-3,24,6);ctx.fillStyle='#fff5d6';ctx.fillRect(7,-2,5,4);}
  else if(p.kind==='quake'){ctx.lineWidth=7;ctx.beginPath();ctx.arc(0,0,p.radius,0,Math.PI*2);ctx.stroke();}
  else if(p.kind==='meteor'){ctx.beginPath();ctx.arc(0,0,45,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffe4b6';ctx.beginPath();ctx.arc(0,0,22,0,Math.PI*2);ctx.fill();}
  else if(p.kind==='lightning'||p.kind==='spark-bolt'){ctx.rotate(p.angle);ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-15,-5);ctx.lineTo(-4,5);ctx.lineTo(4,-5);ctx.lineTo(15,5);ctx.stroke();}
  else if(p.kind==='stone'||p.kind==='stone-fragment'){ctx.rotate(p.angle);ctx.beginPath();ctx.moveTo(p.radius,0);ctx.lineTo(0,-p.radius*.75);ctx.lineTo(-p.radius,0);ctx.lineTo(0,p.radius*.75);ctx.closePath();ctx.fill();}
  else if(p.kind==='ice'){ctx.rotate(p.angle);ctx.beginPath();ctx.moveTo(16,0);ctx.lineTo(-9,-7);ctx.lineTo(-15,0);ctx.lineTo(-9,7);ctx.closePath();ctx.fill();}
  else{ctx.beginPath();ctx.arc(0,0,p.radius,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffedd1';ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();}
  ctx.restore();
 }
 ctx.restore();
}
