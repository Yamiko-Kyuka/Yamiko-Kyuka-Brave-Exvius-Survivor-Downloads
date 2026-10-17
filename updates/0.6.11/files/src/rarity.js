export const rarities=[
 {id:'normal',name:'Normal',color:'#ffffff',weight:6500,potency:1,count:1,initialDamage:0},
 {id:'magic',name:'Magique',color:'#42f29a',weight:1700,potency:1.2,count:2,initialDamage:.10},
 {id:'rare',name:'Rare',color:'#55aaff',weight:1000,potency:1.45,count:3,initialDamage:.20},
 {id:'epic',name:'Épique',color:'#ce80ff',weight:700,potency:1.8,count:4,initialDamage:.35},
 {id:'legendary',name:'Légendaire',color:'#ffd04e',weight:100,potency:2.25,count:5,initialDamage:.50}
];
export function rarityOf(choice){return rarities.find(r=>r.id===choice.rarity)||rarities[0];}
export function rarityProbabilities(luck=0){
 const bonus=Math.max(0,Math.min(1,Number(luck)||0)),weights=rarities.map((r,i)=>r.weight*(1+bonus*i));
 const total=weights.reduce((a,b)=>a+b,0);return weights.map(w=>w/total);
}
export function rollRarity(random=Math.random,luck=0){
 let roll=Math.max(0,Math.min(1-Number.EPSILON,random()));
 const probabilities=rarityProbabilities(luck);
 for(let i=0;i<rarities.length;i++){roll-=probabilities[i];if(roll<0)return rarities[i];}
 return rarities.at(-1);
}
export function choiceKey(choice){return [choice.type,choice.id,choice.upgrade||''].join(':');}
export function choiceAllowed(state,choice){return !(state.banishedChoices||[]).includes(choiceKey(choice))&&!(state.temporaryExcludedChoices||[]).includes(choiceKey(choice));}
export function upgradePotency(choice){return ['projectiles','zones'].includes(choice.upgrade)||choice.type==='powerup'&&['multishot','pierce'].includes(choice.id)?rarityOf(choice).count:rarityOf(choice).potency;}
export function rarityDetail(choice,potencyOverride){
 const r=rarityOf(choice),percent=n=>Number(n.toFixed(2))+' %',factor=potencyOverride??upgradePotency(choice);
 if(choice.type==='weapon'){
  if(!choice.upgrade)return choice.detail+(r.initialDamage?' · Puissance initiale +'+percent(r.initialDamage*100):'');
  const effects={damage:'+'+percent(25*factor)+' de dégâts',area:'+'+percent(20*factor)+' de taille et de zone d’impact',rate:'−'+percent(8*factor)+' de recharge (réduction de branche plafonnée à 40 %)',projectiles:'+'+factor+' projectile'+(factor>1?'s':''),zones:'+'+factor+' zone'+(factor>1?'s':'')+' / cible'+(factor>1?'s':'')};
  return 'Arme améliorée · '+effects[choice.upgrade];
 }
 if(choice.type==='powerup')return ({force:'+'+percent(15*factor)+' de dégâts pour toutes les armes',haste:'−'+percent(8*factor)+' de recharge (power-up plafonné à 40 %)',reach:'+'+percent(12*factor)+' de portée et de taille',multishot:'+'+factor+' projectile'+(factor>1?'s':'')+' ; +'+percent(8*factor)+' de dégâts de mêlée',pierce:'Traverse '+factor+' ennemi'+(factor>1?'s':'')+' supplémentaire'+(factor>1?'s':''),frost:'Ralentissement +'+percent(18*factor)+' (plafond 70 %)',blast:'Dégâts aux voisins : +'+percent(12*factor)+' des dégâts de touche',leech:'Restaure '+Number(factor.toFixed(2))+' PV par élimination',vitality:'+'+percent(10*factor)+' de vie maximum',guard:'Réduction des dégâts +'+percent(3*factor)+' (protection totale plafonnée à 50 %)',regen:'Régénère '+Number((.3*factor).toFixed(3))+' PV/s',wisdom:'+'+percent(8*factor)+' d’expérience des cristaux',fortune:'+'+percent(8*factor)+' de gils gagnés',luck:'Favorise les raretés élevées : +'+percent(8*factor)+' de chance pondérée',stride:'+'+percent(5*factor)+' de vitesse de déplacement',knockback:'+'+percent(20*factor)+' de distance de recul sur les monstres ordinaires ; boss et élites immunisés'})[choice.id]||choice.detail;
 if(choice.id==='heal')return 'Restaure '+Math.round(40*r.potency)+' PV, +'+Math.round(20*r.potency)+' PV maximum';
 return choice.detail;
}
export function decorateChoice(choice,random,luck){const result={...choice,rarity:rollRarity(random,luck).id};result.detail=rarityDetail(result);return result;}
