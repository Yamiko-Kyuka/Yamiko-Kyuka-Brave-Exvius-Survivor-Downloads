import {hurtInArena} from './arena-pressure.js';
import {playerRadius} from './hitboxes.js';

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

function prepareMeteor(s,c,role='seal'){
 const target=c.targets[c.progress];
 // Include a detour around Xande's body. No dash or movement upgrade is required.
 const speed=Math.max(1,Math.min(s.speed||160,160));
 const duration=role==='seal'?Math.max(3,(distance(s,target)+120)/speed+.5):3;
 c.sealMeteor={role,number:role==='decoy'?2:1,stage:'tracking',born:c.clock,duration,endsAt:c.clock+duration,x:s.x,y:s.y,radius:48};
 c.boss.anim.play('attack');
}

export function startMeteorSeals(s,c){
 c.deadline=c.clock+70;
 prepareMeteor(s,c);
}

export function tickMeteorSeals(s,c){
 const meteor=c.sealMeteor;if(!meteor)return false;
 if(meteor.stage==='tracking'){
  meteor.x=s.x;meteor.y=s.y;
  if(c.clock+1e-8<meteor.endsAt)return false;
  Object.assign(meteor,{stage:'locked',born:c.clock,duration:1.5,endsAt:c.clock+1.5});
  c.boss.anim.play('attack');
  return false;
 }
 if(c.clock+1e-8<meteor.endsAt)return false;
 const seal=c.targets[c.progress];
 const correct=meteor.role==='seal'&&seal&&distance(meteor,seal)<=seal.radius;
 if(correct){seal.hp=0;c.progress++;s.pickupNotice={name:`Sceau brisé · ${c.progress}/3`,life:2};}
 else{
  // Missed impacts and the second meteor leave persistent, damaging craters.
  c.groundHazards??=[];
  c.groundHazards.push({x:meteor.x,y:meteor.y,born:c.clock-.86,radius:40,baseRadius:40});
  s.pickupNotice={name:meteor.role==='decoy'?'Météore écarté · évitez le cratère':'Sceau manqué · attirez le prochain météore dessus',life:2};
 }
 if(distance(s,meteor)<meteor.radius+playerRadius(s))hurtInArena(s,26);
 s.effects??=[];
 s.effects.push({kind:'burst',x:meteor.x,y:meteor.y,radius:meteor.radius,color:'#ff9f65',life:.4,maxLife:.4});
 const needsDecoy=c.segmentIndex>0&&meteor.role==='seal';
 if(!needsDecoy&&c.progress===3){c.sealMeteor=null;return true;}
 prepareMeteor(s,c,needsDecoy?'decoy':'seal');
 return false;
}

export function meteorCountdown(s){
 const c=s.crystalEncounter,m=c?.phase==='mechanic'&&c.mechanic==='meteor-seals'?c.sealMeteor:null;
 if(!m)return null;
 const seconds=Math.max(0,m.endsAt-c.clock);
 return {label:m.stage==='locked'?'IMPACT · ESQUIVEZ':m.role==='decoy'?'MÉTÉORE 2 · ÉCARTEZ-LE':'MÉTÉORE · REJOIGNEZ LE SCEAU',seconds,progress:Math.min(1,Math.max(0,1-seconds/m.duration)),locked:m.stage==='locked',number:m.number};
}

