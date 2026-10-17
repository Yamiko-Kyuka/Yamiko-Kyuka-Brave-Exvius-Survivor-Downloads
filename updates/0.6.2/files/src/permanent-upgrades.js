// Account-wide upgrades use gils and never occupy an expedition equipment slot.
export const permanentUpgrades=[
 {id:'vitality',name:'Vitalité',detail:'+10 % de vie maximum par rang',step:.10,baseCost:200,icon:'/assets/ui/boosts/heal.svg'},
 {id:'might',name:'Force des cristaux',detail:'+5 % de dégâts pour toutes les armes par rang',step:.05,baseCost:300,icon:'/assets/ui/boosts/damage.svg'},
 {id:'haste',name:'Célérité',detail:'−4 % de temps de recharge par rang',step:.04,baseCost:350,icon:'/assets/ui/boosts/rate.svg'},
 {id:'stride',name:'Agilité',detail:'+4 % de vitesse de déplacement par rang',step:.04,baseCost:200,icon:'/assets/ui/boosts/speed.svg'},
 {id:'reach',name:'Portée',detail:'+5 % de portée des armes par rang',step:.05,baseCost:250,icon:'/assets/ui/boosts/range.svg'},
 {id:'wisdom',name:'Sagesse',detail:'+5 % d’expérience des cristaux par rang',step:.05,baseCost:300,icon:'/assets/ui/pickups/level.svg'},
 {id:'magnet',name:'Appel des cristaux',detail:'+15 % de distance d’attraction des cristaux par rang',step:.15,baseCost:150,icon:'/assets/ui/powerups/reach.svg'},
 {id:'guard',name:'Protection',detail:'−4 % de dégâts reçus par rang',step:.04,baseCost:300,icon:'/assets/ui/boosts/heal.svg'},
 {id:'regen',name:'Régénération',detail:'Restaure 0,5 PV par seconde et par rang',step:.5,baseCost:350,icon:'/assets/ui/pickups/potion.svg'},
 {id:'fortune',name:'Gils bonus',detail:'+5 % de gils gagnés en expédition par rang',step:.05,baseCost:300,icon:'/assets/ui/boosts/damage.svg'},
 {id:'quantity',name:'Salve supplémentaire',detail:'+1 projectile pour les armes compatibles par rang',step:1,baseCost:1500,maxLevel:2,icon:'/assets/ui/powerups/multishot.svg'},
 {id:'rerolls',name:'Nouvelle destinée',detail:'+1 relance des choix de niveau par expédition et par rang',step:1,baseCost:500,maxLevel:3,icon:'/assets/ui/boosts/rate.svg'},
 {id:'banishes',name:'Sceau d’exclusion',detail:'+1 choix exclu pour toute l’expédition par rang',step:1,baseCost:500,maxLevel:3,icon:'/assets/ui/powerups/frost.svg'},
 {id:'luck',name:'Chance',detail:'Favorise les récompenses de rareté élevée à chaque rang',step:.10,baseCost:600,icon:'/assets/ui/pickups/level.svg'}
].map(upgrade=>({maxLevel:5,...upgrade}));

export function normalizePermanentUpgrades(raw){
 return Object.fromEntries(permanentUpgrades.map(({id,maxLevel})=>[id,Number.isFinite(raw?.[id])?Math.min(maxLevel,Math.max(0,Math.floor(raw[id]))):0]));
}
export function permanentUpgradeCost(save,id){
 const upgrade=permanentUpgrades.find(u=>u.id===id);if(!upgrade)return null;
 const level=normalizePermanentUpgrades(save.permanentUpgrades)[id];
 return level>=upgrade.maxLevel?null:upgrade.baseCost*(level+1);
}
export function purchasePermanentUpgrade(save,id){
 const cost=permanentUpgradeCost(save,id);
 if(cost===null||!Number.isFinite(save.coins)||save.coins<cost)return false;
 save.permanentUpgrades=normalizePermanentUpgrades(save.permanentUpgrades);
 save.coins-=cost;save.permanentUpgrades[id]++;return true;
}
export function permanentBonuses(save){
 const levels=normalizePermanentUpgrades(save.permanentUpgrades);
 return {health:1+levels.vitality*.10,damage:1+levels.might*.05,cooldown:1-levels.haste*.04,speed:1+levels.stride*.04,range:1+levels.reach*.05,experience:1+levels.wisdom*.05,magnet:1+levels.magnet*.15,defense:levels.guard*.04,regen:levels.regen*.5,gils:1+levels.fortune*.05,projectiles:levels.quantity,rerolls:levels.rerolls,banishes:levels.banishes,luck:levels.luck*.10};
}
export function permanentHeroStats(hero,save){
 const b=permanentBonuses(save);
 return {hp:Math.round(hero.hp*b.health),damage:hero.damage*b.damage,speed:hero.speed*b.speed,range:hero.range*b.range,cooldown:b.cooldown};
}
export function applyPermanentUpgrades(state,save){
 const stats=permanentHeroStats(state,save),b=permanentBonuses(save);
 Object.assign(state,{maxHp:stats.hp,hp:stats.hp,damage:stats.damage,speed:stats.speed,range:stats.range,cooldown:stats.cooldown,experienceMultiplier:b.experience,gemAttractionRadius:125*b.magnet,defense:b.defense,regeneration:b.regen,gilsMultiplier:b.gils,bonusProjectiles:b.projectiles,rerollsRemaining:b.rerolls,banishesRemaining:b.banishes,luck:b.luck,banishedChoices:[]});
}
export function mitigatedDamage(state,damage){
 if(state.aegisShield){state.aegisShield=false;state.aegisCooldown=25;state.pickupNotice={name:'Égide d’Alexandre · coup absorbé !',life:2};return 0;}
 const guard=(state.powerups||[]).find(p=>p.id==='guard');
 return damage*(1-Math.max(0,Math.min(.5,(state.defense||0)+.03*(guard?.potency??guard?.level??0))));
}
export function tickRegeneration(state,dt,extra=0){if(state.hp>0)state.hp=Math.min(state.maxHp,state.hp+(Math.max(0,state.regeneration||0)+extra)*dt);}
