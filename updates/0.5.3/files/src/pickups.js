import {dealDamage} from './combat.js';
export const consumables={
 potion:{name:'Potion',icon:'/assets/ui/pickups/potion.svg',color:'#ee96c3'},
 nova:{name:'Méga-bombe',icon:'/assets/ui/pickups/nova.svg',color:'#ffc183'},
 freeze:{name:'Sablier de Shiva',icon:'/assets/ui/pickups/freeze.svg',color:'#a1e9ff'},
 haste:{name:'Plume de célérité',icon:'/assets/ui/pickups/haste.svg',color:'#ffdf8e'},
 level:{name:'Cristal d’expérience',icon:'/assets/ui/pickups/level.svg',color:'#cbb3ff'}
};
export function visible(s,e,width,height){return Math.abs(e.x-s.x)<=width/(2*s.zoom)+20&&Math.abs(e.y-s.y)<=height/(2*s.zoom)+20;}
export function dropLoot(s,e,random=Math.random){
 s.pickups??=[];
 // Every boss guarantees one character level. Other instant items are deliberately rare.
 if(e.elite||e.superboss){const item={kind:'level',x:e.x,y:e.y};s.pickups.push(item);return item;}
 if(random()>=.025)return;
 const roll=random(),kind=roll<.55?'potion':roll<.7?'nova':roll<.85?'freeze':'haste';
 s.pickups.push({kind,x:e.x,y:e.y});
 if(s.pickups.length>60){const index=s.pickups.findIndex(p=>p.kind!=='level');if(index>=0)s.pickups.splice(index,1);}
}
export function consume(s,kind,width,height){
 if(!consumables[kind])return false;
 if(kind==='potion')s.hp=Math.min(s.maxHp,s.hp+40);
 if(kind==='nova'){
  for(const e of s.enemies)if(!e.dying&&visible(s,e,width,height))dealDamage(s,e,Math.max(s.damage*8,(e.maxHp||0)*.25),'#ffe3ad','consumable');
  s.hostileProjectiles=(s.hostileProjectiles||[]).filter(p=>!visible(s,p,width,height));s.screenFlash={color:'#ffe2a6',life:.35,maxLife:.35};
 }
 if(kind==='freeze'){s.freezeTimer=Math.max(s.freezeTimer||0,5);s.screenFlash={color:'#98dbff',life:.25,maxLife:.25};}
 if(kind==='haste')s.hasteTimer=Math.max(s.hasteTimer||0,8);
 if(kind==='level')s.pendingLevels=(s.pendingLevels||0)+1;
 s.pickupNotice={name:consumables[kind].name,life:2.5,color:consumables[kind].color};return true;
}
export function tickPickups(s,dt,width,height){
 if(s.pickupNotice)s.pickupNotice.life-=dt;if(s.screenFlash)s.screenFlash.life-=dt;
 s.freezeTimer=Math.max(0,(s.freezeTimer||0)-dt);s.hasteTimer=Math.max(0,(s.hasteTimer||0)-dt);
 s.pickups=(s.pickups||[]).filter(p=>{if(Math.hypot(p.x-s.x,p.y-s.y)>26)return true;consume(s,p.kind,width,height);return false;});
}
export class PickupArt {
 constructor(){this.images=new Map();}
 async load(){await Promise.all(Object.entries(consumables).map(([kind,p])=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{this.images.set(kind,img);resolve();};img.onerror=()=>reject(Error('Icône indisponible : '+p.name));img.src=p.icon;})));}
 draw(ctx,s,ox,oy){for(const p of s.pickups||[]){const img=this.images.get(p.kind);if(!img)continue;const bob=Math.sin(s.time*3+p.x*.01)*3;ctx.save();ctx.shadowColor=consumables[p.kind].color;ctx.shadowBlur=12;ctx.drawImage(img,p.x+ox-18,p.y+oy-24+bob,36,36);ctx.restore();}}
}
