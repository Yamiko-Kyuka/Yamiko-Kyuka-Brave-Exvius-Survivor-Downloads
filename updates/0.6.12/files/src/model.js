import {normalizeAudioSettings} from './audio-settings.js';
import {normalizeCosmetics} from './gacha.js';
import {normalizeBossWins,heroChallengeProgress,creditBossVictory} from './hero-achievements.js';
import {choiceAllowed,choiceKey,decorateChoice,rarityDetail,rarityOf,rarityProbabilities,upgradePotency} from './rarity.js';
import {normalizePermanentUpgrades} from './permanent-upgrades.js';
import {weaponUpgradeOptions,upgradeBranches,weaponTuning} from './weapon-upgrades.js';
export const starters=['cloud','wol','lightning'];
// Explicit roster: each unit keeps its own downloaded animation manifest.
const roster=[
['cloud','Cloud','VII','Épée broyeuse','slash','#f6cc67',110,190,32],['wol','Warrior of Light','I','Lame de lumière','holy','#a5d7ff',150,155,27],['lightning','Lightning','XIII','Blazefire Saber','shot','#ffa1ce',90,220,24],
['asset-70472','Rain','BE','Épée écarlate','fire','#ff8557',125,185,31],['asset-87187','Lasswell','BE','Éclair pourpre','ice','#bda2ff',105,205,33],['asset-87186','Fina','BE','Arc de Fina','arrow','#ffe8a0',95,195,29],['asset-87692','Lid','BE','Marteau de mécanicienne','burst','#ffc578',135,170,37],['asset-91127','Jake','BE','Fusil de Jake','shot','#ffbb75',100,190,34],['asset-88183','Nichol','BE','Grimoire des marées','wave','#63d6ff',95,180,36],['asset-92746','Sakura','BE','Bâton de sakura','thunder','#efafff',90,180,39],['asset-88181','Dark Fina','BE','Fouet obscur','slash','#c478ff',100,185,38],['asset-116655','Sol','BE','Orbe du chaos','orb','#d895ff',95,175,42],
['asset-87214','Garland','I','Épée du chaos','burst','#d181e5',145,150,39],['asset-87210','Firion','II','Lame sanguine','slash','#ef627f',120,180,32],['asset-89281','Emperor','II','Sceptre impérial','fire','#f5ab58',95,165,42],['asset-95316','Onion Knight','III','Épée oignon','arrow','#aad6a4',100,215,28],['asset-87391','Cloud of Darkness','III','Faisceau de particules','beam','#b1eb96',135,160,40],['asset-87146','Cecil','IV','Excalibur','holy','#d3efff',145,160,30],['asset-87207','Golbez','IV','Météore noir','meteor','#a899ec',135,155,43],['asset-86770','Bartz','V','Brave Blade','slash','#f6d291',110,200,32],['asset-86769','Exdeath','V','Pouvoir du Néant','orb','#a8ddaf',155,140,42],['terra','Terra','VI','Brasier','fire','#ff895a',100,180,40],['asset-87086','Kefka','VI','Jugement','beam','#fc9cdb',90,185,44],['sephiroth','Sephiroth','VII','Masamune','slash','#c9b2fa',120,185,45],['asset-99240','Squall','VIII','Lion Heart','slash','#6dcbff',120,185,36],['asset-129583','Edea','VIII','Pointe de glace','ice','#c0e6ff',95,165,42],['asset-87021','Zidane','IX','Dagues de mage','boomerang','#87e8d6',95,235,27],['asset-87346','Kuja','IX','Ultima','meteor','#fca4ec',95,180,43],['asset-93680','Tidus','X','Fraternité','wave','#65c9ff',110,215,30],['asset-105336','Jecht','X','Épée de Jecht','burst','#ff986f',150,150,40],['yuna','Yuna','X','Sphère sacrée','orb','#a9f0ed',100,180,35],['asset-87355','Shantotto','XI','Bâton de sagesse','thunder','#eac2ff',85,180,45],['asset-109064','Shadow Lord','XI','Lame du seigneur des ombres','slash','#cc82ab',160,140,43],['asset-88524','Vaan','XII','Dague de Dalmasca','boomerang','#e6c28e',105,220,29],['asset-93734','Gabranth','XII','Chaos Blade','slash','#b9c8dd',155,150,37],['caius','Caius Ballad','XIII','Ragnarok','burst','#c5a3ef',140,165,42],['asset-90421',"Y’shtola",'XIV','Thyrse','holy','#edddbc',95,185,38],['gaius','Gaius van Baelsar','XIV','Heirsbane','shot','#dc9b80',145,160,37],['asset-86630','Noctis','XV','Armes fantômes','orbit','#9eb9ff',105,205,33],['asset-117465','Ardyn','XV','Arsenal spectral','orbit','#dd86a6',130,170,40]
];
export const heroes=roster.map(([id,name,series,weapon,kind,color,hp,speed,damage],i)=>({id,name,series,title:series==='BE'?'Brave Exvius':`Final Fantasy ${series}`,weapon,weaponId:`weapon-${id}`,kind,color,hp,speed,damage,range:kind==='slash'?145:kind==='burst'?120:360,unavailable:['caius','gaius'].includes(id)})).filter(hero=>!hero.unavailable);
// Weapon tuning keeps long blades, heavy swings and fast daggers distinct.
for(const h of heroes){if(h.id==='sephiroth')h.range=245;if(h.id==='asset-129583')h.range=450;if(h.id==='asset-87021')h.range=300;if(h.id==='asset-105336')h.range=175;}
const weaponDescriptions={slash:'Arc de lame face aux ennemis',holy:'Onde de lumière sacrée',shot:'Tir précis vers une cible',arrow:'Projectile rapide dirigé',fire:'Boule de feu explosive',ice:'Éclat de glace qui ralentit',burst:'Onde de choc circulaire',wave:'Vague d’eau dirigée',thunder:'Éclairs en chaîne',orb:'Sphère qui poursuit sa cible',beam:'Rayon dirigé vers les ennemis',meteor:'Météore avec explosion différée',boomerang:'Lame qui revient vers vous',orbit:'Lames tournant autour du héros'};
const baseWeaponCadence={slash:1.15,holy:1.35,burst:1.43,gun:.73,orb:1.55,orbit:1.91,meteor:2.31,beam:2.07,thunder:1.67,ice:1.23,boomerang:1.37};
// Keep each existing weapon's cadence when unavailable roster entries are removed.
export const weapons=Object.fromEntries(heroes.map(h=>{const i=roster.findIndex(([id])=>id===h.id);return [h.weaponId,{id:h.weaponId,name:h.weapon,kind:h.kind,description:weaponDescriptions[h.kind],color:h.color,damage:h.damage,range:h.range,cooldown:Number(((baseWeaponCadence[h.kind]||1.21)+((i*7)%13)*.019+i*.001).toFixed(3)),upgrades:weaponUpgradeOptions(h.kind),icon:`/assets/ui/weapons/${h.weaponId}.svg`}];}));
export const stages=[
 {id:'midgar',tileset:'midgar-v2',musicFile:'midgar.mp3',name:'Midgar',subtitle:'Final Fantasy VII · sous les réacteurs',description:'Coursives métalliques, conduites mako et patrouilles de la Shinra.',duration:360,colors:['#13282d','#1c3840'],accent:'#65e8bc',background:'/assets/maps/previews/midgar-v2.png',enemies:['1010010','1050310','1060020','1010260','1060040','1040210','1050330','1050350','1050340','1050430'],elites:['1050310','1060020','1040210'],bosses:['4060810', '4060910'],superboss:'jenova',rate:1},
 {id:'zanarkand',tileset:'zanarkand-v2',musicFile:'zanarkand.mp3',name:'Zanarkand',subtitle:'Final Fantasy X · cité dévastée',description:'Rues désertes, bâtiments éventrés et passerelles effondrées au-dessus des eaux sombres.',duration:360,colors:['#17313f','#2c4f60'],accent:'#88dce8',background:'/assets/maps/previews/zanarkand-v2.png',enemies:['1050320','1030130','2010210','1120410','1030150','1010260','1100170','1040210','3010110','3010010'],elites:['2010210','1030130','1100170'],bosses:['3010110'],superboss:'jecht',rate:1.1},
 {id:'crystal-tower',tileset:'crystal-tower-v2',musicFile:'crystal-tower.mp3',name:'La Tour de Cristal',subtitle:'Final Fantasy III · palais de Xande',description:'Marbre azur, cristaux lumineux et gardiens de la tour.',duration:360,colors:['#273d59','#3c5171'],accent:'#a9ceff',background:'/assets/maps/previews/crystal-tower-v2.png',enemies:['1050110','1120010','2100310','1050020','1050130','2100110','4070430','3050010','4070420','4070410'],elites:['1050110','4070430','4070410'],bosses:['4050210'],superboss:'emperor',rate:1.2},
 {id:'dark-world',tileset:'dark-world-v2',musicFile:'dark-world.mp3',name:'Le Monde des Ténèbres',subtitle:'Final Fantasy III · au-delà des cristaux',description:'Plateformes suspendues, forteresses brisées et tempête rouge au cœur du néant.',duration:360,colors:['#21132e','#39223e'],accent:'#bd86ed',background:'/assets/maps/previews/dark-world-v2.png',enemies:['1080110','1040030','2100260','2120170','1030170','1050130','2100330','1040180','3010030','3040510'],elites:['1040030','1080110','3040510'],bosses:['3011010', '4070210'],superboss:'cloud-of-darkness',rate:1.35}
];
// Sequential zones keep their identity at every chosen difficulty.
export const zoneScaling={
 midgar:{hp:.8,damage:.85,speed:.95,density:.9,reward:1},
 zanarkand:{hp:1,damage:1,speed:1,density:1,reward:1.2},
 'crystal-tower':{hp:1.2,damage:1.15,speed:1.04,density:1.1,reward:1.45},
 'dark-world':{hp:1.45,damage:1.3,speed:1.08,density:1.2,reward:1.75}
};
export function stageUnlocked(save,id){
 const index=stages.findIndex(s=>s.id===id);if(index<0)return false;if(index===0)return true;
 // Existing victories remain meaningful, including old saves played out of order.
 const wins=s=>Number.isFinite(Number(save.stageWins?.[s.id]))&&Number(save.stageWins[s.id])>0;
 return wins(stages[index])||wins(stages[index-1]);
}
export function scaledDifficulty(stage,difficulty){
 const scaling=zoneScaling[stage.id]||zoneScaling.midgar;
 return {...difficulty,bossHp:(difficulty.bossHp??difficulty.hp)*scaling.hp,eliteDensity:(difficulty.eliteDensity??1),...Object.fromEntries(['hp','damage','speed','density','reward'].map(k=>[k,(difficulty[k]??1)*scaling[k]]))};
}
export const difficulties=[
 {id:'normal',eliteDensity:1,name:'Aventurier',hp:1,bossHp:1,speed:1,damage:1,reward:1,density:1},
 {id:'crystal',eliteDensity:1.15,name:'Chevalier du cristal',hp:1.35,bossHp:1.10,speed:1.04,damage:1.2,reward:1.35,density:1.1},
 {id:'light',eliteDensity:1.35,name:'Guerrier de la Lumière',hp:1.8,bossHp:1.20,speed:1.08,damage:1.45,reward:1.8,density:1.2},
 {id:'aeon',eliteDensity:1.6,name:'Élu des Éons',hp:2.4,bossHp:1.30,speed:1.12,damage:1.75,reward:2.4,density:1.3},
 {id:'primal',eliteDensity:1.9,name:'Pourfendeur de primordiaux',hp:3.2,bossHp:1.40,speed:1.16,damage:2.15,reward:3.2,density:1.4},
 {id:'transcendence',eliteDensity:2.2,name:'Transcendance',hp:4.3,bossHp:1.50,speed:1.2,damage:2.65,reward:4.3,density:1.55}
];
export function difficultyUnlocked(save,stageId,id){
 const index=difficulties.findIndex(d=>d.id===id);if(index<0)return false;if(index===0)return true;
 const wins=save.difficultyWins?.[stageId]||{};
 return Number(wins[id])>0||Number(wins[difficulties[index-1].id])>0||index===1&&!Object.values(wins).some(n=>Number(n)>0)&&Number(save.stageWins?.[stageId])>0;
}

