export const eliteAttacks={
 'elite-soldier':{name:'Rafales du fantassin',pattern:'burst',color:'#d9e5f0',projectile:'bullet',cooldown:6},
 'elite-searcher':{name:'Laser de poursuite',pattern:'laser',color:'#7ce8db',projectile:'plasma',cooldown:6},
 'elite-bomb':{name:'Couronne de feu',pattern:'ring',count:6,color:'#ffb477',projectile:'fire-orb',cooldown:6},
 'elite-coeurl':{name:'Doubles crocs de foudre',pattern:'tracking-pair',color:'#b6cbff',projectile:'spark-bolt',cooldown:5},
 'elite-red-flan':{name:'Éventail ardent',pattern:'fan',color:'#ffad75',projectile:'fire-orb',cooldown:5.5,drag:.65},
 'elite-stone':{name:'Éclats du gardien',pattern:'stone',color:'#d8c9aa',projectile:'stone',cooldown:7},
 'elite-sorcerer':{name:'Arcanes décalées',pattern:'arcane',color:'#c3a2f0',projectile:'arcane',cooldown:5.5},
 'elite-green-dragon':{name:'Souffle venimeux',pattern:'fan',color:'#a8d87c',projectile:'poison',cooldown:6},
 'elite-red-dragon':{name:'Double souffle ardent',pattern:'double-fan',color:'#ff9778',projectile:'fire-orb',cooldown:6.5},
 'elite-bloody-eye':{name:'Regard des ténèbres',pattern:'orbs',color:'#d59bdf',projectile:'dark-orb',cooldown:5},
 'elite-dark-elemental':{name:'Couronne du néant',pattern:'ring',count:8,color:'#b798e6',projectile:'dark-orb',cooldown:6},
 'elite-archdemon':{name:'Globes infernaux',pattern:'ground',color:'#ff8987',projectile:'hell-globe',cooldown:7}
};
function beginCast(s,e,spec){
 const angle=Math.atan2(s.y-e.y,s.x-e.x),pattern=spec.pattern;
 const delays=pattern==='burst'?[0,.25,.5]:pattern==='laser'?[0,.4]:pattern==='tracking-pair'?[0,.6]:pattern==='double-fan'?[0,.75]:pattern==='orbs'?[0,.35,.7]:[0];
 e.eliteSequence=(e.eliteSequence||0)+1;
 e.eliteCast={...spec,elapsed:0,windup:1,angle,tx:s.x,ty:s.y,origin:{x:e.x,y:e.y},events:delays.map(delay=>({at:1+delay,fired:false})),targets:[{x:s.x,y:s.y},{x:s.x+80,y:s.y-60},{x:s.x-80,y:s.y+60}]};
 e.anim?.play('attack');
}
function shoot(s,e,c,eventIndex){
 const angle=c.pattern==='tracking-pair'?Math.atan2(s.y-e.y,s.x-e.x):c.angle;
 const base={owner:e,x:e.x,y:e.y,damage:12,age:0,life:4.5,color:c.color,radius:8,kind:c.projectile};
 const projectile=(a,extra={})=>s.hostileProjectiles.push({...base,vx:Math.cos(a)*210,vy:Math.sin(a)*210,angle:a,...extra});
 const fan=(count,spread,offset=0,extra={})=>{for(let i=0;i<count;i++)projectile(angle+(i-(count-1)/2)*spread+offset,extra);};
 if(c.pattern==='burst')fan(3,.07);
 else if(c.pattern==='laser'){
  if(eventIndex===0)s.hostileProjectiles.push({...base,kind:'beam',x:c.origin.x,y:c.origin.y,angle:c.angle,length:700,life:.3,damage:18});
  else{projectile(angle-.42);projectile(angle+.42);}
 }else if(c.pattern==='ring')for(let i=0;i<c.count;i++)projectile(i*Math.PI*2/c.count+e.eliteSequence*Math.PI/c.count);
 else if(c.pattern==='fan')fan(5,.22,0,{drag:c.drag||0});
 else if(c.pattern==='double-fan')fan(5,.22,eventIndex?.13:0);
 else if(c.pattern==='arcane')fan(3,.3,e.eliteSequence%2?.15:0);
 else if(c.pattern==='stone')fan(3,.22,0,{splitAfter:.9,damage:16,radius:11});
 else if(c.pattern==='ground')for(const p of c.targets)s.hostileProjectiles.push({...base,...p,kind:'hell-globe',radius:46,life:1.3,detonateAt:1,damage:18});
 else projectile(angle);
}
export function tickEliteAttacks(s,dt){
 s.hostileProjectiles??=[];
 for(const e of s.enemies){
  const spec=e.roamingElite&&eliteAttacks[e.special];if(!spec)continue;
  if(e.dying||e.hp<=0){e.eliteCast=null;continue;}
  if(e.spawnProtection>0)continue;
  if(!e.eliteCast){e.eliteCooldown=(e.eliteCooldown??1.5)-dt;if(e.eliteCooldown>0||Math.hypot(e.x-s.x,e.y-s.y)>650)continue;beginCast(s,e,spec);}
  const c=e.eliteCast;c.elapsed+=dt;
  c.events.forEach((event,i)=>{if(!event.fired&&c.elapsed>=event.at){event.fired=true;shoot(s,e,c,i);}});
  if(c.events.every(event=>event.fired)){e.eliteCast=null;e.eliteCooldown=spec.cooldown;}
 }
}
export function drawEliteTelegraphs(ctx,s,ox,oy){
 ctx.save();
 for(const e of s.enemies){
  const c=e.eliteCast;if(!c)continue;
  const progress=Math.min(1,c.elapsed/c.windup),x=e.x+ox,y=e.y+oy;
  ctx.strokeStyle=c.color;ctx.fillStyle=c.color;ctx.lineWidth=2;ctx.globalAlpha=.15+progress*.12;
  if(c.pattern==='ground')for(const p of c.targets){ctx.beginPath();ctx.arc(p.x+ox,p.y+oy,46,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.85;ctx.stroke();ctx.globalAlpha=.15+progress*.12;}
  else if(c.pattern==='ring'){
   ctx.beginPath();ctx.arc(x,y,42,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.9;ctx.stroke();
   for(let i=0;i<c.count;i++){const a=i*Math.PI*2/c.count+e.eliteSequence*Math.PI/c.count;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*40,y+Math.sin(a)*40);ctx.lineTo(x+Math.cos(a)*100,y+Math.sin(a)*100);ctx.stroke();}
  }else{
   const angle=c.pattern==='tracking-pair'?Math.atan2(s.y-e.y,s.x-e.x):c.angle;
   ctx.save();ctx.translate(c.pattern==='laser'?c.origin.x+ox:x,c.pattern==='laser'?c.origin.y+oy:y);ctx.rotate(angle);
   if(c.pattern==='laser'){ctx.fillRect(0,-14,700,28);ctx.globalAlpha=.9;ctx.strokeRect(0,-14,700,28);}
   else{ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(380,-100);ctx.lineTo(380,100);ctx.closePath();ctx.fill();ctx.globalAlpha=.75;ctx.setLineDash([8,7]);ctx.stroke();}
   ctx.restore();
  }
  ctx.globalAlpha=1;
 }
 ctx.restore();
}