export function drawMeteorSeals(ctx,s,c,ox,oy){
 const m=c.sealMeteor;if(!m)return;
 const countdown=meteorCountdown(s),x=m.x+ox,y=m.y+oy;
 drawMeteorBarrier(ctx,c,ox,oy);
 ctx.save();ctx.strokeStyle=countdown.locked?'#ff6f6f':'#e9bf77';ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=3;
 ctx.globalAlpha=.18;ctx.beginPath();ctx.arc(x,y,m.radius,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.stroke();
 ctx.lineWidth=6;ctx.beginPath();ctx.arc(x,y,m.radius+5,-Math.PI/2,-Math.PI/2+Math.PI*2*countdown.progress);ctx.stroke();
 if(countdown.locked){
  // A falling ember and trail make the impact readable as a meteor, not just a disk.
  const height=170*(1-countdown.progress),headY=y-height;
  ctx.globalAlpha=.65;ctx.fillStyle='#ff984f';ctx.beginPath();ctx.moveTo(x-10,headY);ctx.lineTo(x+16,headY-50);ctx.lineTo(x+11,headY+5);ctx.fill();
  ctx.globalAlpha=1;ctx.fillStyle='#ffe3a0';ctx.beginPath();ctx.arc(x,headY,11,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}

function drawMeteorBarrier(ctx,c,ox,oy){
 const boss={x:c.boss.x+ox,y:c.boss.y+oy},remaining=c.targets.filter(t=>t.hp>0).length;
 ctx.save();
 // These ground conduits visibly power the same barrier; destroyed seals lose theirs.
 for(const t of c.targets){
  if(t.hp<=0)continue;
  const tx=t.x+ox,ty=t.y+oy,dx=boss.x-tx,dy=boss.y-ty,length=Math.hypot(dx,dy),active=t.index===c.progress;
  const color=active?'#ffe4a0':'#b3a0ed';
  ctx.lineJoin='round';ctx.lineWidth=7;ctx.strokeStyle='#0b1025';ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(tx+dx*.42,ty+dy*.42);ctx.lineTo(tx+dx*.58-dy/length*13,ty+dy*.58+dx/length*13);ctx.lineTo(boss.x,boss.y);ctx.stroke();
  ctx.lineWidth=3;ctx.strokeStyle=color;ctx.globalAlpha=active?.95:.5;ctx.stroke();
  ctx.lineWidth=2;ctx.beginPath();ctx.arc(tx,ty,t.radius+10,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<6;i++){const angle=i*Math.PI/3+c.clock*.08;ctx.beginPath();ctx.moveTo(tx+Math.cos(angle)*(t.radius+3),ty+Math.sin(angle)*(t.radius+3));ctx.lineTo(tx+Math.cos(angle)*(t.radius+17),ty+Math.sin(angle)*(t.radius+17));ctx.stroke();}
  const travel=(c.clock*.22+t.index*.33)%1;ctx.fillStyle=color;ctx.globalAlpha=1;ctx.beginPath();ctx.arc(tx+dx*travel,ty+dy*travel,4,0,Math.PI*2);ctx.fill();
 }
 const r=c.boss.size*.72,cy=boss.y-c.boss.size*.38;
 ctx.fillStyle='#9498f1';ctx.globalAlpha=.06+remaining*.025;ctx.beginPath();ctx.arc(boss.x,cy,r,0,Math.PI*2);ctx.fill();
 ctx.globalAlpha=.4;ctx.strokeStyle='#d0c5ff';ctx.lineWidth=2;ctx.stroke();
 ctx.beginPath();ctx.ellipse(boss.x,boss.y,r*.65,20,0,0,Math.PI*2);ctx.stroke();
 // One bright arc per intact seal: the shield visibly fractures after each impact.
 ctx.lineWidth=5;
 for(let i=0;i<remaining;i++){const angle=-Math.PI/2+i*Math.PI*2/3;ctx.globalAlpha=.75+.15*Math.sin(c.clock*3);ctx.beginPath();ctx.arc(boss.x,cy,r,angle+.08,angle+Math.PI*2/3-.08);ctx.stroke();}
 ctx.globalAlpha=1;ctx.font='bold 12px Arial';ctx.textAlign='center';ctx.fillStyle='#eee4ff';ctx.strokeStyle='#0b1025';ctx.lineWidth=4;
 const label=remaining?`BARRIÈRE · ${remaining} SCEAU${remaining>1?'X':''}`:'BARRIÈRE DÉSTABILISÉE';
 ctx.strokeText(label,boss.x,cy-r-10);ctx.fillText(label,boss.x,cy-r-10);ctx.restore();
}

export function drawMeteorCountdown(ctx,s,centerX,healthY){
 const countdown=meteorCountdown(s);if(!countdown)return;
 const x=centerX-112,y=healthY-42,width=224,color=countdown.locked?'#ff9292':'#f0ce8b';
 ctx.save();ctx.globalAlpha=1;ctx.fillStyle='#080f20ee';ctx.fillRect(x-5,y-4,width+10,36);
 ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.textBaseline='top';ctx.fillStyle=color;ctx.fillText(countdown.label,centerX,y);
 ctx.fillStyle='#2a3049';ctx.fillRect(x,y+17,width-43,7);ctx.fillStyle=color;ctx.fillRect(x,y+17,(width-43)*countdown.progress,7);
 ctx.font='bold 12px Arial';ctx.textAlign='right';ctx.fillText(countdown.seconds.toFixed(1)+' s',x+width,y+14);ctx.restore();
}
