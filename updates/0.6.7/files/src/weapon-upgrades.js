// Upgrade points belong to one equipped weapon, never to the entire loadout.
const options={
 damage:{id:'damage',name:'Puissance',detail:'+25 % de dégâts',max:4},
 area:{id:'area',name:'Amplitude',detail:'+20 % de taille et de zone d’impact',max:3},
 projectiles:{id:'projectiles',name:'Salve',detail:'+1 projectile par attaque',max:3},
 zones:{id:'zones',name:'Zones multiples',detail:'+1 zone par attaque',max:2},
 rate:{id:'rate',name:'Cadence',detail:'Recharge réduite de 8 %',max:3}
};
const profiles={
 slash:['damage','area','zones','rate'],holy:['damage','area','zones','rate'],
 burst:['damage','area','zones','rate'],meteor:['damage','area','zones','rate'],
 thunder:['damage','area','zones','rate']
};
export function weaponUpgradeOptions(kind){return (profiles[kind]||['damage','projectiles','area','rate']).map(id=>({...options[id],...(kind==='thunder'&&id==='zones'?{name:'Chaîne prolongée',detail:'+1 cible dans la chaîne'}:{}),...(kind==='thunder'&&id==='area'?{name:'Conductivité',detail:'+20 % de portée des éclairs'}:{}),...(kind==='beam'&&id==='projectiles'?{name:'Rayons jumeaux',detail:'+1 rayon par attaque'}:{})}));}
export function weaponTuning(definition,equipped){
 const points=equipped.upgradePower||equipped.upgrades||{};
 // Legacy equipped weapons without branch data retain their former damage.
 const damage=equipped.upgrades?points.damage||0:Math.max(0,(equipped.level||1)-1);
 return {damage:(1+.25*damage)*(equipped.qualityDamage||1),area:1+.2*(points.area||0),projectiles:points.projectiles||0,zones:points.zones||0,cooldown:Math.max(.6,1-.08*(points.rate||0))};
}
export function upgradeBranches(definition,equipped){
 if(equipped.level>=8)return [];
 return definition.upgrades.filter(branch=>!(branch.id==='rate'&&(equipped.upgradePower?.rate||0)>=5)&&(equipped.upgrades?.[branch.id]??(branch.id==='damage'&&!equipped.upgrades?Math.max(0,equipped.level-1):0))<branch.max);
}
