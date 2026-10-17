import {equipmentEffects} from './model.js';
/** Visual accounting only: rewards remain credited by the existing run/rare-Mog logic. */
export function killGilAmount(s){
 const previous=s.killGilsProgress||0,next=previous+2*(s.difficulty.reward||1)*(s.gilsMultiplier||1)*equipmentEffects(s).gils;
 s.killGilsProgress=next;return Math.floor(next+1e-8)-Math.floor(previous+1e-8);
}
export function addGilFeedback(s,e,amount){
 if(amount<=0)return;
 const list=s.gilFeedback??=[],near=list.find(p=>p.age<.08&&Math.hypot(p.x-e.x,p.y-e.y)<40);
 if(near){near.amount+=amount;return;}
 list.push({x:e.x,y:e.y-18,amount,age:0,life:.7});if(list.length>36)list.shift();
}
export function tickGilFeedback(s,dt){s.gilFeedback=(s.gilFeedback||[]).filter(p=>{p.age+=dt;p.life-=dt;return p.life>0;});}
export function drawGilFeedback(ctx,s,ox,oy){
 if(!s.gilFeedback?.length)return;
 ctx.save();ctx.textAlign='left';ctx.font='bold 12px Arial';
 for(const p of s.gilFeedback){
  const x=Math.round(p.x+ox),y=Math.round(p.y+oy-p.age*32),width=2+Math.abs(Math.cos(p.age*12))*4;
  ctx.globalAlpha=Math.min(1,p.life/.2);ctx.fillStyle='#6c471d';ctx.beginPath();ctx.ellipse(x+1,y+1,width+1,7,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#f0c55c';ctx.beginPath();ctx.ellipse(x,y,width,6,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff1ad';ctx.fillRect(x-1,y-4,2,7);
  if(p.age<.25){ctx.fillRect(x+6,y-9,2,6);ctx.fillRect(x+4,y-7,6,2);}
  ctx.lineWidth=3;ctx.strokeStyle='#151328';ctx.strokeText('+'+p.amount,x+10,y+4);ctx.fillStyle='#ffe3a1';ctx.fillText('+'+p.amount,x+10,y+4);
 }
 ctx.restore();
}
