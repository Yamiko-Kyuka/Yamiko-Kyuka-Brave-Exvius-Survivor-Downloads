import {clipFor} from './animation.js';
import {weapons,equipmentEffects} from './model.js';
import {weaponInterval} from './attack-timing.js';
import {weaponTuning} from './weapon-upgrades.js';
export const superbosses={
 jenova:{name:'Jenova',size:260,special:'jenova-radiance',health:300,color:'#85e4e9'},
 jecht:{name:'Jecht',manifest:'asset-174143',lastVariant:true,size:245,special:'jecht-shot',health:320,color:'#ffb784'},
 emperor:{name:'L’Empereur · FF II',manifest:'asset-89281',variantLabel:'Emperor NV',size:235,special:'emperor-cyclone',health:310,color:'#ffca7e'},
 'cloud-of-darkness':{name:'Cloud of Darkness',manifest:'asset-117478',lastVariant:true,size:265,special:'darkness-particles',health:340,color:'#b6f4a3'}
};
export async function loadSuperboss(stage,manifest,cache){
 const definition=superbosses[stage.superboss];if(!definition)throw Error('Superboss absent : '+stage.name);
 let variant;
 if(stage.superboss==='jenova'){const r=await fetch('/assets/bosses/jenova.json');if(!r.ok)throw Error('Animations de Jenova indisponibles');variant=await r.json();}
 else{const entity=await manifest(definition.manifest),list=entity.variants.filter(v=>v.playable);variant=list.find(v=>v.label===definition.variantLabel)||(definition.lastVariant?list.at(-1):list[0]);}
 if(!clipFor(variant,'idle'))throw Error('Animation du superboss indisponible');
 await cache.preload(['idle','atk','dead'].map(k=>clipFor(variant,k)));
 return {...definition,id:'boss-'+stage.superboss,variant,hp:1,speed:.75};
}
/** Budget health for a full loadout, without cancelling the benefit of temporary haste. */
export function superbossHealth(s,profile){
 const permanent={...s,hasteTimer:0},mods=equipmentEffects(permanent);let dps=0;
 for(const equipped of s.weapons){const w=weapons[equipped.id];if(!w)continue;
  const tuning=weaponTuning(w,equipped),melee=['slash','burst','holy'].includes(w.kind);
  const count=melee||w.kind==='thunder'?1:w.kind==='meteor'?1+tuning.zones+mods.extraProjectiles:(w.kind==='orbit'?2:1)+tuning.projectiles+mods.extraProjectiles;
  // A spread volley does not land every projectile on one boss. Extra shots still
  // help the player instead of multiplying boss health without a useful limit.
  const shots=1+Math.min(4,count-1)*.5;
  const damage=w.damage*(s.damage/s.baseDamage)*tuning.damage*mods.damage*(melee?mods.melee:1);
  dps+=damage*shots/weaponInterval(permanent,equipped);
 }
 return Math.ceil(Math.max(s.baseDamage*profile.health,dps*30)*(s.difficulty.bossHp??s.difficulty.hp));
}
export function superbossSpawnPoint(s,width,height,radius=28){
 const halfW=width/(2*s.zoom),halfH=height/(2*s.zoom),target={x:s.x+Math.min(200,halfW*.45),y:s.y+Math.min(100,halfH*.35)};
 let best=null,cost=Infinity;
 for(const index of s.terrain.floor){const p=s.terrain.center(index);
  if(Math.abs(p.x-s.x)>halfW-20||Math.abs(p.y-s.y)>halfH-20||!s.terrain.walkable(p.x,p.y,radius))continue;
  const distance=Math.hypot(p.x-s.x,p.y-s.y),score=Math.hypot(p.x-target.x,p.y-target.y)+(distance<85?200:0)+(s.terrain.lineClear(s.x,s.y,p.x,p.y)?0:80);
  if(score<cost){best=p;cost=score;}
 }
 return best||s.terrain.nearestFloor(target.x,target.y,radius);
}
export function beginFinalEncounter(s,spawn){
 if(s.phase!=='survival'||s.time+1e-6<s.stage.duration)return false;
 const boss=spawn(s.bossProfile);if(!boss)return false;
 s.phase='superboss';s.spawn=Infinity;s.superboss=boss;s.bossNotice={name:s.bossProfile.name,life:4};return true;
}
