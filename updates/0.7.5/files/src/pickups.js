import {dealDamage} from './combat.js';
export const consumables={
 potion:{name:'Potion',icon:'/assets/ui/pickups/potion.svg',color:'#ee96c3'},
 nova:{name:'Méga-bombe',icon:'/assets/ui/pickups/nova.svg',color:'#ffc183'},
 freeze:{name:'Sablier de Shiva',icon:'/assets/ui/pickups/freeze.svg',color:'#a1e9ff'},
 magnet:{name:'Aimant d’XP',icon:'/assets/ui/pickups/magnet.svg',color:'#91edff'},
 haste:{name:'Plume de célérité',icon:'/assets/ui/pickups/haste.svg',color:'#ffdf8e'},
 level:{name:'Cristal d’expérience',icon:'/assets/ui/pickups/elite-crystal.png',color:'#ffd778'}
};
export function visible(s,e,width,height){return Math.abs(e.x-s.x)<=width/(2*s.zoom)+20&&Math.abs(e.y-s.y)<=height/(2*s.zoom)+20;}
export function dropLoot(s,e,random=Math.random){
 if(e.rareMog)return;
 s.pickups??=[];
 // Every boss guarantees one character level. Other instant items are deliberately rare.
 if(e.elite||e.superboss){const item={kind:'level',x:e.x,y:e.y,levels:e.roamingElite&&random()<.2?2:1};s.pickups.push(item);return item;}
 // Dense nearby waves can produce thousands of kills; keep instant items scarce.
 if(random()>=.0005)return;
 const roll=random(),kind=roll<.5?'potion':roll<.625?'nova':roll<.75?'freeze':roll<.875?'haste':'magnet';
 s.pickups.push({kind,x:e.x,y:e.y});
 if(s.pickups.length>60){const index=s.pickups.findIndex(p=>p.kind!=='level');if(index>=0)s.pickups.splice(index,1);}
}
export function consume(s,kind,width,height,levels=1){
 if(!consumables[kind])return false;
 if(kind==='potion')s.hp=Math.min(s.maxHp,s.hp+40);
 if(kind==='nova'){
  for(const e of s.enemies)if(!e.dying&&visible(s,e,width,height))dealDamage(s,e,Math.max(s.damage*8,(e.maxHp||0)*.25),'#ffe3ad','consumable');
  s.hostileProjectiles=(s.hostileProjectiles||[]).filter(p=>!visible(s,p,width,height));s.screenFlash={color:'#ffe2a6',life:.35,maxLife:.35};
 }
 if(kind==='freeze'){s.freezeTimer=Math.max(s.freezeTimer||0,5);s.screenFlash={color:'#98dbff',life:.25,maxLife:.25};}
 if(kind==='haste')s.hasteTimer=Math.max(s.hasteTimer||0,8);
 if(kind==='magnet')for(const gem of s.gems||[])gem.magnetized=true;
 if(kind==='level')s.pendingLevels=(s.pendingLevels||0)+(levels===2?2:1);
 s.pickupNotice={name:kind==='level'&&levels===2?'Cristal doré · deux niveaux':consumables[kind].name,life:2.5,color:levels===2?'#ffd174':consumables[kind].color};return true;
}
/** A magnet affects existing crystals only; XP is awarded on arrival, exactly once. */
export function tickExperienceGems(s,dt,experienceBonus=1){
 let collected=0;
 s.gems=(s.gems||[]).filter(g=>{
  let distance=Math.hypot(g.x-s.x,g.y-s.y);
  if(distance>=22){
   if(g.magnetized){const step=Math.min(distance,(420+distance*.7)*Math.max(0,dt)),factor=step/distance;g.x+=(s.x-g.x)*factor;g.y+=(s.y-g.y)*factor;}
   else if(distance<(s.gemAttractionRadius||125)){const factor=Math.min(1,Math.max(0,dt)*8);g.x+=(s.x-g.x)*factor;g.y+=(s.y-g.y)*factor;}
   distance=Math.hypot(g.x-s.x,g.y-s.y);
  }
  if(distance>=22)return true;
  s.xp+=(g.value||1)*(s.experienceMultiplier||1)*experienceBonus;collected++;return false;
 });
 if(collected)s.onExperiencePickup?.(collected);
}
export function tickPickups(s,dt,width,height){
 if(s.pickupNotice)s.pickupNotice.life-=dt;if(s.screenFlash)s.screenFlash.life-=dt;
 s.freezeTimer=Math.max(0,(s.freezeTimer||0)-dt);s.hasteTimer=Math.max(0,(s.hasteTimer||0)-dt);
 s.pickups=(s.pickups||[]).filter(p=>{if(Math.hypot(p.x-s.x,p.y-s.y)>26)return true;consume(s,p.kind,width,height,p.levels);return false;});
}
let rewardGlow=null;
function goldenRewardGlow(){
 if(rewardGlow)return rewardGlow;
 rewardGlow=document.createElement('canvas');rewardGlow.width=rewardGlow.height=96;
 const ctx=rewardGlow.getContext('2d'),gradient=ctx.createRadialGradient(48,48,3,48,48,46);
 gradient.addColorStop(0,'#ffe5a14d');gradient.addColorStop(.35,'#ffc75c25');gradient.addColorStop(1,'#e99f2800');ctx.fillStyle=gradient;ctx.fillRect(0,0,96,96);return rewardGlow;
}
export class PickupArt {
 constructor(){this.images=new Map();}
 async load(){await Promise.all(Object.entries(consumables).map(([kind,p])=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{this.images.set(kind,img);resolve();};img.onerror=()=>reject(Error('Icône indisponible : '+p.name));img.src=p.icon;})));}
 draw(ctx,s,ox,oy){
  for(const p of s.pickups||[]){
   const img=this.images.get(p.kind);if(!img)continue;
   const phase=s.time*2+p.x*.01,bob=Math.sin(phase)*3,x=p.x+ox,y=p.y+oy+bob,isLevel=p.kind==='level',size=isLevel?(p.levels===2?70:58):36;
   ctx.save();
   if(isLevel){ctx.globalAlpha=.65+.15*Math.sin(phase);ctx.drawImage(goldenRewardGlow(),x-size*.8,y-size*1.05,size*1.6,size*1.6);ctx.globalAlpha=1;ctx.imageSmoothingEnabled=true;}
   const width=isLevel?size*img.naturalWidth/img.naturalHeight:size;
   ctx.drawImage(img,x-width/2,y-size*.67,width,size);
   if(isLevel)for(let i=0;i<(p.levels===2?3:1);i++){
    const angle=phase*.55+i*Math.PI*.65,px=x+Math.cos(angle)*size*.4,py=y-12+Math.sin(angle)*size*.34,opacity=Math.max(0,Math.sin(phase*1.3+i))**4;
    ctx.globalAlpha=opacity*.65;ctx.strokeStyle='#fff1c9';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(px-3,py);ctx.lineTo(px+3,py);ctx.moveTo(px,py-3);ctx.lineTo(px,py+3);ctx.stroke();
   }
   ctx.restore();
  }
 }
}
