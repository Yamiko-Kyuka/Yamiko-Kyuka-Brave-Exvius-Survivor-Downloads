import {AnimationPlayer} from './animation.js';
import {Terrain,TILE,ORIGIN} from './terrain.js';

export const mechanicNames={nodes:'Condensateurs mako','beam-relays':'Surcharge des relais','charge-wall':'Charge contre le rempart',runes:'Sceaux des priants',mages:'Incantation interrompue',cover:'Trois souffles, trois abris',sync:'Rupture simultanée','ordered-crystals':'Couronne élémentaire',polarity:'Polarités opposées',towers:'Épreuves des priants',orbits:'Portes du néant'};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const point=(c,x,y)=>({x:c.center.x+x,y:c.center.y+y});
function target(s,c,x,y,kind,index){
 const hp=Math.max(35,s.baseDamage*(c.final?2:1.5)*s.difficulty.hp),e={...point(c,x,y),id:'objective-'+index,name:kind==='mage'?'Mage de Xande':'Relais',radius:22,size:48,hp,maxHp:hp,hit:0,dying:0,mechanicTarget:true,objectiveKind:kind,index,variant:kind==='mage'?c.mageVariant:c.boss.variant,anim:new AnimationPlayer(kind==='mage'?c.mageVariant:c.boss.variant)};
 e.receiveDamage=damage=>{
  if(c.phase!=='mechanic'||e.hp<=0)return 0;
  if(kind==='relay'||c.mechanic==='ordered-crystals'&&(e.index!==c.progress||dist(s,e)>110))return 0;
  const amount=Math.min(damage,e.hp);e.hp-=amount;
  if(e.hp===0){if(c.mechanic==='ordered-crystals')c.progress++;if(c.mechanic==='sync'||c.mechanic==='mages')c.firstKillAt??=c.clock;}
  return amount;
 };
 c.targets.push(e);s.enemies.push(e);return e;
}
function restoreArena(s,c,cover=false){
 const cx=Math.round((c.center.x-ORIGIN)/TILE),cy=Math.round((c.center.y-ORIGIN)/TILE);
 c.coverProps=cover?[[-3,0],[2,0],[0,-3]].map(([dx,dy],i)=>({x:cx+dx,y:cy+dy,w:1,h:1,art:3,name:'Obélisque du souffle '+(i+1)})):[];
 s.terrain=new Terrain(s.stage,{...c.plan,props:c.coverProps});
 if(!s.terrain.walkable(s.x,s.y,s.radius||14))Object.assign(s,s.terrain.nearestFloor(s.x,s.y,s.radius||14));
}
export function startMechanic(s,c){
 s.enemies=s.enemies.filter(e=>!e.mechanicTarget);c.targets=[];c.progress=0;c.hold=0;c.latch=-1;c.firstKillAt=null;c.charge=null;c.casts=[];c.carried=null;c.covered=new Set();
 c.mechanic=c.profile.mechanics[c.mechanicIndex];c.phase='mechanic';c.deadline=c.clock+(c.final?38:30);c.revision=(c.revision||0)+1;
 restoreArena(s,c,c.mechanic==='cover');
 const r=c.final?245:225,positions=[[-r,-150],[r,-150],[0,r]];
 if(c.mechanic==='nodes'||c.mechanic==='beam-relays'||c.mechanic==='ordered-crystals')positions.forEach(([x,y],i)=>target(s,c,x,y,c.mechanic==='beam-relays'?'relay':'crystal',i));
 if(c.mechanic==='mages')for(const [i,[x,y]] of [[-r,-r],[r,-r],[-r,r],[r,r]].entries())target(s,c,x,y,'mage',i);
 if(c.mechanic==='sync'){target(s,c,-r,-100,'weakpoint',0);target(s,c,r,-100,'weakpoint',1);}
 c.runes=[point(c,0,-r),point(c,r,0),point(c,0,r),point(c,-r,0)];
 c.runeOrder=c.final?[2,0,3,1]:[0,2,1];
 c.nextObjectiveCast=c.clock+1.2;c.attackAt=Math.max(c.attackAt||0,c.clock+1);
 c.hint=mechanicHint(c);
}
export function mechanicHint(c){
 const n=c.mechanic,p=c.progress;
 if(n==='nodes')return `Détruisez les trois condensateurs · ${c.targets.filter(t=>t.hp<=0).length}/3`;
 if(n==='beam-relays')return `Attirez le laser sur les relais · ${c.targets.filter(t=>t.hp<=0).length}/3`;
 if(n==='charge-wall')return 'Esquivez la charge pour que le boss percute un rempart';
 if(n==='runes')return `Rejoignez le sceau ${['nord','est','sud','ouest'][c.runeOrder[p]]||''} lumineux · ${p}/${c.runeOrder.length}`;
 if(n==='mages')return `Éliminez les quatre mages à moins de ${c.final?5:6} secondes d’intervalle`;
 if(n==='cover')return `Bloquez les souffles derrière trois obélisques différents · ${c.covered.size}/3`;
 if(n==='sync')return 'Brisez les deux points faibles à moins de trois secondes d’intervalle';
 if(n==='ordered-crystals')return `Entrez dans le cercle bleu puis brisez le cristal · Feu → Glace → Foudre · ${p}/3`;
 if(n==='polarity')return c.carried?`Portez la charge ${c.carried==='blue'?'bleue au relais rouge':'rouge au relais bleu'} · ${p}/2`:`Prenez la charge lumineuse au nord · ${p}/2`;
 if(n==='towers')return `Restez sur le sceau ${['nord','est','sud','ouest'][p]||''} · ${p}/4 · ${c.hold.toFixed(1)}/1,5 s`;
 if(n==='orbits')return `Traversez les portes mobiles dans l’ordre · ${p}/3`;
 return '';
}
export function finishMechanic(s,c){
 s.enemies=s.enemies.filter(e=>!e.mechanicTarget);c.targets=[];c.mechanicIndex++;
 if(c.mechanicIndex<c.profile.mechanics.length){startMechanic(s,c);return;}
 restoreArena(s,c);c.phase='combat';c.vulnerableUntil=c.clock+(c.final?26:18);c.casts=[];c.charge=null;c.hint='BARRIÈRE BRISÉE · Attaquez le boss !';
 s.pickupNotice={name:'Barrière brisée · le boss est vulnérable !',life:2};
}
export function restartMechanic(s,c,message='Mécanique ratée · recommencez !'){
 c.failures=(c.failures||0)+1;startMechanic(s,c);s.pickupNotice={name:message,life:2.5};
}
export function tickMechanic(s,c,dt){
 if(c.phase==='combat'){
  if(c.clock>=c.vulnerableUntil){c.mechanicIndex=0;restartMechanic(s,c,'La barrière se reforme · refaites les mécaniques !');}return;
 }
 if(c.phase!=='mechanic')return;
 if(c.clock>=c.deadline){restartMechanic(s,c);return;}
 const kind=c.mechanic,dead=c.targets.filter(t=>t.hp<=0).length;
 let done=false;
 if(['nodes','ordered-crystals','beam-relays'].includes(kind))done=dead===3;
 if(kind==='mages'||kind==='sync'){
  const total=kind==='mages'?4:2,delay=kind==='mages'?(c.final?5:6):3;
  if(dead===total)done=true;
  else if(c.firstKillAt!==null&&c.clock-c.firstKillAt>delay){restartMechanic(s,c,'Ils se régénèrent · synchronisez leur destruction !');return;}
 }
 if(kind==='runes'||kind==='towers'){
  const active=kind==='runes'?c.runeOrder[c.progress]:c.progress;
  const standing=c.runes.findIndex(p=>dist(p,s)<34);
  if(kind==='runes'){
   if(standing>=0&&standing!==c.latch){if(standing===active)c.progress++;else{c.progress=0;s.pickupNotice={name:'Mauvais sceau · reprenez la séquence.',life:1.5};}}
   c.latch=standing;done=c.progress===c.runeOrder.length;
  }else{
   c.hold=standing===active?c.hold+dt:Math.max(0,c.hold-dt*2);
   if(c.hold>=1.5){c.hold=0;c.progress++;}done=c.progress===4;
  }
 }
 if(kind==='polarity'){
  const pickup=point(c,0,-240),color=c.progress===0?'blue':'red';
  if(!c.carried&&dist(pickup,s)<30)c.carried=color;
  if(c.carried){const correct=point(c,c.carried==='blue'?240:-240,80),wrong=point(c,c.carried==='blue'?-240:240,80);
   if(dist(s,correct)<36){c.progress++;c.carried=null;}else if(dist(s,wrong)<36){restartMechanic(s,c,'Même polarité · la charge est perdue !');return;}}
  done=c.progress===2;
 }
 if(kind==='orbits'){
  c.gates=Array.from({length:3},(_,i)=>{const a=c.clock*.28+i*Math.PI*2/3;return point(c,Math.cos(a)*245,Math.sin(a)*245);});
  const standing=c.gates.findIndex(p=>dist(s,p)<36);
  if(standing>=0&&standing!==c.latch){if(standing===c.progress)c.progress++;else c.progress=0;}c.latch=standing;done=c.progress===3;
 }
 if(kind==='cover')done=c.covered.size===3;
 if(done){finishMechanic(s,c);return;}
 c.hint=mechanicHint(c);
}
/** A shield objective reacts to actual boss attacks, never to a UI-only shortcut. */
export function mechanicBeam(s,c,cast){
 if(c.phase!=='mechanic'||cast.revision!==c.revision)return;
 const along=(p)=>(p.x-cast.x)*Math.cos(cast.angle)+(p.y-cast.y)*Math.sin(cast.angle);
 const across=p=>Math.abs(-(p.x-cast.x)*Math.sin(cast.angle)+(p.y-cast.y)*Math.cos(cast.angle));
 if(c.mechanic==='beam-relays')for(const t of c.targets)if(t.hp>0&&along(t)>0&&along(t)<1000&&across(t)<t.radius+16)t.hp=0;
 if(c.mechanic==='cover'){
  const end=s.terrain.trace(cast.x,cast.y,cast.x+Math.cos(cast.angle)*1000,cast.y+Math.sin(cast.angle)*1000,2);
  c.coverProps.forEach((p,i)=>{const x=ORIGIN+p.x*TILE,y=ORIGIN+p.y*TILE,center={x:x+32,y:y+32};if(end.blocked&&end.x>=x-8&&end.x<=x+72&&end.y>=y-8&&end.y<=y+72&&along(s)>along(center)+45&&across(s)<45)c.covered.add(i);});
 }
}
export function mechanicWallHit(s,c){if(c.phase==='mechanic'&&c.mechanic==='charge-wall')finishMechanic(s,c);}
export function drawMechanic(ctx,s,c,ox,oy){
 ctx.save();ctx.font='bold 13px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
 const disk=(p,r,color,label,active=true)=>{ctx.fillStyle=color;ctx.globalAlpha=active?.22:.10;ctx.beginPath();ctx.arc(p.x+ox,p.y+oy,r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.85;ctx.lineWidth=active?7:4;ctx.strokeStyle='#0a1022';ctx.stroke();ctx.globalAlpha=active?1:.75;ctx.lineWidth=active?3:1.5;ctx.strokeStyle=active?'#fff0b5':color;ctx.stroke();ctx.lineWidth=4;ctx.strokeStyle='#0a1022';ctx.strokeText(label,p.x+ox,p.y+oy);ctx.fillStyle=color;ctx.fillText(label,p.x+ox,p.y+oy);ctx.globalAlpha=1;};
 if(c.phase==='mechanic'){
  for(const t of c.targets){if(t.hp<=0||t.objectiveKind==='mage')continue;const active=c.mechanic!=='ordered-crystals'||t.index===c.progress,color=['#ffaf71','#8cdfff','#e6b1ff'][t.index%3];if(c.mechanic==='ordered-crystals'&&active){ctx.strokeStyle='#91e9dd';ctx.fillStyle='#91e9dd';ctx.globalAlpha=.10;ctx.beginPath();ctx.arc(t.x+ox,t.y+oy,110,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.9;ctx.lineWidth=2;ctx.setLineDash([7,5]);ctx.stroke();ctx.setLineDash([]);}disk(t,t.radius,color,String(t.index+1),active);ctx.strokeStyle=color;ctx.globalAlpha=.35;ctx.beginPath();ctx.moveTo(c.boss.x+ox,c.boss.y+oy);ctx.lineTo(t.x+ox,t.y+oy);ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle='#10172c';ctx.fillRect(t.x+ox-22,t.y+oy-34,44,5);ctx.fillStyle=color;ctx.fillRect(t.x+ox-22,t.y+oy-34,44*t.hp/t.maxHp,5);}
  if(c.mechanic==='runes'||c.mechanic==='towers')c.runes.forEach((p,i)=>disk(p,34,'#91e9dd',String(i+1),i===(c.mechanic==='runes'?c.runeOrder[c.progress]:c.progress)));
  if(c.mechanic==='polarity'){disk(point(c,0,-240),30,c.progress===0?'#8cdfff':'#ff8795',c.carried?'':c.progress===0?'−':'+',!c.carried);disk(point(c,-240,80),36,'#8cdfff','−');disk(point(c,240,80),36,'#ff8795','+');if(c.carried)disk(s,24,c.carried==='blue'?'#8cdfff':'#ff8795',c.carried==='blue'?'−':'+');}
  if(c.mechanic==='orbits')for(const [i,p]of(c.gates||[]).entries())disk(p,36,'#cfb1ff',String(i+1),i===c.progress);
  if(c.mechanic==='cover')c.coverProps.forEach((p,i)=>disk({x:ORIGIN+(p.x+.5)*TILE,y:ORIGIN+(p.y+.5)*TILE},42,c.covered.has(i)?'#7fdfad':'#d9b0ff',c.covered.has(i)?'✓':String(i+1)));
 }
 if(c.phase!=='combat'&&c.phase!=='pull'){ctx.lineWidth=3;ctx.strokeStyle='#aabce8';ctx.globalAlpha=.75;ctx.setLineDash([10,7]);ctx.beginPath();ctx.arc(c.boss.x+ox,c.boss.y+oy-c.boss.size*.35,c.boss.size*.65,0,Math.PI*2);ctx.stroke();}
 ctx.restore();
}
