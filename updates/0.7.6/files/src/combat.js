import {enemyDistance,closestEnemyPoint,segmentEnemyHit} from './enemy-geometry.js';
import {playerEffectsOpacity} from './visual-settings.js';
import {weapons,equipmentEffects} from './model.js';
import {weaponTuning} from './weapon-upgrades.js';
import {weaponInterval} from './attack-timing.js';
import {applyKnockback} from './knockback.js';
import {hitStats,MULTI_HIT_DAMAGE,MULTI_HIT_DELAY} from './hit-stats.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function nearestEnemy(s,max=Infinity){return s.enemies.filter(e=>!e.dying&&e.hp>0&&(!e.aimable||e.aimable())&&!(e.spawnProtection>0)&&enemyDistance(e,s)<=max).sort((a,b)=>enemyDistance(a,s)-enemyDistance(b,s))[0];}
// Raw application also serves scripted mechanics and fixed-damage consumables.
function applyDamage(s,e,damage,color='#ffe6b0',style='physical',weaponId=null){
 if(e.dying||e.hp<=0||e.spawnProtection>0||!Number.isFinite(damage)||damage<=0)return false;
 const healthBefore=e.hp;
 if(e.receiveDamage){damage=e.receiveDamage(damage);if(damage<=0)return false;}else e.hp-=damage;e.hit=.18;applyKnockback(s,e);s.effects.push({playerEffect:true,kind:'spark',x:e.x,y:e.y,color,life:.25,maxLife:.25});
 const numbers=s.damageNumbers??=[];const lane=(e.damageSequence||0)%3-1;e.damageSequence=(e.damageSequence||0)+1;
 const x=e.x+lane*12;let y=e.y-48,steps=0;
 const previous=numbers.filter(n=>n.target===e),spacing=style==='multihit'?39:22;while(steps<7&&previous.some(n=>Math.abs(n.y-y)<(n.style==='multihit'?39:spacing)&&Math.abs(n.x-x)<48)){y-=spacing;steps++;}
 numbers.push({target:e,x,y,amount:Math.max(1,Math.round(damage)),life:.9,maxLife:.9,drift:lane*10,style});
 if(numbers.length>240)numbers.shift();s.onDamageDealt?.({target:e,amount:Math.min(healthBefore,damage),style,weaponId});return damage;
}
export function dealDamage(s,e,damage,color='#ffe6b0',style='physical'){return applyDamage(s,e,damage,color,style)>0;}
function hitFlash(s,e,kind,color){if(s.effects.length<220)s.effects.push({playerEffect:true,kind,x:e.x,y:e.y-30,color,life:kind==='critical-impact'?.30:.20,maxLife:kind==='critical-impact'?.30:.20});}
export function dealAttackDamage(s,e,damage,color='#ffe6b0',style='physical',weaponId=null){
 if(e.dying||e.hp<=0||e.spawnProtection>0||!Number.isFinite(damage)||damage<=0)return false;
 const stats=hitStats(s,equipmentEffects(s)),random=s.combatRandom||Math.random,critical=random()<stats.critRate;
 const attackDamage=damage*(critical?stats.critDamage:1);
 const amount=applyDamage(s,e,attackDamage,critical?'#ffdc6c':color,critical?'critical':style,weaponId);
 if(!(amount>0))return false;
 if(critical)hitFlash(s,e,'critical-impact','#ffda66');
 if(e.hp>0&&random()<stats.multiHitRate){s.multiHitQueue??=[];s.multiHitQueue.push({target:e,damage:attackDamage*MULTI_HIT_DAMAGE,chance:stats.multiHitRate,weaponId,delay:MULTI_HIT_DELAY});}
 return true;
}
/** One repeat per chain per tick; work is bounded even with many concurrent chains. */
export function tickMultiHits(s,dt){
 if(!s.multiHitQueue?.length)return;
 if(s.ending||s.over){s.multiHitQueue=[];return;}
 const pending=s.multiHitQueue;s.multiHitQueue=[];let budget=128;
 for(const echo of pending){
  const e=echo.target;if(!s.enemies.includes(e)||e.hp<=0||e.dying)continue;
  echo.delay-=dt;if(echo.delay>0||budget<=0){s.multiHitQueue.push(echo);continue;}budget--;
  const amount=applyDamage(s,e,echo.damage,'#7abfff','multihit',echo.weaponId);if(!(amount>0))continue;
  hitFlash(s,e,'multihit-impact','#d8edff');
  if(e.hp>0&&(s.combatRandom||Math.random)()<echo.chance)s.multiHitQueue.push({...echo,delay:MULTI_HIT_DELAY});
 }
}
function hit(s,e,damage,color,weaponId){
 if(!dealAttackDamage(s,e,damage,color,'physical',weaponId))return false;
 const mods=equipmentEffects(s);
 if(mods.slow){e.baseSpeed??=e.speed;e.slowFactor=Math.min(e.slowFactor||1,1-mods.slow);e.speed=e.baseSpeed*e.slowFactor;e.slowTime=1.5;}
 if(mods.splash){for(const other of s.enemies)if(other!==e&&enemyDistance(other,e)<48)dealAttackDamage(s,other,damage*mods.splash,'#ffb079','physical',weaponId);s.effects.push({playerEffect:true,kind:'explosion',x:e.x,y:e.y,radius:48,color:'#ffac72',life:.2,maxLife:.2});}
 return true;
}
export function tickDamageNumbers(s,dt){for(const n of s.damageNumbers||[]){n.life-=dt;n.y-=dt*42;n.x+=dt*n.drift;}s.damageNumbers=(s.damageNumbers||[]).filter(n=>n.life>0);}
export function drawDamageNumbers(ctx,s,ox,oy){
 ctx.save();ctx.textAlign='center';ctx.textBaseline='bottom';ctx.lineJoin='round';ctx.strokeStyle='#080d20';ctx.lineWidth=3;
 for(const n of s.damageNumbers||[]){const age=n.maxLife-n.life,size=n.style==='limit'?23:n.style==='critical'?22:18,pop=1+(n.style==='critical'?.30:.18)*Math.max(0,1-age/.12);
  ctx.globalAlpha=Math.min(1,n.life/.25);ctx.font=`bold ${Math.round(size*pop)}px Arial, sans-serif`;
  ctx.fillStyle=n.style==='critical'?'#ffdc63':n.style==='multihit'?'#79bfff':n.style==='limit'?'#ffdc73':n.style==='magic'?'#b2eeff':'#fff1c7';
  const text=String(n.amount),x=Math.round(n.x+ox),y=Math.round(n.y+oy);ctx.strokeText(text,x,y);ctx.fillText(text,x,y);
  if(n.style==='multihit'){ctx.font='bold 13px Arial, sans-serif';ctx.strokeText('MHIT!!!',x,y-23);ctx.fillText('MHIT!!!',x,y-23);}
 }ctx.restore();
}
export function fireWeapon(s,equipped){
 const w=weapons[equipped.id];if(!w)return false;
 const mods=equipmentEffects(s),tuning=weaponTuning(w,equipped),damage=w.damage*(s.damage/s.baseDamage)*tuning.damage*mods.damage*(['slash','burst','holy'].includes(w.kind)?mods.melee:1),range=w.range*(s.range/s.baseRange)*mods.range,aimed=Boolean(s.aim?.active),target=aimed?s.aim:nearestEnemy(s,range+120);
 if(!target)return false;
 s.onWeaponFire?.(w);
 const angle=Math.atan2(target.y-s.y,target.x-s.x),base={playerEffect:true,color:w.color,damage,range,kind:w.kind,weaponId:w.id,x:s.x,y:s.y,age:0,life:1.2,hits:new Set(),aimed,pierce:mods.pierce};
 if(['slash','burst','holy'].includes(w.kind)){
  const count=1+tuning.zones,hitEnemies=new Set(),radius=(w.kind==='holy'?range*.85:range)*tuning.area;
  for(let i=0;i<count;i++){
   const a=angle+(i-(count-1)/2)*1.1,x=s.x+(w.kind==='burst'&&i?Math.cos(a)*radius*.8:0),y=s.y+(w.kind==='burst'&&i?Math.sin(a)*radius*.8:0);
   s.effects.push({...base,x,y,angle:a,radius,life:.32,maxLife:.32});
   for(const enemy of s.enemies){const point=closestEnemyPoint(enemy,{x,y}),ea=Math.atan2(point.y-y,point.x-x),diff=Math.abs(Math.atan2(Math.sin(ea-a),Math.cos(ea-a)));
    if(!hitEnemies.has(enemy)&&(!s.terrain||s.terrain.lineClear(x,y,point.x,point.y))&&enemyDistance(enemy,{x,y})<radius&&(enemyDistance(enemy,{x,y})===0||w.kind==='burst'||diff<(w.kind==='holy'?.85:1.1))){hit(s,enemy,damage,w.color,w.id);hitEnemies.add(enemy);}
   }
  }return true;
 }
 if(w.kind==='thunder'){
  const remaining=s.enemies.filter(e=>!e.dying&&e.hp>0&&enemyDistance(e,s)<range*tuning.area);let last=s;
  for(let i=0;i<3+tuning.zones+mods.extraProjectiles&&remaining.length;i++){
   const reachable=remaining.filter(e=>!s.terrain||s.terrain.lineClear(last.x,last.y,e.x,e.y));if(!reachable.length)break;
   reachable.sort((a,b)=>distance(a,i===0?target:last)-distance(b,i===0?target:last));const enemy=reachable[0];remaining.splice(remaining.indexOf(enemy),1);
   s.effects.push({playerEffect:true,kind:'thunder',x:last.x,y:last.y,tx:enemy.x,ty:enemy.y,color:w.color,life:.32,maxLife:.32});hit(s,enemy,damage,w.color,w.id);last=enemy;
  }return true;
 }
 if(w.kind==='beam'){
  const count=1+tuning.projectiles+mods.extraProjectiles,width=25*tuning.area;
  for(let i=0;i<count;i++){
   const a=angle+(i-(count-1)/2)*.14,end=s.terrain?.trace(s.x,s.y,s.x+Math.cos(a)*range*1.5,s.y+Math.sin(a)*range*1.5),length=end?distance(s,end):range*1.5,tx=s.x+Math.cos(a)*length,ty=s.y+Math.sin(a)*length;
   const collisions=segmentEnemies(s,s.x,s.y,tx,ty,width);let shownLength=length;
   for(const [index,collision]of collisions.entries()){
    hit(s,collision.enemy,damage,w.color,w.id);
    if(index>=mods.pierce){shownLength=length*collision.t;break;}
   }
   s.effects.push({...base,angle:a,length:shownLength,width,life:.4,maxLife:.4});
  }return true;
 }
 if(w.kind==='meteor'){
  const reach=Math.min(range,distance(target,s)),count=1+tuning.zones+mods.extraProjectiles,radius=78*mods.range*tuning.area;
  for(let i=0;i<count;i++){const offset=count===1?0:radius*.8,a=angle+i*Math.PI*2/count;s.projectiles.push({...base,hits:new Set(),x:s.x+Math.cos(angle)*reach+Math.cos(a)*offset,y:s.y+Math.sin(angle)*reach+Math.sin(a)*offset,radius,life:.9});}return true;
 }
 if(w.kind==='orbit'){
  const count=2+tuning.projectiles+mods.extraProjectiles,orbitRadius=71*mods.range*tuning.area;
  for(let i=0;i<count;i++){const a=angle+i*Math.PI*2/count;s.projectiles.push({...base,hits:new Set(),angle:a,x:s.x+Math.cos(a)*orbitRadius,y:s.y+Math.sin(a)*orbitRadius,life:2.5,orbitRadius,radius:20*tuning.area,lastHit:0});}return true;
 }
 const count=1+tuning.projectiles+mods.extraProjectiles;
 for(let i=0;i<count;i++){
  const a=angle+(i-(count-1)/2)*.14,velocity=w.kind==='wave'?170:w.kind==='orb'?150:w.kind==='boomerang'?250:330;
  s.projectiles.push({...base,hits:new Set(),vx:Math.cos(a)*velocity,vy:Math.sin(a)*velocity,angle:a,life:w.kind==='boomerang'?1.8:range/velocity+1,radius:(w.kind==='wave'?26:w.kind==='fire'?13:9)*mods.range*tuning.area,splashRadius:48*mods.range*tuning.area,originX:s.x,originY:s.y});
 }return true;
}
/** First sprite intersection along a swept path, so array order and fast frames cannot skip a monster. */
export function segmentEnemies(s,x,y,tx,ty,radius,hits=new Set()){
 const collisions=[];
 for(const enemy of s.enemies){
  if(enemy.dying||enemy.hp<=0||enemy.spawnProtection>0||hits.has(enemy))continue;
  const t=segmentEnemyHit(enemy,x,y,tx,ty,radius);if(t!==null)collisions.push({enemy,t});
 }return collisions.sort((a,b)=>a.t-b.t);
}
export function tickWeapons(s,dt,primaryBusy=false){for(let i=0;i<s.weapons.length;i++){const w=s.weapons[i],interval=weaponInterval(s,w);if(w.interval&&w.interval!==interval)w.timer*=interval/w.interval;w.interval=interval;if(i>0&&!w.cadenceStarted){w.timer=Math.max(w.timer||0,interval*(.12+((i*.381966)%1)*.68));w.cadenceStarted=true;}w.timer-=dt;if(w.timer<=0&&(i!==0||!primaryBusy)&&!s.dash){if(fireWeapon(s,w))w.timer=interval;else if(i>0)w.timer=Math.max(.06,interval*.2);}}}
export function tickProjectiles(s,dt){
 for(const p of s.projectiles){
  const moveDt=Math.min(dt,Math.max(0,p.life));p.life-=dt;p.age+=moveDt;
  if(p.kind==='meteor'){
   if(p.life<=0){for(const e of s.enemies)if(enemyDistance(e,p)<p.radius)hit(s,e,p.damage,p.color,p.weaponId);s.effects.push({...p,kind:'explosion',life:.45,maxLife:.45});}continue;
  }
  const x=p.x,y=p.y;
  if(p.kind==='orbit'){
   p.angle+=moveDt*3.8;p.x=s.x+Math.cos(p.angle)*p.orbitRadius;p.y=s.y+Math.sin(p.angle)*p.orbitRadius;
  }else{
   if(p.kind==='boomerang'&&p.age>.75){const a=Math.atan2(s.y-p.y,s.x-p.x);p.vx=Math.cos(a)*290;p.vy=Math.sin(a)*290;if(distance(p,s)<18){p.life=0;continue;}}
   if(p.kind==='orb'&&!p.aimed){const target=nearestEnemy({...s,x:p.x,y:p.y},600);if(target){const a=Math.atan2(target.y-p.y,target.x-p.x);p.vx=Math.cos(a)*170;p.vy=Math.sin(a)*170;}}
   const end=s.terrain?.trace(x,y,x+p.vx*moveDt,y+p.vy*moveDt,2);p.x=end?.x??x+p.vx*moveDt;p.y=end?.y??y+p.vy*moveDt;if(end?.blocked)p.life=0;
  }
  const tx=p.x,ty=p.y,collisions=segmentEnemies(s,x,y,tx,ty,p.radius,p.hits);
  for(const {enemy:e,t}of collisions){
   hit(s,e,p.damage,p.color,p.weaponId);p.hits.add(e);
   if(p.kind==='ice'&&e.hp>0){e.baseSpeed??=e.speed;e.speed=Math.min(e.speed,25);e.slowFactor=e.speed/e.baseSpeed;e.slowTime=2.5;}
   if(p.kind==='fire'){
    const ix=x+(tx-x)*t,iy=y+(ty-y)*t;
    for(const other of s.enemies)if(other!==e&&enemyDistance(other,{x:ix,y:iy})<p.splashRadius)hit(s,other,p.damage*.5,p.color,p.weaponId);
    s.effects.push({...p,x:ix,y:iy,kind:'explosion',radius:p.splashRadius,life:.3,maxLife:.3});
   }
   if(p.hits.size>(p.pierce||0)){p.life=0;p.x=x+(tx-x)*t;p.y=y+(ty-y)*t;break;}
  }
 }
 s.projectiles=s.projectiles.filter(p=>p.life>0);
}
/** Short red halo is essential impact feedback, independent of optional particles. */
export function drawHitAura(ctx,enemy,x,y){
 if(!(enemy.hit>0))return;
 const size=enemy.size||40,fade=Math.min(1,enemy.hit/.18),radius=Math.max(18,size*.55);
 ctx.save();ctx.globalAlpha=.65*fade;
 const gradient=ctx.createRadialGradient(x,y-size*.45,0,x,y-size*.45,radius);gradient.addColorStop(0,'#ff303066');gradient.addColorStop(.6,'#ff3030bb');gradient.addColorStop(1,'#ff303000');ctx.fillStyle=gradient;ctx.beginPath();ctx.ellipse(x,y-size*.45,radius,radius*.9,0,0,Math.PI*2);ctx.fill();ctx.restore();
}
export function drawCombat(ctx,s,ox,oy,effects=true,playerOpacity=1){const opacity=playerEffectsOpacity(playerOpacity);for(const p of s.projectiles){const x=p.x+ox,y=p.y+oy;ctx.save();ctx.translate(x,y);ctx.globalAlpha=opacity;ctx.strokeStyle=ctx.fillStyle=p.color;ctx.lineWidth=3;if(p.kind==='meteor'){ctx.globalAlpha=.5*opacity;ctx.beginPath();ctx.arc(0,0,p.radius,0,Math.PI*2);ctx.stroke();ctx.fillRect(-5,-120*(1-p.age/.9),10,18);}else if(p.kind==='wave'){ctx.rotate(p.angle);ctx.beginPath();ctx.arc(-12,0,p.radius*1.15,-1.2,1.2);ctx.stroke();ctx.beginPath();ctx.arc(-20,0,p.radius*.92,-1.2,1.2);ctx.stroke();}else if(['shot','arrow','ice','boomerang','orbit'].includes(p.kind)){ctx.rotate(p.kind==='boomerang'?p.age*14:p.angle||0);const size=p.radius/(p.kind==='orbit'?20:9);ctx.scale(size,size);ctx.fillRect(-14,-3,28,6);ctx.fillStyle='#fff4dc';ctx.fillRect(7,-2,7,4);if(['orbit','boomerang'].includes(p.kind))ctx.fillRect(-6,-9,4,18);}else{ctx.beginPath();ctx.arc(0,0,p.radius,0,Math.PI*2);ctx.fill();if(effects){ctx.globalAlpha=.35*opacity;ctx.beginPath();ctx.arc(0,0,p.radius+7,0,Math.PI*2);ctx.fill();}}ctx.restore();}for(const f of s.effects){ctx.save();ctx.translate(f.x+ox,f.y+oy);ctx.fillStyle=ctx.strokeStyle=f.color||'#ffe6b0';ctx.globalAlpha=f.life/(f.maxLife||.3)*(f.playerEffect?opacity:1);ctx.lineWidth=4;if(f.kind==='critical-impact'||f.kind==='multihit-impact'){const age=1-f.life/f.maxLife,r=8+age*22,arms=f.kind==='critical-impact'?8:4;ctx.lineWidth=f.kind==='critical-impact'?2.5:1.7;for(let i=0;i<arms;i++){const a=i*Math.PI*2/arms+age*.3;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.35,Math.sin(a)*r*.35);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);ctx.stroke();}if(f.kind==='critical-impact'){ctx.beginPath();ctx.arc(0,0,r*.65,0,Math.PI*2);ctx.stroke();}}else if(f.kind==='dash'){ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(f.tx-f.x,f.ty-f.y);ctx.stroke();}else if(f.kind==='slash'){ctx.rotate(f.angle);ctx.beginPath();ctx.arc(0,0,f.radius*(.55+.45*(1-f.life/f.maxLife)),-1.1,1.1);ctx.stroke();}else if(f.kind==='holy'){ctx.rotate(f.angle||0);const r=f.radius*(.25+.75*(1-f.life/f.maxLife));ctx.beginPath();ctx.arc(0,0,r,-.85,.85);ctx.stroke();ctx.fillRect(r-3,-18,6,36);ctx.fillRect(r-12,-3,24,6);}else if(['burst','explosion'].includes(f.kind)){ctx.beginPath();ctx.arc(0,0,(f.radius||90)*(1-f.life/f.maxLife),0,Math.PI*2);ctx.stroke();}else if(f.kind==='beam'){ctx.rotate(f.angle);ctx.fillRect(0,-(f.width||25)*.4,f.length,(f.width||25)*.8);ctx.fillStyle='white';ctx.fillRect(0,-2,f.length,4);}else if(f.kind==='thunder'){ctx.beginPath();ctx.moveTo(0,0);const dx=f.tx-f.x,dy=f.ty-f.y;for(let i=1;i<6;i++)ctx.lineTo(dx*i/6+(i%2?9:-9),dy*i/6);ctx.lineTo(dx,dy);ctx.stroke();}else if(effects){ctx.fillRect(-2,-8,4,16);ctx.fillRect(-8,-2,16,4);}ctx.restore();}}
