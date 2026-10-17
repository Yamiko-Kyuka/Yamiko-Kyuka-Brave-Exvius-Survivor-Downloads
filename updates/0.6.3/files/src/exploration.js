const names={
 midgar:['Materia oubliée','Caisse de la Shinra','Conduite mako','Balise de maintenance'],
 zanarkand:['Souvenirs des priants','Coffret des ruines','Source de furolucioles','Vestige de la cité'],
 'crystal-tower':['Éclats de cristal','Reliquaire ancien','Cristal dormant','Balise de la tour'],
 'dark-world':['Fragments du néant','Trésor englouti','Sceau oublié','Lueur des ténèbres']
};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function createExploration(s){
 const floor=s.terrain.floor.map(i=>s.terrain.center(i)).filter(p=>s.terrain.walkable(p.x,p.y,28)),xs=floor.map(p=>p.x),ys=floor.map(p=>p.y),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys),chosen=[];
 const corners=[[left,top],[right,top],[left,bottom],[right,bottom]],kinds=['relic','cache','ward','beacon'];
 return corners.map(([x,y],i)=>{
  const point=floor.filter(p=>chosen.every(q=>distance(p,q)>600)).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];
  if(!point)return null;chosen.push(point);
  const fragments=[];
  for(const p of [...floor].sort((a,b)=>Math.abs(distance(a,point)-80)-Math.abs(distance(b,point)-80)))if(fragments.length<3&&distance(p,point)<150&&fragments.every(q=>distance(p,q)>48))fragments.push({...p,collected:false});
  return {...point,id:i,kind:kinds[i],name:(names[s.stage.id]||names.midgar)[i],progress:0,discovered:false,done:false,fragments};
 }).filter(Boolean);
}
function complete(s,o){
 o.done=true;s.explorationCompleted=(s.explorationCompleted||0)+1;
 if(o.kind==='relic'||o.kind==='beacon')s.pickups.push({kind:'level',x:o.x,y:o.y});
 else{s.explorationGilsPending=(s.explorationGilsPending||0)+300;if(o.kind==='ward')s.pickups.push({kind:'freeze',x:o.x,y:o.y});}
 s.pickupNotice={name:o.name+' · trésor découvert !',life:3};
 s.effects.push({kind:'burst',x:o.x,y:o.y,radius:55,color:s.stage.accent,life:.55,maxLife:.55});
}
export function tickExploration(s,dt){
 if(s.phase!=='survival'||s.crystalEncounter)return;
 for(const o of s.exploration||[]){
  if(o.done)continue;const d=distance(s,o);
  if(d<250&&!o.discovered){o.discovered=true;s.pickupNotice={name:o.name,life:2};}
  if(!o.discovered)continue;
  if(o.kind==='cache'){
   if(!o.target){const hp=(180+s.time*.5)*s.difficulty.hp;o.target={x:o.x,y:o.y,id:'exploration-cache-'+o.id,name:o.name,mechanicTarget:true,objectiveKind:'cache',radius:23,size:48,hp,maxHp:hp,hit:0};s.enemies.push(o.target);}
   if(o.target.hp<=0)complete(s,o);
  }else if(o.kind==='relic'){
   for(const fragment of o.fragments)if(!fragment.collected&&distance(s,fragment)<28)fragment.collected=true;
   o.progress=o.fragments.filter(p=>p.collected).length;if(o.progress===3)complete(s,o);
  }else{
   const clear=o.kind!=='beacon'||s.enemies.every(e=>e.hp<=0||e.mechanicTarget||distance(e,o)>130);
   if(d<44&&clear)o.progress+=dt;else o.progress=Math.max(0,o.progress-dt*.4);
   if(o.progress>=(o.kind==='ward'?4:3))complete(s,o);
  }
 }
}
export function drawExploration(ctx,s,ox,oy){
 if(s.phase!=='survival'||s.crystalEncounter)return;
 ctx.save();ctx.textAlign='center';ctx.font='12px Arial';
 for(const o of s.exploration||[]){
  if(!o.discovered||distance(s,o)>900)continue;const x=o.x+ox,y=o.y+oy;
  if(o.done){ctx.fillStyle='#7d938a';ctx.fillRect(x-14,y-6,28,12);continue;}
  ctx.strokeStyle=s.stage.accent;ctx.fillStyle='#0c1d31';ctx.lineWidth=2;
  if(o.kind==='cache'){
   ctx.fillStyle='#65513c';ctx.fillRect(x-24,y-27,48,35);ctx.fillStyle='#b39861';ctx.fillRect(x-25,y-26,50,7);ctx.fillRect(x-24,y-3,48,7);ctx.fillRect(x-4,y-16,8,10);
   if(o.target){ctx.fillStyle='#11192d';ctx.fillRect(x-24,y-37,48,4);ctx.fillStyle='#d7bf78';ctx.fillRect(x-24,y-37,48*Math.max(0,o.target.hp/o.target.maxHp),4);}
  }else{
   ctx.beginPath();ctx.ellipse(x,y,39,20,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=s.stage.accent;ctx.fillRect(x-7,y-27,14,22);ctx.fillRect(x-12,y-33,24,8);
   const progress=o.kind==='relic'?o.progress/3:o.progress/(o.kind==='ward'?4:3);ctx.beginPath();ctx.arc(x,y,42,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);ctx.lineWidth=4;ctx.stroke();
   if(o.kind==='relic')for(const f of o.fragments)if(!f.collected){const fx=f.x+ox,fy=f.y+oy-10;ctx.beginPath();ctx.moveTo(fx,fy-9);ctx.lineTo(fx+6,fy);ctx.lineTo(fx,fy+9);ctx.lineTo(fx-6,fy);ctx.fill();}
  }
  if(distance(s,o)<160){ctx.strokeStyle='#081223';ctx.lineWidth=4;const text=o.kind==='relic'?o.progress+'/3':o.kind==='ward'?'Canalisation':o.kind==='beacon'?'Sanctuaire':'Coffret';ctx.strokeText(text,x,y+38);ctx.fillStyle='#e9e5ce';ctx.fillText(text,x,y+38);}
 }
 ctx.restore();
}
