import {weaponUpgradeOptions,upgradeBranches} from './weapon-upgrades.js';
export const starters=['cloud','wol','lightning'];
// Explicit roster: each unit keeps its own downloaded animation manifest.
const roster=[
['cloud','Cloud','VII','Épée broyeuse','slash','#f6cc67',110,190,32],['wol','Warrior of Light','I','Lame de lumière','holy','#a5d7ff',150,155,27],['lightning','Lightning','XIII','Blazefire Saber','shot','#ffa1ce',90,220,24],
['asset-70472','Rain','BE','Épée écarlate','fire','#ff8557',125,185,31],['asset-87187','Lasswell','BE','Éclair pourpre','ice','#bda2ff',105,205,33],['asset-87186','Fina','BE','Arc de Fina','arrow','#ffe8a0',95,195,29],['asset-87692','Lid','BE','Marteau de mécanicienne','burst','#ffc578',135,170,37],['asset-91127','Jake','BE','Fusil de Jake','shot','#ffbb75',100,190,34],['asset-88183','Nichol','BE','Grimoire des marées','wave','#63d6ff',95,180,36],['asset-92746','Sakura','BE','Bâton de sakura','thunder','#efafff',90,180,39],['asset-88181','Dark Fina','BE','Fouet obscur','slash','#c478ff',100,185,38],['asset-116655','Sol','BE','Orbe du chaos','orb','#d895ff',95,175,42],
['asset-87214','Garland','I','Épée du chaos','burst','#d181e5',145,150,39],['asset-87210','Firion','II','Lame sanguine','slash','#ef627f',120,180,32],['asset-89281','Emperor','II','Sceptre impérial','fire','#f5ab58',95,165,42],['asset-95316','Onion Knight','III','Épée oignon','arrow','#aad6a4',100,215,28],['asset-87391','Cloud of Darkness','III','Faisceau de particules','beam','#b1eb96',135,160,40],['asset-87146','Cecil','IV','Excalibur','holy','#d3efff',145,160,30],['asset-87207','Golbez','IV','Météore noir','meteor','#a899ec',135,155,43],['asset-86770','Bartz','V','Brave Blade','slash','#f6d291',110,200,32],['asset-86769','Exdeath','V','Pouvoir du Néant','orb','#a8ddaf',155,140,42],['terra','Terra','VI','Brasier','fire','#ff895a',100,180,40],['asset-87086','Kefka','VI','Jugement','beam','#fc9cdb',90,185,44],['sephiroth','Sephiroth','VII','Masamune','slash','#c9b2fa',120,185,45],['asset-99240','Squall','VIII','Lion Heart','slash','#6dcbff',120,185,36],['asset-129583','Edea','VIII','Pointe de glace','ice','#c0e6ff',95,165,42],['asset-87021','Zidane','IX','Dagues de mage','boomerang','#87e8d6',95,235,27],['asset-87346','Kuja','IX','Ultima','meteor','#fca4ec',95,180,43],['asset-93680','Tidus','X','Fraternité','wave','#65c9ff',110,215,30],['asset-105336','Jecht','X','Épée de Jecht','burst','#ff986f',150,150,40],['yuna','Yuna','X','Sphère sacrée','orb','#a9f0ed',100,180,35],['asset-87355','Shantotto','XI','Bâton de sagesse','thunder','#eac2ff',85,180,45],['asset-109064','Shadow Lord','XI','Lame du seigneur des ombres','slash','#cc82ab',160,140,43],['asset-88524','Vaan','XII','Dague de Dalmasca','boomerang','#e6c28e',105,220,29],['asset-93734','Gabranth','XII','Chaos Blade','slash','#b9c8dd',155,150,37],['caius','Caius Ballad','XIII','Ragnarok','burst','#c5a3ef',140,165,42],['asset-90421',"Y’shtola",'XIV','Thyrse','holy','#edddbc',95,185,38],['gaius','Gaius van Baelsar','XIV','Heirsbane','shot','#dc9b80',145,160,37],['asset-86630','Noctis','XV','Armes fantômes','orbit','#9eb9ff',105,205,33],['asset-117465','Ardyn','XV','Arsenal spectral','orbit','#dd86a6',130,170,40]
];
export const heroes=roster.map(([id,name,series,weapon,kind,color,hp,speed,damage],i)=>({id,name,series,title:series==='BE'?'Brave Exvius':`Final Fantasy ${series}`,weapon,weaponId:`weapon-${id}`,kind,color,hp,speed,damage,range:kind==='slash'?145:kind==='burst'?120:360,price:starters.includes(id)?0:250+i*35,requirement:Math.max(10,(i-2)*15),unavailable:['caius','gaius'].includes(id)}));
// Weapon tuning keeps long blades, heavy swings and fast daggers distinct.
for(const h of heroes){if(h.id==='sephiroth')h.range=245;if(h.id==='asset-129583')h.range=450;if(h.id==='asset-87021')h.range=300;if(h.id==='asset-105336')h.range=175;}
const weaponDescriptions={slash:'Arc de lame face aux ennemis',holy:'Onde de lumière sacrée',shot:'Tir précis vers une cible',arrow:'Projectile rapide dirigé',fire:'Boule de feu explosive',ice:'Éclat de glace qui ralentit',burst:'Onde de choc circulaire',wave:'Vague d’eau dirigée',thunder:'Éclairs en chaîne',orb:'Sphère qui poursuit sa cible',beam:'Rayon dirigé vers les ennemis',meteor:'Météore avec explosion différée',boomerang:'Lame qui revient vers vous',orbit:'Lames tournant autour du héros'};
export const weapons=Object.fromEntries(heroes.map(h=>[h.weaponId,{id:h.weaponId,name:h.weapon,kind:h.kind,description:weaponDescriptions[h.kind],color:h.color,damage:h.damage,range:h.range,cooldown:['meteor','beam'].includes(h.kind)?2.3:['orb','orbit'].includes(h.kind)?1.9:1.15,upgrades:weaponUpgradeOptions(h.kind),icon:`/assets/ui/weapons/${h.weaponId}.svg`}]));
export const stages=[
 {id:'midgar',musicFile:'midgar.mp3',name:'Midgar',subtitle:'Final Fantasy VII · sous les réacteurs',description:'Coursives métalliques, conduites mako et patrouilles de la Shinra.',duration:300,colors:['#13282d','#1c3840'],accent:'#65e8bc',background:'/assets/maps/previews/midgar.png',enemies:['1010010', '1050310', '1060020'],bosses:['4060810', '4060910'],superboss:'jenova',rate:1},
 {id:'zanarkand',musicFile:'zanarkand.mp3',name:'Zanarkand',subtitle:'Final Fantasy X · ruines des priants',description:'Mosaïques oubliées, canaux luminescents et monstres des ruines sacrées.',duration:300,colors:['#17313f','#2c4f60'],accent:'#88dce8',background:'/assets/maps/previews/zanarkand.png',enemies:['1050320', '1030130', '3010110', '1100170'],bosses:['3010110'],superboss:'jecht',rate:1.1},
 {id:'crystal-tower',musicFile:'crystal-tower.mp3',name:'La Tour de Cristal',subtitle:'Final Fantasy III · palais de Xande',description:'Marbre azur, cristaux lumineux et gardiens de la tour.',duration:300,colors:['#273d59','#3c5171'],accent:'#a9ceff',background:'/assets/maps/previews/crystal-tower.png',enemies:['1050110', '4070430', '4070420', '4070410'],bosses:['4050210'],superboss:'emperor',rate:1.2},
 {id:'dark-world',musicFile:'dark-world.mp3',name:'Le Monde des Ténèbres',subtitle:'Final Fantasy III · au-delà des cristaux',description:'Obsidienne fracturée, failles violettes et créatures du néant.',duration:300,colors:['#21132e','#39223e'],accent:'#bd86ed',background:'/assets/maps/previews/dark-world.png',enemies:['1080110', '1040030', '3040510'],bosses:['3011010', '4070210'],superboss:'cloud-of-darkness',rate:1.35}
];
export const difficulties=[{id:'easy',name:'Apprenti',hp:.75,speed:.8,damage:.65,reward:.75},{id:'normal',name:'Aventurier',hp:1,speed:1,damage:1,reward:1},{id:'hard',name:'Légende',hp:1.6,speed:1.25,damage:1.6,reward:1.5}];
export const upgrades=[{id:'damage',name:'Force du cristal',detail:'+25 % de dégâts',icon:'/assets/ui/boosts/damage.svg'},{id:'speed',name:'Bottes de célérité',detail:'+15 % de déplacement',icon:'/assets/ui/boosts/speed.svg'},{id:'range',name:'Œil de l’aigle',detail:'+20 % de portée',icon:'/assets/ui/boosts/range.svg'},{id:'heal',name:'Bénédiction',detail:'Restaure 40 PV, +20 PV maximum',icon:'/assets/ui/boosts/heal.svg'},{id:'rate',name:'Hâte',detail:'Attaques 15 % plus rapides',icon:'/assets/ui/boosts/rate.svg'}];
export function normalizeSave(raw){const s=raw&&typeof raw==='object'?raw:{};return {version:3,limitBreakLevel:s.limitBreakLevel===1?1:0,coins:Number.isFinite(s.coins)?Math.max(0,Math.floor(s.coins)):0,unlocked:[...new Set([...starters,...(Array.isArray(s.unlocked)?s.unlocked.filter(id=>heroes.some(h=>h.id===id&&!h.unavailable)):[])])],stats:{kills:Math.max(0,Number(s.stats?.kills)||0),runs:Math.max(0,Number(s.stats?.runs)||0),wins:Math.max(0,Number(s.stats?.wins)||0),bestLevel:Math.max(1,Number(s.stats?.bestLevel)||1)},bestiary:s.bestiary&&typeof s.bestiary==='object'?s.bestiary:{},options:{sound:s.options?.sound!==false,effects:s.options?.effects!==false,music:s.options?.music!==false,musicVolume:Number.isFinite(s.options?.musicVolume)?Math.max(0,Math.min(1,s.options.musicVolume)):.4},stageWins:s.stageWins&&typeof s.stageWins==='object'?s.stageWins:{}};}
export function loadSave(storage){try{return normalizeSave(JSON.parse(storage.getItem('bes-save')));}catch{return normalizeSave(null);}}
export function available(save,hero){return !hero.unavailable&&(starters.includes(hero.id)||save.unlocked.includes(hero.id)||save.stats.kills>=hero.requirement);}
export function purchase(save,id){const h=heroes.find(h=>h.id===id);if(!h||!available(save,h)||save.unlocked.includes(id)||save.coins<h.price)return false;save.coins-=h.price;save.unlocked.push(id);return true;}
export function applyUpgrade(s,id){if(id==='damage')s.damage*=1.25;if(id==='speed')s.speed*=1.15;if(id==='range')s.range*=1.2;if(id==='heal'){s.maxHp+=20;s.hp=Math.min(s.maxHp,s.hp+40);}if(id==='rate')s.cooldown*=.85;}
export function reward(kills,time){return Math.floor(kills*2+time/5);}
export function recordMonster(save,id,name,killed=false){const old=save.bestiary[id]||{name,seen:0,kills:0};old.name=name;if(killed)old.kills++;else old.seen++;save.bestiary[id]=old;}
export function completeRun(save,run,won){save.coins+=Math.floor((reward(run.kills,run.time)+(won?100:0))*run.difficulty.reward);save.stats.kills+=run.kills;save.stats.runs++;save.stats.wins+=Number(won);save.stats.bestLevel=Math.max(save.stats.bestLevel,run.level);if(won)save.stageWins[run.stage.id]=(save.stageWins[run.stage.id]||0)+1;}
export const powerups=Object.fromEntries([
 ['force','Bracelet de force','+15 % de dégâts pour toutes les armes.','damage', '#efb86b'],
 ['haste','Bague de célérité','Recharge des armes réduite de 8 %.','rate','#e4cb79'],
 ['reach','Longue portée','+12 % de portée et de taille des attaques.','range','#91ddbc'],
 ['multishot','Double coupe','Un projectile de plus ; +8 % de dégâts de mêlée.','multishot','#cab1ff'],
 ['pierce','Transpercer','Les projectiles traversent un ennemi supplémentaire.','pierce','#7dcdff'],
 ['frost','Materia Glace','Les touches ralentissent de 18 % pendant 1,5 s.','frost','#a6e9ff'],
 ['blast','Materia Feu','Chaque touche inflige 12 % de dégâts aux ennemis voisins.','blast','#ffab73'],
 ['leech','Lame sanguine','Chaque élimination restaure 1 PV.','leech','#e995b8']
].map(([id,name,detail,effect,color])=>[id,{id,name,detail,effect,color,icon:'/assets/ui/powerups/'+id+'.svg',maxLevel:5}]));
export function equipmentEffects(s){const levels=Object.fromEntries((s.powerups||[]).map(p=>[p.id,p.level]));return {damage:1+.15*(levels.force||0),melee:1+.08*(levels.multishot||0),cooldown:Math.max(.6,1-.08*(levels.haste||0))*((s.hasteTimer||0)>0?.65:1),range:1+.12*(levels.reach||0),extraProjectiles:levels.multishot||0,pierce:levels.pierce||0,slow:Math.min(.7,.18*(levels.frost||0)),splash:.12*(levels.blast||0),leech:levels.leech||0};}
export function levelChoices(s,random=Math.random){
 const improvements=[],newWeapons=[];
 for(const w of Object.values(weapons)){
  const equipped=s.weapons.find(x=>x.id===w.id);
  if(equipped){for(const branch of upgradeBranches(w,equipped))improvements.push({type:'weapon',id:w.id,upgrade:branch.id,name:w.name+' · '+branch.name,icon:w.icon,detail:`Arme niveau ${equipped.level+1} · ${branch.detail}`});}
  else if(s.weapons.length<6)newWeapons.push({type:'weapon',id:w.id,name:w.name,icon:w.icon,detail:'Nouvelle arme · '+w.description});
 }
 const shuffle=list=>list.map(choice=>({choice,r:random()})).sort((a,b)=>a.r-b.r).map(x=>x.choice);
 const weaponChoices=[];
 if(improvements.length)weaponChoices.push(shuffle(improvements)[0]);
 const remaining=shuffle([...improvements,...newWeapons]).filter(c=>!weaponChoices.some(p=>p.id===c.id&&p.upgrade===c.upgrade));
 weaponChoices.push(...remaining.slice(0,2-weaponChoices.length));
 const equipped=s.powerups||[],passives=Object.values(powerups).filter(p=>{const own=equipped.find(x=>x.id===p.id);return own?own.level<p.maxLevel:equipped.length<6;}).map(p=>({p,r:random()})).sort((a,b)=>a.r-b.r);
 const passiveChoices=passives.slice(0,weaponChoices.length?1:2).map(({p})=>{const level=(equipped.find(x=>x.id===p.id)?.level||0)+1;return {...p,type:'powerup',detail:`${level===1?'Nouveau power-up':'Power-up niveau '+level} · ${p.detail}`};});
 const choices=[...weaponChoices,...passiveChoices];
 if(choices.length<3)choices.push({...upgrades.find(u=>u.id==='heal'),type:'stat'});
 return choices;
}
export function chooseUpgrade(s,choice){
 if(choice.type==='stat'){applyUpgrade(s,choice.id);return;}
 if(choice.type==='powerup'){
  const definition=powerups[choice.id];if(!definition)return;s.powerups??=[];
  const existing=s.powerups.find(p=>p.id===choice.id);
  if(existing){if(existing.level<definition.maxLevel)existing.level++;}
  else if(s.powerups.length<6)s.powerups.push({id:choice.id,level:1});
  return;
 }
 if(choice.type!=='weapon')return;
 const definition=weapons[choice.id];if(!definition)return;
 const existing=s.weapons.find(w=>w.id===choice.id);
 if(existing){
  const branch=definition.upgrades.find(b=>b.id===(choice.upgrade||'damage'));
  if(!branch||!upgradeBranches(definition,existing).some(b=>b.id===branch.id))return;
  existing.upgrades??={damage:Math.max(0,existing.level-1)};
  existing.upgrades[branch.id]=(existing.upgrades[branch.id]||0)+1;existing.level++;
 }else if(s.weapons.length<6&&!choice.upgrade)s.weapons.push({id:choice.id,level:1,upgrades:{},timer:0});
}