export function turboUnlocked(save,stageId,difficultyId){
 const wins=save.difficultyWins?.[stageId]||{};
 return Number(wins[difficultyId])>0||difficultyId==='normal'&&!Object.values(wins).some(n=>Number(n)>0)&&Number(save.stageWins?.[stageId])>0;
}
export const upgrades=[{id:'damage',name:'Force du cristal',detail:'+25 % de dégâts',icon:'/assets/ui/boosts/damage.svg'},{id:'speed',name:'Bottes de célérité',detail:'+15 % de déplacement',icon:'/assets/ui/boosts/speed.svg'},{id:'range',name:'Œil de l’aigle',detail:'+20 % de portée',icon:'/assets/ui/boosts/range.svg'},{id:'heal',name:'Bénédiction',detail:'Restaure 40 PV, +20 PV maximum',icon:'/assets/ui/boosts/heal.svg'},{id:'rate',name:'Hâte',detail:'Attaques 15 % plus rapides',icon:'/assets/ui/boosts/rate.svg'}];
export function normalizeSave(raw){const s=raw&&typeof raw==='object'?raw:{};return {version:6,cosmetics:normalizeCosmetics(s.cosmetics),bossWins:normalizeBossWins(s.bossWins,s.difficultyWins,s.stageWins),permanentUpgrades:normalizePermanentUpgrades(s.permanentUpgrades),limitBreakLevel:s.limitBreakLevel===1?1:0,coins:Number.isFinite(s.coins)?Math.max(0,Math.floor(s.coins)):0,unlocked:[...new Set([...starters,...(Array.isArray(s.unlocked)?s.unlocked.filter(id=>heroes.some(h=>h.id===id&&!h.unavailable)):[])])],stats:{kills:Math.max(0,Number(s.stats?.kills)||0),runs:Math.max(0,Number(s.stats?.runs)||0),wins:Math.max(0,Number(s.stats?.wins)||0),bestLevel:Math.max(1,Number(s.stats?.bestLevel)||1)},bestiary:s.bestiary&&typeof s.bestiary==='object'?s.bestiary:{},options:{sound:s.options?.sound!==false,effects:s.options?.effects!==false,music:s.options?.music!==false,...normalizeAudioSettings(s.options)},stageWins:s.stageWins&&typeof s.stageWins==='object'?s.stageWins:{},difficultyWins:Object.fromEntries(stages.map(st=>[st.id,Object.fromEntries(difficulties.map(d=>[d.id,Math.max(0,Math.floor(Number(s.difficultyWins?.[st.id]?.[d.id])||0))]))]))};}
export function loadSave(storage){try{return normalizeSave(JSON.parse(storage.getItem('bes-save')));}catch{return normalizeSave(null);}}
export function available(save,hero){return !!hero&&!hero.unavailable&&(save.unlocked.includes(hero.id)||heroChallengeProgress(save,hero.id).done);}
export function claimHero(save,id){const h=heroes.find(h=>h.id===id);if(!h||!available(save,h)||save.unlocked.includes(id))return false;save.unlocked.push(id);return true;}
export function recordHeroBossVictory(save,run,bossId){
 const before=new Set(heroes.filter(h=>available(save,h)).map(h=>h.id));
 if(!creditBossVictory(save,run,bossId))return [];
 const earned=heroes.filter(h=>!before.has(h.id)&&available(save,h)).map(h=>h.id);
 run.earnedHeroAchievements??=[];run.earnedHeroAchievements.push(...earned);return earned;
}
export function applyUpgrade(s,id,potency=1){if(id==='damage')s.damage*=1.25;if(id==='speed')s.speed*=1.15;if(id==='range')s.range*=1.2;if(id==='heal'){s.maxHp+=Math.round(20*potency);s.hp=Math.min(s.maxHp,s.hp+Math.round(40*potency));}if(id==='rate')s.cooldown*=.85;}
export function reward(kills,time){return Math.floor(kills*2+time/5);}
export function recordMonster(save,id,name,killed=false){const old=save.bestiary[id]||{name,seen:0,kills:0};old.name=name;if(killed)old.kills++;else old.seen++;save.bestiary[id]=old;}
export function completeRun(save,run,won){save.coins+=Math.floor((reward(run.kills,run.time)+(won?100:0))*run.difficulty.reward*(run.gilsMultiplier||1)*equipmentEffects(run).gils);save.stats.kills+=run.kills;save.stats.runs++;save.stats.wins+=Number(won);save.stats.bestLevel=Math.max(save.stats.bestLevel,run.level);if(won){save.stageWins[run.stage.id]=(save.stageWins[run.stage.id]||0)+1;save.difficultyWins??={};const wins=save.difficultyWins[run.stage.id]??={};const id=difficulties.some(d=>d.id===run.difficulty.id)?run.difficulty.id:'normal';wins[id]=(wins[id]||0)+1;}}
export const powerups=Object.fromEntries([
 ['force','Bracelet de force','+15 % de dégâts pour toutes les armes.','damage', '#efb86b'],
 ['haste','Bague de célérité','Recharge des armes réduite de 8 %.','rate','#e4cb79'],
 ['reach','Longue portée','+12 % de portée et de taille des attaques.','range','#91ddbc'],
 ['multishot','Double coupe','Un projectile de plus ; +8 % de dégâts de mêlée.','multishot','#cab1ff'],
 ['pierce','Transpercer','Les projectiles traversent un ennemi supplémentaire.','pierce','#7dcdff'],
 ['frost','Materia Glace','Les touches ralentissent de 18 % pendant 1,5 s.','frost','#a6e9ff'],
 ['blast','Materia Feu','Chaque touche inflige 12 % de dégâts aux ennemis voisins.','blast','#ffab73'],
 ['leech','Lame sanguine','Chaque élimination restaure 1 PV.','leech','#e995b8'],
 ['vitality','Vitalité de Gaïa','+10 % de vie maximum.','health','#f3a6b8'],
 ['guard','Protect','Réduit les dégâts reçus de 3 %.','defense','#b3d9ff'],
 ['regen','Récup','Régénère 0,3 PV par seconde.','regen','#8fe0b1'],
 ['wisdom','Œuf de croissance','+8 % d’expérience des cristaux.','experience','#d8c1ff'],
 ['fortune','Bourse de mog','+8 % de gils gagnés.','gils','#ffdb7c'],
 ['luck','Trèfle du destin','Favorise les raretés élevées.','luck','#a2eaa1'],
 ['stride','Sandales d’Hermès','+5 % de vitesse de déplacement.','speed','#8bdbd6'],
 ['knockback','Materia Choc','+20 % de recul sur les monstres ordinaires. Boss et élites immunisés.','knockback','#e8c98b'],
 ['phoenix','Auto-Phénix','Vous relève une fois par expédition à 50 % de vie, avec 3 s de protection.','phoenix','#ffc590'],
 ['stasis','Stase de Shiva','Gèle les hordes pendant 3 s toutes les 30 s de jeu actif.','stasis','#b2ebff'],
 ['aegis','Égide d’Alexandre','Annule un coup reçu ; le bouclier se reforme après 25 s.','aegis','#fff2c0']
].map(([id,name,detail,effect,color])=>[id,{id,name,detail,effect,color,icon:'/assets/ui/powerups/'+id+'.svg',maxLevel:['phoenix','stasis','aegis'].includes(id)?1:5,legendaryOnly:['phoenix','stasis','aegis'].includes(id)}]));
export function equipmentEffects(s){const levels=Object.fromEntries((s.powerups||[]).map(p=>[p.id,p.potency??p.level]));return {damage:1+.15*(levels.force||0),melee:1+.08*(levels.multishot||0),cooldown:Math.max(.6,1-.08*(levels.haste||0))*((s.hasteTimer||0)>0?.65:1),range:1+.12*(levels.reach||0),extraProjectiles:(levels.multishot||0)+(s.bonusProjectiles||0),pierce:levels.pierce||0,slow:Math.min(.7,.18*(levels.frost||0)),splash:.12*(levels.blast||0),leech:levels.leech||0,health:1+.10*(levels.vitality||0),defense:.03*(levels.guard||0),regeneration:.3*(levels.regen||0),experience:1+.08*(levels.wisdom||0),gils:1+.08*(levels.fortune||0),luck:.08*(levels.luck||0),speed:1+.05*(levels.stride||0),knockback:1+(s.knockbackBonus||0)+.2*(levels.knockback||0)};}
// Only claimed hero rewards unlock weapons, even when a challenge has been completed.
export function ownedWeaponIds(ownedHeroes=starters){
 const owned=new Set([...starters,...(Array.isArray(ownedHeroes)?ownedHeroes:[])]);
 return heroes.filter(hero=>!hero.unavailable&&owned.has(hero.id)).map(hero=>hero.weaponId);
}
export function levelChoices(s,random=Math.random){
 const improvements=[],newWeapons=[],owned=new Set(ownedWeaponIds(s.ownedHeroes));
 for(const w of Object.values(weapons)){
  const equipped=s.weapons.find(x=>x.id===w.id);
  if(equipped){for(const branch of upgradeBranches(w,equipped))improvements.push({type:'weapon',id:w.id,upgrade:branch.id,name:w.name+' · '+branch.name,icon:w.icon,detail:`Arme niveau ${equipped.level+1} · ${branch.detail}`});}
  else if(s.weapons.length<6&&owned.has(w.id))newWeapons.push({type:'weapon',id:w.id,name:w.name,icon:w.icon,detail:'Nouvelle arme · '+w.description});
 }
 const shuffle=list=>{
  const result=list.filter(choice=>choiceAllowed(s,choice));
  for(let i=result.length-1;i>0;i--){const j=Math.min(i,Math.max(0,Math.floor(random()*(i+1))));[result[i],result[j]]=[result[j],result[i]];}
  return result;
 };
 const equipped=s.powerups||[],passives=Object.values(powerups).filter(p=>{const own=equipped.find(x=>x.id===p.id);return !p.legendaryOnly&&!(p.id==='luck'&&(s.luck||0)+equipmentEffects(s).luck>=1)&&!(p.id==='guard'&&(s.defense||0)+equipmentEffects(s).defense>=.5)&&(own?own.level<p.maxLevel&&!(p.id==='haste'&&(own.potency??own.level)>=5)&&!(p.id==='frost'&&(own.potency??own.level)>=.7/.18):equipped.length<6);});
 const passiveChoices=passives.map(p=>{const level=(equipped.find(x=>x.id===p.id)?.level||0)+1;return {...p,type:'powerup',detail:`${level===1?'Nouveau power-up':'Power-up niveau '+level} · ${p.detail}`};});
 // One shared pool: no fixed category, priority weapon or reserved passive slot.
 const choices=shuffle([...improvements,...newWeapons,...passiveChoices]).slice(0,5);
 if(!choices.length)choices.push({...upgrades.find(u=>u.id==='heal'),type:'stat'});
 const legendaryPool=shuffle(Object.values(powerups).filter(p=>p.legendaryOnly&&equipped.length<6&&!equipped.some(own=>own.id===p.id)).map(p=>({...p,type:'powerup'})));
 return choices.map(choice=>{
  let result=decorateChoice(choice,random,(s.luck||0)+equipmentEffects(s).luck);
  if(result.type==='powerup'&&result.rarity==='legendary'&&legendaryPool.length&&random()<.5){result={...legendaryPool.shift(),rarity:'legendary'};result.detail=rarityDetail(result);}
  return result;
 });
}
export function chooseUpgrade(s,choice){
 if(choice.type==='stat'){applyUpgrade(s,choice.id,rarityOf(choice).potency);return;}
 if(choice.type==='powerup'){
  const definition=powerups[choice.id];if(!definition||definition.legendaryOnly&&choice.rarity!=='legendary')return;s.powerups??=[];const before=equipmentEffects(s);
  const existing=s.powerups.find(p=>p.id===choice.id);
  if(existing){if(existing.level<definition.maxLevel){existing.potency=(existing.potency??existing.level)+upgradePotency(choice);existing.level++;}}
  else if(s.powerups.length<6){s.powerups.push({id:choice.id,level:1,potency:definition.legendaryOnly?1:upgradePotency(choice)});if(choice.id==='aegis'){s.aegisShield=true;s.aegisCooldown=0;}if(choice.id==='stasis')s.stasisCooldown=30;}
  const after=equipmentEffects(s);
  if(choice.id==='vitality'&&after.health!==before.health){const oldMax=s.maxHp;s.maxHp=Math.round(s.maxHp*after.health/before.health);s.hp=Math.min(s.maxHp,s.hp+s.maxHp-oldMax);}
  if(choice.id==='stride')s.speed*=after.speed/before.speed;
  return;
 }
 if(choice.type!=='weapon')return;
 const definition=weapons[choice.id];if(!definition)return;
 const existing=s.weapons.find(w=>w.id===choice.id);
 if(existing){
  const branch=definition.upgrades.find(b=>b.id===(choice.upgrade||'damage'));
  if(!branch||!upgradeBranches(definition,existing).some(b=>b.id===branch.id))return;
  existing.upgrades??={damage:Math.max(0,existing.level-1)};
  existing.upgradePower??={...existing.upgrades};existing.upgrades[branch.id]=(existing.upgrades[branch.id]||0)+1;existing.upgradePower[branch.id]=(existing.upgradePower[branch.id]||0)+upgradePotency(choice);existing.level++;
 }else if(s.weapons.length<6&&!choice.upgrade&&ownedWeaponIds(s.ownedHeroes).includes(choice.id))s.weapons.push({id:choice.id,level:1,upgrades:{},timer:0,qualityDamage:1+rarityOf(choice).initialDamage});
}

export function rerollLevelChoices(state,random=Math.random){
 if(!(state.rerollsRemaining>0))return false;
 const previous=state.choices||[];state.temporaryExcludedChoices=previous.map(choiceKey);
 let choices;try{choices=levelChoices(state,random);}finally{delete state.temporaryExcludedChoices;}
 if(choices.length===1&&choices[0].type==='stat'&&previous.some(choice=>choice.type!=='stat'))choices=levelChoices(state,random);
 if(!choices.some(c=>!previous.some(old=>choiceKey(old)===choiceKey(c))))return false;
 // Prefer entirely fresh offers; if the remaining pool is small, retain five legal
 // alternatives rather than replacing the whole menu with a single reward.
 if(choices.length<5)for(const choice of levelChoices(state,random)){
  if(choices.length===5)break;
  if(!choices.some(existing=>choiceKey(existing)===choiceKey(choice)))choices.push(choice);
 }
 state.rerollsRemaining--;state.choices=choices;return true;
}
export function banishLevelChoice(state,choice,random=Math.random){
 if(!(state.banishesRemaining>0)||choice.type==='stat'||!(state.choices||[]).includes(choice))return false;
 state.banishedChoices??=[];const key=choiceKey(choice);if(state.banishedChoices.includes(key))return false;
 state.banishedChoices.push(key);state.banishesRemaining--;state.choices=levelChoices(state,random);return true;
}

// Preview runs the same upgrade calculation on a detached loadout, never the live run.
export function choicePreview(state,choice){
 const next={...state,weapons:state.weapons.map(w=>({...w,upgrades:w.upgrades?{...w.upgrades}:undefined,upgradePower:w.upgradePower?{...w.upgradePower}:undefined})),powerups:(state.powerups||[]).map(p=>({...p}))};
 chooseUpgrade(next,choice);
 const before=equipmentEffects(state),after=equipmentEffects(next),number=n=>Number(n.toFixed(2)),percent=n=>number(n*100)+' %';
 const row=(label,a,b,unit='')=>({label,before:typeof a==='number'?number(a)+unit:a,after:typeof b==='number'?number(b)+unit:b});
 if(choice.type==='stat')return [row('Vie maximum',state.maxHp,next.maxHp,' PV'),row('Vie',state.hp,next.hp,' PV')];
 if(choice.type==='weapon'){
  const definition=weapons[choice.id],old=state.weapons.find(w=>w.id===choice.id),updated=next.weapons.find(w=>w.id===choice.id);if(!updated)return [];
  const a=old?weaponTuning(definition,old):null,b=weaponTuning(definition,updated),branch=choice.upgrade;
  if(!branch||branch==='damage')return [row('Puissance',a?percent(a.damage):'—',percent(b.damage))];
  if(branch==='area')return [row('Taille des attaques',percent(a.area),percent(b.area))];
  if(branch==='rate')return [row('Recharge',Math.max(.12,definition.cooldown*(state.cooldown??1)*before.cooldown*a.cooldown),Math.max(.12,definition.cooldown*(state.cooldown??1)*after.cooldown*b.cooldown),' s')];
  if(branch==='projectiles'){const base=definition.kind==='orbit'?2:1;return [row('Projectiles par attaque',base+a.projectiles+before.extraProjectiles,base+b.projectiles+after.extraProjectiles)];}
  if(branch==='zones')return [row(definition.kind==='thunder'?'Cibles en chaîne':'Zones par attaque',(definition.kind==='thunder'?3:1)+a.zones,(definition.kind==='thunder'?3:1)+b.zones)];
 }
 const id=choice.id,rows={
  force:()=>[row('Bonus de dégâts',percent(before.damage-1),percent(after.damage-1))],
  haste:()=>[row('Réduction de recharge',percent(1-before.cooldown),percent(1-after.cooldown))],
  reach:()=>[row('Bonus de portée',percent(before.range-1),percent(after.range-1))],
  multishot:()=>[row('Projectiles supplémentaires',before.extraProjectiles,after.extraProjectiles),row('Bonus de mêlée',percent(before.melee-1),percent(after.melee-1))],
  pierce:()=>[row('Ennemis transpercés en plus',before.pierce,after.pierce)],
  frost:()=>[row('Ralentissement',percent(before.slow),percent(after.slow))],
  blast:()=>[row('Dégâts aux voisins',percent(before.splash),percent(after.splash))],
  leech:()=>[row('Soin par élimination',before.leech,after.leech,' PV')],
  vitality:()=>[row('Vie maximum',state.maxHp,next.maxHp,' PV')],
  guard:()=>[row('Réduction des dégâts',percent(Math.min(.5,(state.defense||0)+before.defense)),percent(Math.min(.5,(next.defense||0)+after.defense)))],
  regen:()=>[row('Régénération',before.regeneration+(state.regeneration||0),after.regeneration+(next.regeneration||0),' PV/s')],
  wisdom:()=>[row('Bonus d’expérience',percent((state.experienceMultiplier||1)*before.experience-1),percent((next.experienceMultiplier||1)*after.experience-1))],
  fortune:()=>[row('Bonus de gils',percent((state.gilsMultiplier||1)*before.gils-1),percent((next.gilsMultiplier||1)*after.gils-1))],
  luck:()=>[row('Chance d’épique',percent(rarityProbabilities((state.luck||0)+before.luck)[3]),percent(rarityProbabilities((next.luck||0)+after.luck)[3])),row('Chance de légendaire',percent(rarityProbabilities((state.luck||0)+before.luck)[4]),percent(rarityProbabilities((next.luck||0)+after.luck)[4]))],
  stride:()=>[row('Vitesse de déplacement',state.speed,next.speed)]
  ,knockback:()=>[row('Distance de recul',26*before.knockback,26*after.knockback)]
 };
 return rows[id]?.()||[];
}
