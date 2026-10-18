import {WeaponAudio} from './weapon-audio.js';
import {recordBossDamage} from './boss-rating.js';
import {BossRatingReveal,bossRatingSummary} from './boss-rating-view.js';
import {drawHeroBars} from './hero-bars.js';
import {hitStats} from './hit-stats.js';
import {applyDeveloperCode} from './developer-code.js';
import {effectiveVolume} from './audio-settings.js';
import {bossSegmentRatios} from './boss-difficulty.js';
import {GachaView} from './gacha-view.js';
import {equippedSkin,heroSkins,equipSkin,gachaUnlocked} from './gacha.js';
import {HeroUnlockReveal} from './hero-unlock-reveal.js';
import {heroChallengeProgress} from './hero-achievements.js';
import {loadSlots,normalizeSlots,writeSlot} from './save-slots.js';
import {tickLegendaryEffects,tryAutoPhoenix,drawLegendaryAura} from './legendary-effects.js';
import {permanentUpgrades,permanentUpgradeCost,purchasePermanentUpgrade,permanentHeroStats,applyPermanentUpgrades,permanentBonuses,mitigatedDamage,tickRegeneration} from './permanent-upgrades.js';
import {rarityOf,rarities,rarityProbabilities,rarityDetail} from './rarity.js';
import {heroes,weapons,stages,difficulties,stageUnlocked,difficultyUnlocked,turboUnlocked,scaledDifficulty,normalizeSave,available,claimHero,recordHeroBossVictory,completeRun,recordMonster,levelChoices,chooseUpgrade,choicePreview,rerollLevelChoices,banishLevelChoice,powerups,equipmentEffects} from './model.js';
import {AnimationPlayer,SpriteCache,clipFor,actionSequence,clipDuration,labelFor} from './animation.js';
import {nearestEnemy,fireWeapon,tickWeapons,tickProjectiles,drawCombat,tickDamageNumbers,drawDamageNumbers,drawHitAura,tickMultiHits} from './combat.js';
import {loadCrystalEncounter,tickLimitBreak,castLimitBreak,drawCrystalEncounter} from './crystal-encounter.js';
import {PLAYER_RADIUS,playerRadius,movePlayer,separatePlayerBosses,drawHitboxes} from './hitboxes.js';
import {spawnInterval,PORTAL_DURATION,monsterSize,nearbySpawnPoint,addSpawnPortal,tickSpawnPortals,drawSpawnPortals,emergenceScale,roamingEliteDue} from './spawning.js';
import {drawEliteHealth} from './enemy-health.js';
import {loadEncounterRoster,beginScheduledEncounter,tickBossEncounters,drawBossEncounters,encounterInstruction} from './boss-encounters.js';
import {meteorCountdown,drawMeteorCountdown} from './xande-meteors.js';
import {MapArt} from './maps.js';
import {monsters,zoneEnemies} from './bestiary.js';
import {screenAim,startDash,tickDash,spriteFlip,toggleTargeting} from './controls.js';
import {drawExperienceCrystals} from './experience-art.js';
import {createExploration,tickExploration,drawExploration} from './exploration.js';
import {killGilAmount,addGilFeedback,tickGilFeedback,drawGilFeedback} from './gil-feedback.js';
import {rollRareMog,rareMogHealth,rareMogReward,tickRareMog,drawRareMog} from './rare-mog.js';
import {advanceSimulation} from './simulation-clock.js';
import {tickKnockback} from './knockback.js';
import {tickEnemyAttacks,drawEnemyAttacks} from './enemy-attacks.js';
import {Terrain,moveEntity} from './terrain.js';
import {enemyRadius,separateEnemies} from './enemy-collisions.js';
import {PickupArt,dropLoot,consume,tickPickups} from './pickups.js';
import {weaponInterval,attackDuration,advanceAttackAnimation} from './attack-timing.js';
import {loadSuperboss,superbossHealth,superbossSpawnPoint} from './bosses.js';
import {BattleMusic,SoundEffects} from './music.js';
const pickupArt=new PickupArt(),mapArt=new MapArt(),music=new BattleMusic(),sfx=new SoundEffects(),aimPoint={active:false,x:0,y:0};
sfx.prepare();
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d'),keys=new Set();
function itemIcon(src){const img=document.createElement('img');img.className='item-icon';img.src=src;img.alt='';img.setAttribute('aria-hidden','true');img.width=64;img.height=64;return img;}
const playtest=new URLSearchParams(location.search).get('playtest')==='1',testMode=playtest||new URLSearchParams(location.search).has('test');
const cache=new SpriteCache(),manifests=new Map(),variantsChosen=new Map(),cards=[];
const catalog=await fetch('assets/animation-catalog.json').then(r=>{if(!r.ok)throw Error('Bibliothèque indisponible');return r.json();});
const summaries=new Map(catalog.map(e=>[e.id,e]));for(const h of heroes)h.manifest=summaries.get(h.id)?.manifest;
let permanentPurchasePending=false;
let slotStore=loadSlots(localStorage),activeSlot=null,slotBusy=false;
try{const r=await fetch('/api/saves');if(r.ok){const disk=await r.json();if(disk)slotStore=normalizeSlots(disk);}}catch{}
let save=normalizeSave(slotStore.slots[slotStore.activeSlot]?.save);
// Start the uploaded title theme before sprite loading or effect decoding completes.
music.playMenu(save.options);
let forcedTestStage=null,turbo=false;
const bossRatingReveal=new BossRatingReveal(()=>{if(state&&!state.over)state.paused=false;});
let selected=heroes[0],selectedVariant=null,state=null,last=performance.now(),page=0,query='',gallery=null,selectionVersion=0,screen='titleScreen',stage=stages[0],difficulty=difficulties[0],enemyPool=[],enemyCatalog=[],poolLoading=null,saveTimer=0,saveFailure=false;
let saveQueue=Promise.resolve();
function cacheSlots(){try{localStorage.setItem('bes-save-slots',JSON.stringify(slotStore));}catch{}}
async function persist(){
 if(playtest||activeSlot===null)return;
 const slot=activeSlot,data=structuredClone(save);slotStore=writeSlot(slotStore,slot,data);cacheSlots();
 const initial=structuredClone(slotStore);
 saveQueue=saveQueue.catch(()=>{}).then(async()=>{try{const r=await fetch('/api/saves',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slot,data,initial})});if(!r.ok)throw Error('Save failed');saveFailure=false;}catch{saveFailure=true;}});
 await saveQueue;$('coins').textContent=save.coins;
}
async function skinVariant(skin){const entity=await manifest(skin.entityId),variant=entity.variants.find(v=>v.id===skin.variantId);if(!variant)throw Error('Apparence indisponible');return variant;}
async function heroAppearance(hero){const skin=equippedSkin(save,hero.id);return skin?skinVariant(skin):defaultVariant(await manifest(hero.id));}
const gachaView=new GachaView({root:$('gachaScreen'),getSave:()=>save,persist,heroes,loadVariant:skinVariant,loadEntity:manifest,cache,dialog:$('gachaSummonModal'),helpDialog:$('gachaHelpModal')});
$('gachaNav').onclick=()=>{route('gachaScreen');if(screen==='gachaScreen')gachaView.render();};
$('skinSelect').onchange=async()=>{if(equipSkin(save,selected.id,$('skinSelect').value)){const saving=persist();await selectHero(selected);renderRoster();await saving;}};
let revealPause=null;
const heroReveal=new HeroUnlockReveal({dialog:$('heroUnlockModal'),cache,loadEntity:manifest,onDone:()=>{
 const previous=revealPause;revealPause=null;
 if(previous?.run===state&&state&&screen==='arena')state.paused=previous.wasPaused||$('modal').open;
}});
function revealHeroes(ids){
 if(!heroReveal.active){revealPause={run:state,wasPaused:Boolean(state?.paused)};if(state&&screen==='arena')state.paused=true;}
 keys.clear();heroReveal.enqueue(ids.map(id=>heroes.find(h=>h.id===id)));
}
function show(html,buttons=[]){$('modal').classList.remove('levelup-modal');$('modalBody').innerHTML=html;for(const b of buttons){const button=document.createElement('button');button.textContent=b.text;button.onclick=b.action;$('modalBody').append(button);}if(!$('modal').open)$('modal').showModal();}
function close(){gallery=null;$('modal').close();}
$('modal').addEventListener('cancel',e=>e.preventDefault());
function reportError(error){console.error(error);show('<h2>Chargement interrompu</h2><p>Une ressource du personnage ne peut pas être chargée. Relancez l’installateur pour vérifier la bibliothèque.</p>',[{text:'Retour au menu',action:()=>{state=null;route('menuScreen');}}]);}
function route(id){if(id==='gachaScreen'&&!gachaUnlocked(save))id='menuScreen';document.body.classList.remove('permanent-shop');close();if(id==='arena')music.stop();else music.playMenu(save.options);screen=id;document.body.dataset.screen=id;keys.clear();for(const s of document.querySelectorAll('.screen'))s.hidden=s.id!==id;$('arena').hidden=id!=='arena';$('menuDock').hidden=['titleScreen','saveScreen','arena'].includes(id);$('back').hidden=['menuScreen','arena'].includes(id);$('coins').textContent=save.coins;if(id==='menuScreen'){const open=gachaUnlocked(save);$('gachaNav').disabled=!open;$('gachaNav').textContent=open?'✦ GACHA':'🔒 ?????';}if(id==='arena')resize();window.scrollTo(0,0);}
function characters(){if(!owned(selected))selected=heroes.find(owned);page=0;query='';$('heroSearch').value='';route('characterScreen');renderRoster();selectHero(selected).catch(reportError);}
$('enter').onclick=()=>{initAudio();renderSaveSlots();};$('begin').onclick=()=>characters();$('back').onclick=()=>{if(screen==='stageScreen')characters();else route('menuScreen');};

function renderSaveSlots(message=''){
 route('saveScreen');$('saveSlots').replaceChildren();$('slotFeedback').textContent=message;
 for(let i=0;i<3;i++){
  const entry=slotStore.slots[i],card=document.createElement('article');card.className='panel save-card';card.dataset.slot=i;
  const heading=document.createElement('h3');heading.textContent='Sauvegarde '+(i+1);
  const art=itemIcon('/assets/ui/pickups/level.svg');art.classList.add('save-crystal');
  const info=document.createElement('p');
  if(entry){const data=entry.save;info.textContent=`${data.unlocked.length} héros · ${data.coins.toLocaleString('fr-FR')} gils`;const stats=document.createElement('small');stats.textContent=`${data.stats.runs} expéditions · ${data.stats.wins} victoires`;info.append(document.createElement('br'),stats);}
  else info.textContent='Emplacement libre';
  const play=document.createElement('button');play.dataset.saveSlot=i;play.className='primary';play.textContent=entry?'CONTINUER':'NOUVELLE PARTIE';play.disabled=slotBusy;
  play.onclick=async()=>{
   if(slotBusy)return;slotBusy=true;renderSaveSlots();
   await saveQueue;activeSlot=i;save=normalizeSave(slotStore.slots[i]?.save);slotStore.activeSlot=i;
   selected=heroes[0];variantsChosen.clear();state=null;stage=stages[0];difficulty=difficulties[0];turbo=false;forcedTestStage=null;
   await persist();music.configure(save.options);sfx.configure(save.options);slotBusy=false;route('menuScreen');
  };
  card.append(heading,art,info,play);
  if(entry){
   const remove=document.createElement('button');remove.className='delete-save';remove.dataset.deleteSlot=i;remove.textContent='SUPPRIMER';remove.disabled=slotBusy||playtest;
   remove.onclick=()=>{if(playtest)return;show(`<h2>Supprimer la sauvegarde ${i+1} ?</h2><p>Tous les héros, gils et améliorations de cet emplacement seront effacés. Les autres sauvegardes seront conservées.</p>`,[
    {text:'Annuler',action:close},
    {text:'Supprimer définitivement',action:async()=>{
     if(slotBusy)return;slotBusy=true;close();renderSaveSlots('Suppression en cours…');await saveQueue;
     try{
      const r=await fetch('/api/saves',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({slot:i,initial:slotStore})});if(!r.ok)throw Error('Delete failed');
      slotStore=writeSlot(slotStore,i,null);if(activeSlot===i){activeSlot=null;save=normalizeSave(null);}cacheSlots();slotBusy=false;renderSaveSlots('Emplacement '+(i+1)+' libéré.');
     }catch{slotBusy=false;renderSaveSlots('Suppression impossible. La sauvegarde est conservée ; réessayez.');}
    }}]);};
   card.append(remove);
  }
  $('saveSlots').append(card);
 }
}

function permanentSummary(upgrade,level){
 const labels={vitality:['health','PV'],might:['damage','dégâts'],haste:['cooldown','recharge'],stride:['speed','vitesse'],reach:['range','portée'],wisdom:['experience','XP'],magnet:['magnet','attraction'],guard:['defense','protection'],regen:['regen','PV/s'],fortune:['gils','gils'],quantity:['projectiles','projectile'],rerolls:['rerolls','relance'],banishes:['banishes','exclusion'],luck:['luck','chance'],knockback:['knockback','recul'],critRate:['critRate','critique'],critDamage:['critDamage','dégâts crit.'],multiHit:['multiHit','multi-hit']};
 if(level>=upgrade.maxLevel)return 'Bonus maximal';
 const [key,label]=labels[upgrade.id],before=permanentBonuses(save)[key],after=permanentBonuses({...save,permanentUpgrades:{...save.permanentUpgrades,[upgrade.id]:level+1}})[key];
 const percent=!['regen','projectiles','rerolls','banishes'].includes(key),gain=(after-before)*(percent?100:1);
 return (gain<0?'−':'+')+Math.abs(gain).toLocaleString('fr-FR',{maximumFractionDigits:2})+(percent?' % ':' ')+label;
}
function renderPermanentShop(focusId){
 route('collectionScreen');document.body.classList.add('permanent-shop');$('collectionTitle').textContent='Boutique d’améliorations';
 $('collectionContent').innerHTML='<p>Améliorations permanentes pour tous vos héros, dès la prochaine expédition. Aucun emplacement d’arme ou de power-up utilisé.</p><p id="permanentFeedback" class="hint" role="status" aria-live="polite"></p><div id="permanentGrid" class="permanent-grid"></div>';
 const odds=document.createElement('p');odds.className='hint';odds.textContent='Raretés actuelles : '+rarityProbabilities(permanentBonuses(save).luck).map((p,i)=>rarities[i].name+' '+Number((p*100).toFixed(2))+' %').join(' · ');$('collectionContent').insertBefore(odds,$('permanentGrid'));
 for(const upgrade of permanentUpgrades){
  const level=save.permanentUpgrades[upgrade.id],cost=permanentUpgradeCost(save,upgrade.id),card=document.createElement('article');
  card.className='panel permanent-card';card.dataset.permanent=upgrade.id;
  const icon=itemIcon(upgrade.icon),name=document.createElement('h3'),detail=document.createElement('p'),ranks=document.createElement('p'),button=document.createElement('button');
  name.textContent=upgrade.name;detail.textContent=permanentSummary(upgrade,level);detail.title=upgrade.detail;ranks.className='permanent-ranks';ranks.textContent='RANG '+level+' / '+upgrade.maxLevel;ranks.style.setProperty('--rank-progress',100*level/upgrade.maxLevel+'%');
  button.dataset.permanentBuy=upgrade.id;button.disabled=cost===null||save.coins<cost||playtest||permanentPurchasePending;
  button.textContent=cost===null?'RANG MAXIMUM':playtest?'INDISPONIBLE EN MODE DÉVELOPPEUR':`AMÉLIORER · ${cost} GILS`;
  if(cost!==null&&save.coins<cost)button.title='Gils insuffisants';
  button.onclick=async()=>{
   if(permanentPurchasePending||!purchasePermanentUpgrade(save,upgrade.id))return;
   permanentPurchasePending=true;button.disabled=true;sfx.play('menu-click',save.options);const saving=persist();renderPermanentShop(upgrade.id);
   $('permanentFeedback').textContent=upgrade.name+' · rang '+save.permanentUpgrades[upgrade.id]+' acquis pour tous les héros.';
   await saving;permanentPurchasePending=false;if(screen==='collectionScreen'&&$('permanentGrid')){renderPermanentShop(upgrade.id);$('permanentFeedback').textContent=upgrade.name+' · rang '+save.permanentUpgrades[upgrade.id]+' acquis pour tous les héros.'+(saveFailure?' Copie locale conservée ; écriture du fichier de progression indisponible.':'');}
  };
  const benefit=document.createElement('div');benefit.className='permanent-benefit';benefit.append(icon,detail);card.append(name,benefit,ranks,button);$('permanentGrid').append(card);
 }
 if(focusId)document.querySelector(`[data-permanent-buy="${focusId}"]`)?.focus();
}
$('permanentNav').onclick=()=>renderPermanentShop();
$('savesNav').onclick=async()=>{await persist();state=null;renderSaveSlots();};
$('saveBack').onclick=()=>route('titleScreen');
$('quit').onclick=()=>{if(window.chrome?.webview){window.chrome.webview.postMessage('quit');return;}state=null;route('titleScreen');};
async function manifest(id){if(!manifests.has(id)){const summary=summaries.get(id);if(!summary)throw Error('Ressources manquantes : '+id);manifests.set(id,fetch(summary.manifest).then(r=>{if(!r.ok)throw Error('Animations indisponibles : '+summary.name);return r.json();}));}return manifests.get(id);}
function defaultVariant(entity){return entity.variants.find(v=>v.id===variantsChosen.get(entity.id))||entity.variants.find(v=>v.playable)||entity.variants.find(v=>clipFor(v,'idle'))||entity.variants[0];}
function scaleFor(variant,height=52){const idle=clipFor(variant,'idle')||clipFor(variant,'standby');const frame=idle?.frames[0];return frame?height/Math.max(10,frame[5]):1;}
function owned(h){return playtest&&!h.unavailable||save.unlocked.includes(h.id);}
function renderRoster(){cards.length=0;$('coins').textContent=save.coins;$('heroCount').textContent=`${save.unlocked.length} / ${heroes.filter(h=>!h.unavailable).length} HÉROS RECRUTÉS`;$('selectionTitle').textContent='Sélection du personnage';$('confirmHero').hidden=false;$('roster').replaceChildren();const filtered=heroes.filter(h=>owned(h)&&(h.name+' '+h.title).toLowerCase().includes(query));page=Math.min(page,Math.max(0,Math.ceil(filtered.length/12)-1));$('pageLabel').textContent=`${page+1} / ${Math.max(1,Math.ceil(filtered.length/12))}`;$('prevPage').disabled=page===0;$('nextPage').disabled=(page+1)*12>=filtered.length;
for(const h of filtered.slice(page*12,page*12+12)){const button=document.createElement('button');button.className='card'+(selected.id===h.id?' selected':'')+(!owned(h)?' locked':'');button.dataset.hero=h.id;const tag=document.createElement('span');tag.className='tag';tag.textContent='DÉBLOQUÉ';const art=document.createElement('canvas');art.width=110;art.height=104;const name=document.createElement('strong');name.textContent=h.name;const title=document.createElement('small');title.textContent=h.title;button.append(tag,art,name,title);$('roster').append(button);const card={hero:h,canvas:art,variant:null};cards.push(card);if(!h.unavailable)heroAppearance(h).then(v=>{card.variant=v;return cache.loadClip(clipFor(card.variant,'idle')||clipFor(card.variant,'standby'));}).catch(reportError);button.onclick=()=>selectHero(h).then(renderRoster).catch(reportError);}}
async function selectHero(hero,variantId){if(!hero)return;selected=hero;if(variantId)variantsChosen.set(hero.id,variantId);const version=++selectionVersion;selectedVariant=null;$('confirmHero').disabled=true;$('selectedName').textContent=hero.name;$('selectedSeries').textContent=hero.title;$('startingWeapon').replaceChildren(itemIcon(weapons[hero.weaponId].icon),document.createTextNode(hero.weapon));const boosted=permanentHeroStats(hero,save);$('heroStats').innerHTML=`<dt>♥ Santé max</dt><dd>${boosted.hp}</dd><dt>➶ Déplacement</dt><dd>${Math.round(boosted.speed)}</dd><dt>⚔ Puissance</dt><dd>${Math.round(boosted.damage*10)/10}</dd><dt>✧ Portée</dt><dd>${Math.round(boosted.range)}</dd><dt>⌛ Recharge</dt><dd>${Number((weapons[hero.weaponId].cooldown*boosted.cooldown).toFixed(2))}s</dd><dt>Armes max</dt><dd>6</dd>`;
$('unlockInfo').textContent=owned(hero)?'Héros débloqué · prêt pour l’expédition.':'Débloquez ce héros dans les Succès.';
if(hero.unavailable){$('selectedPortrait').getContext('2d').clearRect(0,0,250,190);return;}const entity=await manifest(hero.id),appearance=variantId?entity.variants.find(v=>v.id===variantId)||defaultVariant(entity):await heroAppearance(hero);if(version!==selectionVersion)return;selectedVariant=appearance;$('skinSelect').replaceChildren();for(const skin of heroSkins(save,hero.id,playtest)){const option=document.createElement('option');option.value=skin.id;option.textContent=skin.name;$('skinSelect').append(option);}$('skinSelect').value=equippedSkin(save,hero.id).id;$('skinInfo').textContent='';$('confirmHero').disabled=!owned(hero);await cache.loadClip(clipFor(selectedVariant,'idle'));}
$('heroSearch').oninput=e=>{query=e.target.value.toLowerCase();page=0;renderRoster();};$('prevPage').onclick=()=>{page--;renderRoster();};$('nextPage').onclick=()=>{page++;renderRoster();};
$('confirmHero').onclick=()=>{if(!owned(selected)||!selectedVariant)return;route('stageScreen');renderStages();};
function renderStages(){
 if(!playtest&&!stageUnlocked(save,stage.id))stage=stages.find(st=>stageUnlocked(save,st.id));
 if(!playtest&&!difficultyUnlocked(save,stage.id,difficulty.id))difficulty=difficulties[0];
 if(!playtest&&!turboUnlocked(save,stage.id,difficulty.id))turbo=false;
 $('stageList').replaceChildren();
 for(const st of stages){
  const unlocked=playtest||stageUnlocked(save,st.id),b=document.createElement('button');
  b.className='stage-card'+(st.id===stage.id?' selected':'')+(!unlocked?' locked':'');b.dataset.stage=st.id;b.disabled=!unlocked;
  b.setAttribute('aria-label',unlocked?st.name:'????? · Verrouillé');
  b.innerHTML=`<div class="stage-art">${unlocked?`<img src="${st.background}" alt="" loading="lazy">`:'<span class="stage-mystery" aria-hidden="true">?</span>'}</div><div><strong>${unlocked?st.name:'?????'}</strong></div>`;
  b.onclick=()=>{if(!playtest&&!stageUnlocked(save,st.id))return;stage=st;forcedTestStage=null;renderStages();};$('stageList').append(b);
 }
 $('difficultyList').replaceChildren();
 for(const d of difficulties){
  const b=document.createElement('button'),unlocked=playtest||difficultyUnlocked(save,stage.id,d.id);
  b.className='difficulty'+(d.id===difficulty.id?' selected':'');b.dataset.difficulty=d.id;b.disabled=!unlocked;b.textContent=unlocked?d.name:'?????';
  b.title=unlocked?'':'Verrouillé';b.onclick=()=>{if(!playtest&&!difficultyUnlocked(save,stage.id,d.id))return;difficulty=d;renderStages();};$('difficultyList').append(b);
 }
 const turboButton=document.createElement('button');turboButton.id='turboMode';turboButton.className='difficulty'+(turbo?' selected':'');turboButton.disabled=!playtest&&!turboUnlocked(save,stage.id,difficulty.id);
 turboButton.textContent=turboButton.disabled?'?????':'TURBO ×1,5'+(turbo?' · ACTIF':' · INACTIF');
 turboButton.title=turboButton.disabled?'Verrouillé':'Les boss restent à vitesse normale.';turboButton.setAttribute('aria-pressed',String(turbo));
 turboButton.onclick=()=>{if(!playtest&&!turboUnlocked(save,stage.id,difficulty.id))return;turbo=!turbo;renderStages();};$('difficultyList').append(turboButton);
 const effective=scaledDifficulty(stage,difficulty);$('difficultyInfo').textContent=`PV des ennemis ×${Number(effective.hp.toFixed(2))} · dégâts ×${Number(effective.damage.toFixed(2))} · récompenses ×${Number(effective.reward.toFixed(2))}`;
}
let heroClaimPending=false;
function renderAchievements(){
 route('collectionScreen');$('collectionTitle').textContent='Succès · les légendes s’éveillent';
 $('collectionContent').innerHTML='<p>Terrassez les boss à la difficulté indiquée ou supérieure pour débloquer vos héros. Aucun gil à dépenser. Les victoires restent acquises même si l’expédition se termine ensuite par une défaite.</p><p id="heroClaimFeedback" role="status" aria-live="polite"></p><div id="achievementGrid" class="collection-grid"></div>';
 for(const h of heroes.filter(h=>!['cloud','wol','lightning'].includes(h.id))){
  const progress=heroChallengeProgress(save,h.id),claimed=save.unlocked.includes(h.id),card=document.createElement('article');card.className='panel collection-card hero-achievement';card.dataset.achievement=h.id;
  const reward=document.createElement('div');reward.className='achievement-reward';const title=document.createElement('div'),name=document.createElement('h3'),series=document.createElement('small');name.textContent=h.name;series.textContent=h.title;title.append(name,series);reward.append(itemIcon(weapons[h.weaponId].icon),title);
  const weapon=document.createElement('p');weapon.className='hint';weapon.textContent='Arme du héros : '+h.weapon;
  const goals=document.createElement('ul');goals.className='achievement-goals';
  for(const goal of progress.conditions){const line=document.createElement('li'),text=document.createElement('span'),count=document.createElement('b');line.classList.toggle('complete',goal.done);text.textContent=`${goal.name} · ${stages.find(s=>s.id===goal.stage).name} · ${difficulties.find(d=>d.id===goal.difficulty).name}`;count.textContent=goal.wins+' / '+goal.count;line.append(text,count);goals.append(line);}
  const bar=document.createElement('div');bar.className='progress-track';const fill=document.createElement('span');fill.style.width=(claimed?100:100*progress.current/progress.total)+'%';bar.append(fill);
  const button=document.createElement('button');button.dataset.claimHero=h.id;button.disabled=claimed||!progress.done||heroClaimPending||playtest;button.textContent=claimed?'✦ HÉROS DÉBLOQUÉ':progress.done?'DÉBLOQUER LE HÉROS':'DÉFI EN COURS';
  button.onclick=async()=>{
   if(playtest||heroClaimPending||!claimHero(save,h.id))return;heroClaimPending=true;button.disabled=true;const slot=activeSlot;sfx.play('menu-click',save.options);const saving=persist();revealHeroes([h.id]);await saving;heroClaimPending=false;
   if(screen==='collectionScreen'&&$('achievementGrid')&&activeSlot===slot){renderAchievements();$('heroClaimFeedback').textContent=h.name+' rejoint vos héros !'+(saveFailure?' Copie locale conservée ; écriture du fichier indisponible.':'');}
  };
  card.append(reward,weapon,goals,bar,button);$('achievementGrid').append(card);
 }
}
$('achievementsNav').onclick=renderAchievements;
$('bestiaryNav').onclick=async()=>{route('collectionScreen');$('collectionTitle').textContent='Bestiaire · vos rencontres';$('collectionContent').replaceChildren();const entries=Object.entries(save.bestiary);if(!entries.length){$('collectionContent').innerHTML='<div class="panel"><h3>Aucune rencontre pour le moment</h3><p>Partez en expédition : les monstres rencontrés et vaincus seront recensés ici.</p></div>';return;}const grid=document.createElement('div');grid.className='collection-grid';$('collectionContent').append(grid);for(const [id,b] of entries){const card=document.createElement('article');card.className='panel collection-card';const name=document.createElement('h3');name.textContent=monsters[id]?.name||b.name;const p=document.createElement('p');p.textContent=`${b.seen} rencontrés · ${b.kills} vaincus`;card.append(name,p);grid.append(card);const match=enemyCatalog.find(e=>e.variant.unitId===id);const icon=match?.variant.icon?.[0];if(icon){const img=document.createElement('img');img.src='/resources/'+icon;img.alt=b.name;card.prepend(img);}}};
function openOptions(){
 const sliders=[['masterVolume','Volume général'],['musicVolume','Musique'],['soundVolume','Menus et notifications'],['combatVolume','Combats']];
 const fields=sliders.map(([id,label])=>`<label class="option-row"><span>${label} <output id="${id}Value"></output></span><input id="${id}" type="range" min="0" max="100" step="1" aria-label="${label}"></label>`).join('');
 show('<h2>Options</h2>'+fields+'<label class="option-row"><span>Effets des armes du joueur <output id="playerEffectsValue"></output></span><input id="playerEffects" type="range" min="1" max="100" step="1" aria-label="Effets des armes du joueur"></label><label class="option-row">Musique<input id="musicOption" type="checkbox"></label><label class="option-row">Effets sonores<input id="soundOption" type="checkbox"></label><label class="option-row">Particules supplémentaires<input id="effectsOption" type="checkbox"></label><details><summary>Commandes</summary><p>ZQSD / WASD / flèches : déplacement<br>Curseur : viser · attaques automatiques<br>Clic gauche : visée manuelle / automatique<br>Clic droit : dash · R : limite débloquée<br>P / Échap : pause · Molette : zoom</p></details><details class="bonus-code"><summary>Code bonus</summary><p>Appliqué uniquement à la sauvegarde active. Revenez au menu avant utilisation.</p><label>Code <input id="devCode" type="text" maxlength="32" autocomplete="off" spellcheck="false"></label><button id="applyDevCode"></button><p id="devCodeStatus" role="status"></p></details><p id="musicTrack"></p><p id="saveStatus"></p>',[
  {text:'Plein écran',action:()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(()=>{});}},
  {text:'Enregistrer et revenir',action:async()=>{preview();await persist();if(saveFailure)$('saveStatus').textContent='Sauvegarde locale conservée. Le fichier de progression n’a pas pu être écrit.';else{close();if(state&&screen==='arena')state.paused=false;}}}
 ]);
 $('playerEffects').value=Math.round((save.options.playerEffects??1)*100);
 $('musicTrack').textContent=music.error||('Musique : '+(music.track?.title||'aucune'));
 $('soundOption').checked=save.options.sound;$('effectsOption').checked=save.options.effects;$('musicOption').checked=save.options.music;
 for(const [id]of sliders)$(id).value=(save.options[id]??(id==='musicVolume'?.4:1))*100;
 function preview(){
  for(const [id]of sliders){save.options[id]=Number($(id).value)/100;$(id+'Value').textContent=$(id).value+' %';}
  save.options.playerEffects=Number($('playerEffects').value)/100;$('playerEffectsValue').textContent=$('playerEffects').value+' %';
  save.options.sound=$('soundOption').checked;save.options.music=$('musicOption').checked;save.options.effects=$('effectsOption').checked;music.configure(save.options);sfx.configure(save.options);
 }
 $('playerEffects').oninput=preview;for(const [id]of sliders)$(id).oninput=preview;for(const id of ['soundOption','musicOption','effectsOption'])$(id).onchange=preview;preview();
 const slot=activeSlot;$('applyDevCode').textContent=slot===null?'CHOISISSEZ UNE SAUVEGARDE':'APPLIQUER À LA SAUVEGARDE '+(slot+1);$('applyDevCode').disabled=slot===null||playtest||screen==='arena';
 $('applyDevCode').onclick=async()=>{
  if(slot===null||activeSlot!==slot||playtest||screen==='arena')return;
  if(!applyDeveloperCode(save,$('devCode').value)){$('devCodeStatus').textContent='Code non reconnu.';return;}
  $('applyDevCode').disabled=true;await persist();$('coins').textContent=save.coins;
  $('gachaNav').disabled=!gachaUnlocked(save);$('gachaNav').textContent=gachaUnlocked(save)?'✦ GACHA':'🔒 ?????';
  $('devCode').value='';$('devCodeStatus').textContent='Tout est débloqué sur la sauvegarde '+(slot+1)+' · 1 000 000 de gils minimum.';
 };
}

$('optionsNav').onclick=openOptions;
document.addEventListener('pointerover',event=>{
 if(event.pointerType==='touch')return;
 const target=event.target.closest?.('button,a[href],summary,select,input,.permanent-card,.save-card');
 if(!target||target.contains(event.relatedTarget)||target.matches(':disabled,[aria-disabled="true"]')||target.closest('[hidden],[inert]')||screen==='arena'&&!target.closest('dialog'))return;
 sfx.hover(save.options);
});
document.addEventListener('click',event=>{const button=event.target.closest?.('#menuScreen button');if(screen==='menuScreen'&&button&&!button.disabled)sfx.play('menu-click',save.options);},true);
const weaponAudio=new WeaponAudio();
let audio=null;function initAudio(){try{audio??=sfx.context||new (window.AudioContext||window.webkitAudioContext)({latencyHint:'interactive'});audio.resume();sfx.unlock();weaponAudio.prepare(audio,weapons);}catch{}}

function resize(){canvas.width=canvas.clientWidth;canvas.height=canvas.clientHeight;}
canvas.addEventListener('wheel',event=>{if(!state||screen!=='arena'||$('modal').open||heroReveal.active||bossRatingReveal.active)return;event.preventDefault();const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?canvas.height:1);state.zoom=Math.max(.5,Math.min(2.5,state.zoom*Math.exp(-delta*.0015)));updateHud();},{passive:false});window.addEventListener('resize',resize);
async function refreshEnemyPool(wave=0){if(poolLoading)return poolLoading;poolLoading=(async()=>{if(!enemyCatalog.length){for(const e of catalog.filter(e=>e.section.includes('Enemies'))){const data=await manifest(e.id);for(const v of data.variants){if(monsters[v.unitId]&&clipFor(v,'idle')&&!enemyCatalog.some(e=>e.variant.unitId===v.unitId))enemyCatalog.push({variant:v,...monsters[v.unitId]});}}}const ids=zoneEnemies(stage,wave);enemyPool=ids.map(id=>enemyCatalog.find(e=>e.variant.unitId===id));if(enemyPool.some(e=>!e))throw Error('Bestiaire incomplet pour '+stage.name);for(const id of [...new Set([...ids,...stage.bosses,...(stage.elites||[]),'5080010'])]){const e=enemyCatalog.find(e=>e.variant.unitId===id);if(!e)throw Error('Monstre indisponible : '+id);await cache.preload([clipFor(e.variant,'idle'),...(stage.elites?.includes(id)?[clipFor(e.variant,'atk')]:[])]);}})().finally(()=>{poolLoading=null;});return poolLoading;}
async function preloadHero(variant){await cache.preload(['idle','move','standby','atk','dying','dead','jump'].map(k=>clipFor(variant,k)));}
async function start(){if(!selectedVariant||!owned(selected)||turbo&&!playtest&&!turboUnlocked(save,stage.id,difficulty.id)||!playtest&&!difficultyUnlocked(save,stage.id,difficulty.id)||!playtest&&!stageUnlocked(save,stage.id)&&!(testMode&&forcedTestStage===stage.id))return;initAudio();keys.clear();close();$('start').disabled=true;$('start').textContent='PRÉPARATION…';try{await Promise.all([preloadHero(selectedVariant),refreshEnemyPool(),mapArt.load(stage),pickupArt.load()]);const bossProfile=await loadSuperboss(stage,manifest,cache),crystalAssets=await loadCrystalEncounter(stage,manifest,cache),encounterRoster=await loadEncounterRoster(stage,enemyCatalog,cache,bossProfile);aimPoint.active=false;state={turbo,encounterRoster,completedEncounters:[],radius:PLAYER_RADIUS,crystalAssets,crystalCompleted:false,crystalEncounter:null,limitBreakLevel:save.limitBreakLevel,limitCharge:0,phase:'survival',terrain:new Terrain(stage),bossProfile,superboss:null,pickups:[],pendingLevels:0,freezeTimer:0,hasteTimer:0,awaitingVictory:false,...selected,stage,difficulty:scaledDifficulty(stage,difficulty),variant:selectedVariant,anim:new AnimationPlayer(selectedVariant),maxHp:selected.hp,zoom:1,baseDamage:selected.damage,baseRange:selected.range,x:0,y:0,time:0,kills:0,level:1,xp:0,nextXp:5,enemies:[],gems:[],effects:[],damageNumbers:[],projectiles:[],hostileProjectiles:[],weapons:[{id:selected.weaponId,level:1,upgrades:{},timer:0}],powerups:[],aim:null,targetingMode:'manual',cursorAim:null,dash:null,lastElite:0,spawn:0,attack:0,cooldown:1,invuln:0,paused:false,over:false,ending:null,dodgeCooldown:0,action:null,attackCount:0,facing:false,godMode:false,history:[],wave:-1};state.onWeaponFire=w=>weaponAudio.play(w,save.options);state.exploration=createExploration(state);state.ownedHeroes=heroes.filter(owned).map(hero=>hero.id);applyPermanentUpgrades(state,save);route('arena');last=performance.now();state.anim.play('standby');await music.play(stage,save.options);updateHud();}catch(e){reportError(e);}finally{$('start').disabled=false;$('start').textContent='LANCER L’EXPÉDITION →';}}
$('start').onclick=start;
function format(t){return String(Math.floor(t/60)).padStart(2,'0')+':'+String(Math.floor(t%60)).padStart(2,'0');}
async function result(won){const s=state;if(s.over)return;s.over=true;if(won)music.playVictory(save.options);else music.playMenu(save.options);const before=new Set(heroes.filter(h=>available(save,h)).map(h=>h.id)),oldCoins=save.coins;if(!playtest){completeRun(save,s,won);await persist();}const newly=heroes.filter(h=>s.earnedHeroAchievements?.includes(h.id)||available(save,h)&&!before.has(h.id));show(`<h2>${won?'Le cristal est sauvé':'Votre légende continue'}</h2><p>${s.kills} ennemis vaincus · Niveau ${s.level}<br>Survie : ${format(s.time)} · ${s.difficulty.name}<br><strong>+ ${playtest?'simulation':save.coins-oldCoins+(s.bossBonusGils||0)} gils</strong></p>${newly.length?'<p>✦ Personnages débloqués : '+newly.map(h=>h.name).join(', ')+'</p>':''}${saveFailure?'<p>Le fichier de progression n’a pas pu être écrit ; une copie reste dans ce navigateur.</p>':''}`,[{text:'Nouvelle expédition',action:start},{text:'Retour au menu',action:lobby}]);$('modalBody').append(bossRatingSummary(s.bossRatings));}
function finish(won,retreat=false){if(!state||state.ending||state.over)return;state.paused=false;close();state.ending={won,elapsed:0};state.action=null;const event=retreat?'escape':won?'victory':'death';state.anim.setBase(retreat?'idle':won?'win':'dead');if(!state.anim.play(event,{onComplete:()=>result(won)}))result(won);}
function lobby(){state=null;route('menuScreen');}
function combatStatsMarkup(s){const stats=hitStats(s,equipmentEffects(s)),pct=n=>Number((n*100).toFixed(2)).toLocaleString('fr-FR')+' %';return '<span>Critique<strong>'+pct(stats.critRate)+'</strong></span><span>Dégâts critiques<strong>'+pct(stats.critDamage)+'</strong></span><span>Multi-hit<strong>'+pct(stats.multiHitRate)+'</strong></span>';}
function pause(){if(!state||state.over||state.ending||$('modal').open||heroReveal.active||bossRatingReveal.active)return;state.paused=true;keys.clear();show('<h2>Le temps suspendu</h2><div class="hit-stats-summary">'+combatStatsMarkup(state)+'</div>',[{text:'Reprendre',action:()=>{close();state.paused=false;}},{text:'Options',action:openOptions},...(playtest?[{text:state.godMode?'Désactiver l’invincibilité':'Activer l’invincibilité',action:()=>{state.godMode=!state.godMode;close();state.paused=false;}}]:[]),{text:'Terminer l’expédition et récupérer les gils',action:()=>finish(false,true)}]);}
$('pause').onclick=pause;
function levelup(){sfx.play('level-up',save.options);state.paused=true;keys.clear();state.choices=levelChoices(state);renderLevelChoices();}
function renderLevelChoices(){
 const choices=state.choices;show(`<div class="levelup-heading"><span class="eyebrow">LE CRISTAL S’ÉVEILLE</span><h2>Niveau ${state.level}</h2><p>Choisissez votre prochaine amélioration.</p><div class="levelup-loadout"><span>${state.weapons.length} / 6 armes</span><span>${state.powerups.length} / 6 passifs</span><span>Temps suspendu</span></div></div><div id="levelChoices" class="levelup-grid"></div>`);$('modal').classList.add('levelup-modal');$('levelChoices').style.setProperty('--choice-count',choices.length);
 for(const choice of choices){
  const row=document.createElement('div');row.className='upgrade-row';
  const b=document.createElement('button'),rarity=rarityOf(choice);b.dataset.upgrade=choice.type;b.dataset.item=choice.id;b.dataset.rarity=rarity.id;if(choice.upgrade)b.dataset.branch=choice.upgrade;b.className='upgrade-choice';b.style.setProperty('--rarity-color',rarity.color);
  const badge=document.createElement('span');badge.className='rarity-badge';badge.textContent='◆ '+rarity.name;
  const equipped=choice.type==='weapon'?state.weapons.find(w=>w.id===choice.id):state.powerups.find(p=>p.id===choice.id);
  const kind=document.createElement('span');kind.className='choice-kind';kind.textContent=choice.type==='weapon'?'ARME':choice.type==='powerup'?'PASSIF':'SOIN';
  const tier=document.createElement('span');tier.className='choice-tier';tier.textContent=choice.type==='stat'?'Restauration':equipped?`Rang ${equipped.level} → ${equipped.level+1}`:'Nouvel équipement';
  const label=document.createElement('span');label.className='choice-label';const name=document.createElement('strong'),detail=document.createElement('small');name.textContent=choice.name;detail.textContent=choice.detail;
  label.append(kind,name,tier,detail);b.append(badge,itemIcon(choice.icon),label);
  const preview=choicePreview(state,choice);
  if(preview.length){const stats=document.createElement('span');stats.className='choice-stats';for(const stat of preview){const line=document.createElement('span'),title=document.createElement('span'),values=document.createElement('span'),old=document.createElement('span'),arrow=document.createElement('span'),next=document.createElement('b');title.textContent=stat.label;old.textContent=stat.before;arrow.textContent=' → ';next.textContent=stat.after;values.append(old,arrow,next);line.append(title,values);stats.append(line);}b.append(stats);}
  const accept=document.createElement('span');accept.className='choice-accept';accept.textContent='CHOISIR CETTE AMÉLIORATION';b.append(accept);
  b.onclick=()=>{chooseUpgrade(state,choice);sfx.play('menu-click',save.options);close();state.paused=false;updateHud();};row.append(b);
  if(state.banishesRemaining>0&&choice.type!=='stat'){
   const banish=document.createElement('button');banish.className='banish-choice';banish.textContent='EXCLURE POUR CETTE PARTIE';banish.title='Retire ce choix des prochaines montées de niveau sans consommer ce niveau';banish.setAttribute('aria-label','Exclure '+choice.name);
   banish.onclick=()=>{if(banishLevelChoice(state,choice)){renderLevelChoices();sfx.play('menu-click',save.options);}};row.append(banish);
  }
  $('levelChoices').append(row);
 }
 const legend=document.createElement('div');legend.className='rarity-legend';legend.setAttribute('aria-label','Échelle des raretés');for(const rarity of rarities){const chip=document.createElement('span');chip.style.color=rarity.color;chip.textContent='◆ '+rarity.name;legend.append(chip);}$('modalBody').append(legend);
 const controls=document.createElement('div');controls.className='level-controls';const reroll=document.createElement('button'),remaining=document.createElement('small');
 reroll.id='rerollChoices';reroll.textContent='RELANCER LES CHOIX · '+(state.rerollsRemaining||0);reroll.disabled=!(state.rerollsRemaining>0);
 reroll.onclick=()=>{if(rerollLevelChoices(state)){renderLevelChoices();sfx.play('menu-click',save.options);}else{reroll.disabled=true;reroll.textContent='AUCUN AUTRE CHOIX DISPONIBLE';}};
 remaining.textContent='Exclusions : '+(state.banishesRemaining||0)+' restantes · Charges renouvelées à chaque expédition';controls.append(reroll,remaining);$('modalBody').append(controls);$('modal').scrollTop=0;
}
function requestAction(event){const s=state;if(!s||s.crystalEncounter?.phase==='pull'||s.paused||s.ending||s.over||s.anim.busy||s.dash||!['attack','dance'].includes(event))return false;if(event==='attack'&&s.weapons[0].timer>0)return false;const seq=actionSequence(s.variant,event,s.attackCount);if(event==='attack'){s.weapons[0].interval=weaponInterval(s,s.weapons[0]);s.weapons[0].timer=s.weapons[0].interval;}if(!seq.length)return event==='attack'&&fireWeapon(s,s.weapons[0]);for(const clip of seq)cache.loadClip(clip).catch(reportError);s.action=event==='attack'?{event,hit:false,nativeDuration:attackDuration(seq)}:null;s.attackCount++;s.anim.play(event,{index:s.attackCount-1,onComplete:()=>{if(s.action?.event==='attack'&&!s.action.hit)fireWeapon(s,s.weapons[0]);s.action=null;}});return true;}
function updateAim(){if(state){state.cursorAim=screenAim(state,aimPoint,canvas.width,canvas.height);state.aim=state.targetingMode==='auto'?null:state.cursorAim;}}
function pointAt(event){const rect=canvas.getBoundingClientRect();aimPoint.x=(event.clientX-rect.left)*canvas.width/rect.width;aimPoint.y=(event.clientY-rect.top)*canvas.height/rect.height;aimPoint.active=true;updateAim();}
canvas.addEventListener('pointermove',pointAt);canvas.addEventListener('pointerenter',pointAt);
canvas.addEventListener('pointerleave',()=>{aimPoint.active=false;updateAim();});
canvas.addEventListener('contextmenu',event=>event.preventDefault());
canvas.addEventListener('pointerdown',event=>{if(!state||screen!=='arena'||$('modal').open||heroReveal.active||bossRatingReveal.active)return;pointAt(event);if(event.button===2){event.preventDefault();const aim=state.aim;state.aim=state.cursorAim;startDash(state);state.aim=aim;}else if(event.button===0&&toggleTargeting(state)){updateAim();}});
async function changeForm(){const s=state;if(!s||s.paused||s.ending||s.anim.busy)return;const list=heroSkins(save,s.id,playtest),current=equippedSkin(save,s.id),next=list[(list.findIndex(v=>v.id===current.id)+1)%list.length];if(!next||next.id===current.id)return;s.paused=true;try{const variant=await skinVariant(next);await preloadHero(variant);if(!playtest)equipSkin(save,s.id,next.id);s.variant=variant;s.anim=new AnimationPlayer(variant);s.anim.play('shift');selectedVariant=variant;persist();}finally{s.paused=false;}}

window.addEventListener('keydown',e=>{if(bossRatingReveal.active||heroReveal.active||gachaView.presentation.active||gachaView.helpDialog.open){keys.clear();return;}if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys.add(e.key.toLowerCase());if(e.repeat)return;const key=e.key.toLowerCase();if(screen==='titleScreen'&&(key==='enter'||key===' ')){$('enter').click();return;}if(key==='escape'||key==='p')pause();if(key==='r')castLimitBreak(state);if(key==='c')changeForm();if(key==='b')requestAction('dance');if(playtest&&key==='v')finish(true);});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();pause();});
for(const b of document.querySelectorAll('[data-key]')){b.onpointerdown=e=>{b.setPointerCapture(e.pointerId);keys.add(b.dataset.key.toLowerCase());};b.onpointerup=b.onpointercancel=()=>keys.delete(b.dataset.key.toLowerCase());}
$('dodgeButton').onclick=()=>{if(state?.crystalEncounter?.phase!=='pull')startDash(state);};$('limitButton').onclick=()=>castLimitBreak(state);
function spawn(profile=null,elite=false,superboss=false){
 if(!enemyPool.length)return;const s=state;if(!profile&&!elite&&!superboss&&rollRareMog())profile=enemyCatalog.find(e=>e.rareMog);profile??=enemyPool[Math.floor(Math.random()*enemyPool.length)];
 const size=profile.rareMog?150:superboss?(profile.size||40):monsterSize(profile,elite),radius=enemyRadius(size,elite||superboss||profile.rareMog);
 const point=superboss?superbossSpawnPoint(s,canvas.width,canvas.height,radius):nearbySpawnPoint(s,radius);
 if(!point)return null;
 const speed=(superboss?60:43+s.time*.12)*s.difficulty.speed*profile.speed;
 const hp=profile.rareMog?rareMogHealth(s):superboss?superbossHealth(s,profile):(28+s.time*.22)*s.difficulty.hp*profile.hp*(elite?6:1);
 const e={...point,id:superboss?profile.id:profile.variant.unitId,name:profile.name,variant:profile.variant,anim:new AnimationPlayer(profile.variant),hp,maxHp:hp,speed,baseSpeed:speed,size,rareMog:Boolean(profile.rareMog),rareMogTime:0,elite:elite||superboss||Boolean(profile.rareMog),roamingElite:elite&&!superboss,superboss,nativeFacing:superboss?'left':'right',spawnProtection:superboss?2:PORTAL_DURATION,portalSpawn:!superboss,radius,special:elite?(profile.eliteSpecial||profile.special):profile.special,hit:0,attack:0,dying:0,facing:false};
 s.enemies.push(e);if(!superboss)addSpawnPortal(s,e);if(!playtest)recordMonster(save,e.id,e.name);return e;
}
function animatorTick(anim,dt){const clip=anim.clip;if(!clip)return;if(cache.ready(clip,anim.elapsed,{loop:!anim.busy}))anim.update(dt);else cache.loadClip(clip,anim.elapsed,{loop:!anim.busy}).catch(reportError);}
function update(dt){const s=state;tickRegeneration(s,dt,equipmentEffects(s).regeneration);tickLegendaryEffects(s,dt);if(!advanceAttackAnimation(s,dt,(clip,elapsed)=>{if(cache.ready(clip,elapsed,{loop:false}))return true;cache.loadClip(clip,elapsed,{loop:false}).catch(reportError);return false;},()=>{fireWeapon(s,s.weapons[0]);}))animatorTick(s.anim,dt);if(s.ending){s.ending.elapsed+=dt;return;}if(!s.crystalEncounter)s.time+=dt;if(beginScheduledEncounter(s)&&!playtest)recordMonster(save,s.crystalEncounter.boss.id,s.crystalEncounter.boss.name);tickLimitBreak(s,dt);tickPickups(s,dt,canvas.width,canvas.height);if(s.bossNotice)s.bossNotice.life-=dt;s.invuln=Math.max(0,s.invuln-dt);s.dodgeCooldown=Math.max(0,s.dodgeCooldown-dt);let dx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('q')||keys.has('arrowleft')),dy=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('z')||keys.has('arrowup'));const len=Math.hypot(dx,dy)||1;const pulling=s.crystalEncounter?.phase==='pull',dashing=!pulling&&tickDash(s,dt);if(!dashing&&!pulling)movePlayer(s,dx/len*s.speed*dt,dy/len*s.speed*dt);updateAim();if(s.aim?.active)s.facing=s.aim.x<s.x;else if(dx)s.facing=dx<0;const moving=Boolean(dx||dy||dashing);if(moving&&!s.moving&&!s.anim.busy&&clipFor(s.variant,'move_before'))s.anim.play('move');s.moving=moving;s.anim.setBase(moving?'move':s.hp<s.maxHp*.25?'dying':'idle');
const wave=Math.floor(Math.min(s.time,s.stage.duration-1)/30);if(wave!==s.wave){s.wave=wave;refreshEnemyPool(wave).catch(reportError);}s.spawn-=dt;if(s.phase==='survival'&&s.spawn<=0){for(let i=0;i<1+Math.floor(s.time/65);i++)spawn();s.spawn=spawnInterval(s);}if(roamingEliteDue(s)){const ids=s.stage.elites||[],id=ids[Math.floor(Math.random()*ids.length)],profile=enemyCatalog.find(e=>e.variant.unitId===id);if(profile)spawn(profile,true);}tickSpawnPortals(s,dt);tickExploration(s,dt);if(s.explorationGilsPending){const gils=s.explorationGilsPending;s.explorationGilsPending=0;s.explorationBonusGils=(s.explorationBonusGils||0)+gils;addGilFeedback(s,s,gils);if(!playtest){save.coins+=gils;persist();}}const nearest=nearestEnemy(s,weapons[s.weaponId].range*(s.range/s.baseRange)*equipmentEffects(s).range+100);if(!pulling&&(s.aim?.active||nearest)&&!s.anim.busy&&!s.dash&&s.weapons[0].timer<=0){if(!s.aim?.active)s.facing=nearest.x<s.x;requestAction('attack');}
// The initial weapon lands during the unit's native attack. Extra weapons have independent timers.
if(!pulling){tickWeapons(s,dt,true);tickProjectiles(s,dt);}tickMultiHits(s,dt);if(tickBossEncounters(s,dt)){addGilFeedback(s,s,killGilAmount(s));if(!playtest){save.coins+=s.lastBossRating?.gils||0;save.limitBreakLevel=Math.max(save.limitBreakLevel,s.limitBreakLevel||0);recordMonster(save,s.defeatedEncounterBoss.id,s.defeatedEncounterBoss.name,true);const earned=recordHeroBossVictory(save,s,s.defeatedEncounterBoss.achievementId);if(earned.length){for(const id of earned)if(claimHero(save,id)){s.pendingHeroUnlocks??=[];s.pendingHeroUnlocks.push(id);}s.ownedHeroes=[...save.unlocked];}persist();}if(s.lastBossRating){s.paused=true;keys.clear();bossRatingReveal.show(s.lastBossRating);updateHud();return;}}for(const e of s.enemies){if(e.mechanicTarget){if(e.objectiveKind==='mage'&&e.hp>0)animatorTick(e.anim,dt);e.hit=Math.max(0,e.hit-dt);continue;}if(e.summoned&&!e.encounterSeen){e.encounterSeen=true;if(!playtest)recordMonster(save,e.id,e.name);}if(!s.freezeTimer||e.dying||e.miniboss)animatorTick(e.anim,dt);e.hit=Math.max(0,e.hit-dt);e.spawnProtection=Math.max(0,(e.spawnProtection||0)-dt);if(e.slowTime>0){e.slowTime-=dt;if(e.slowTime<=0){e.speed=e.baseSpeed;e.slowFactor=1;}}if(e.dying){e.dying+=dt;continue;}if(e.miniboss){e.facing=s.x<e.x;continue;}if(e.hp<=0){const gift=rareMogReward(e);if(gift){s.rareBonusGils=(s.rareBonusGils||0)+gift;s.pickupNotice={name:'+ '+gift+' GILS · Roi Mog vaincu !',life:4};if(!playtest){save.coins+=gift;persist();}}s.kills++;addGilFeedback(s,e,killGilAmount(s)+gift);s.hp=Math.min(s.maxHp,s.hp+equipmentEffects(s).leech);s.gems.push({x:e.x,y:e.y,value:e.elite?8:1});if(!playtest)recordMonster(save,e.id,e.name,true);e.dying=.001;e.deathDuration=Math.max(.65,clipFor(e.variant,'dead')?clipDuration(clipFor(e.variant,'dead')):.65);e.anim.play('death');const loot=dropLoot(s,e);if(e.superboss){s.awaitingVictory=true;s.phase='victory';s.hostileProjectiles=[];s.enemies.forEach(other=>{if(other!==e)other.dying=.001;});if(loot){s.pickups.splice(s.pickups.indexOf(loot),1);consume(s,'level',canvas.width,canvas.height);}}continue;}if(e.rareMog){tickRareMog(s,e,dt);continue;}if(tickKnockback(s,e,dt))continue;if(e.summoned||s.freezeTimer>0||s.awaitingVictory||e.spawnProtection>0)continue;const d=Math.hypot(s.x-e.x,s.y-e.y)||1;e.facing=s.x<e.x;if(d>e.radius+playerRadius(s)&&!e.specialCharge&&!e.eliteCast){const dir=s.terrain.direction(e,s,e.radius),length=Math.hypot(dir.x,dir.y)||1;moveEntity(s.terrain,e,dir.x/length*e.speed*dt,dir.y/length*e.speed*dt,e.radius);}e.attack-=dt;if(d<e.radius+playerRadius(s)+5&&e.attack<=0&&!e.anim.busy&&!e.specialCharge&&!e.eliteCast){const hasAttack=e.anim.play('attack');e.attack=1;e.strikePending=true;if(!hasAttack)e.strikeReady=true;}const enemyClip=e.anim.clip;if(e.strikePending&&(e.strikeReady||enemyClip?.state.startsWith('atk')&&e.anim.elapsed>=clipDuration(enemyClip)*.35)){e.strikePending=false;e.strikeReady=false;if(d<e.radius+playerRadius(s)+8&&s.invuln<=0&&!s.godMode){const received=mitigatedDamage(s,12*s.difficulty.damage*(e.elite?2:1));recordBossDamage(s,received);s.hp-=received;s.invuln=.65;}}}
separateEnemies(s);separatePlayerBosses(s);if((!s.freezeTimer||s.crystalEncounter)&&!s.awaitingVictory)tickEnemyAttacks(s,dt);s.enemies=s.enemies.filter(e=>!e.dying||e.dying<(e.deathDuration||.65));s.gems=s.gems.filter(g=>{const d=Math.hypot(g.x-s.x,g.y-s.y);if(d<22){s.xp+=(g.value||1)*(s.experienceMultiplier||1)*equipmentEffects(s).experience;return false;}if(d<(s.gemAttractionRadius||125)){g.x+=(s.x-g.x)*dt*8;g.y+=(s.y-g.y)*dt*8;}return true;});for(const fx of s.effects)fx.life-=dt;s.effects=s.effects.filter(f=>f.life>0);tickDamageNumbers(s,dt);tickGilFeedback(s,dt);saveTimer+=dt;if(saveTimer>10){saveTimer=0;persist();}
if(s.pendingHeroUnlocks?.length){revealHeroes(s.pendingHeroUnlocks.splice(0));updateHud();return;}if(s.hp<=0&&!tryAutoPhoenix(s)){finish(false);return;}if(s.pendingLevels>0){s.pendingLevels--;s.level++;levelup();updateHud();return;}if(s.xp>=s.nextXp){s.xp-=s.nextXp;s.level++;s.nextXp=Math.floor(s.nextXp*1.3)+3;levelup();updateHud();return;}if(s.awaitingVictory){finish(true);return;}updateHud();}
function updateHud(){const s=state;$('zoomLabel').textContent=Math.round(s.zoom*100)+' %';$('timer').textContent=format(Math.min(s.time,s.stage.duration))+' / '+format(s.stage.duration)+(s.crystalEncounter?' · TIMER SUSPENDU':s.phase==='superboss'?' · SUPERBOSS':'');const boss=s.crystalEncounter?.boss||s.superboss,c=s.crystalEncounter;$('bossHud').hidden=!boss||boss.hp<=0;$('bossSegments').hidden=!c;$('bossHealth').parentElement.hidden=Boolean(c);$('bossMechanic').textContent=encounterInstruction(c);$('bossEnrage').textContent=c?`Pression de l’arène · ${Math.round((c.enrageProgress||0)*100)} %` :'';$('bossSegments').classList.toggle('guarded',Boolean(c&&c.phase!=='combat'));if(boss){$('bossName').textContent=boss.name+(c?.phase==='false-death'?' · FAUSSE MORT · −90 % DÉGÂTS':c?.scripted&&c.phase==='mechanic'?' · BARRIÈRE · −90 % DÉGÂTS':'');$('bossHealth').style.width=Math.max(0,boss.hp/boss.maxHp*100)+'%';if(c){const ratios=bossSegmentRatios(boss);for(let i=0;i<3;i++){const bar=$('bossSegment'+(i+1));bar.parentElement.hidden=i>=ratios.length;bar.style.width=(ratios[i]||0)*100+'%';}}}$('limitButton').hidden=!s.limitBreakLevel;$('limitButton').disabled=s.limitCharge<60||c?.phase==='pull';$('limitButton').textContent=s.limitCharge>=60?'LIMITE NIV. 1 · R':`LIMITE · ${Math.ceil(60-s.limitCharge)} s`;$('pickupNotice').hidden=Boolean(c);$('bossFeedback').textContent=c&&s.pickupNotice?.life>0?s.pickupNotice.name:'';$('pickupNotice').textContent=s.bossNotice?.life>0?'SUPERBOSS · '+s.bossNotice.name:s.pickupNotice?.life>0?s.pickupNotice.name:'';$('temporaryBuffs').textContent=[s.freezeTimer>0?'❄ Gel · '+s.freezeTimer.toFixed(1)+' s':'',s.hasteTimer>0?'➶ Célérité · '+s.hasteTimer.toFixed(1)+' s':''].filter(Boolean).join('   ');$('kills').textContent=s.kills+' éliminations';$('heroName').textContent=s.name+' · NIV. '+s.level;$('health').style.width=(Math.max(0,s.hp)/s.maxHp*50)+'%';$('xp').style.width=(s.xp/s.nextXp*50)+'%';$('wave').textContent=s.phase==='survival'&&s.time%30<3?'VAGUE '+(s.wave+1)+' · '+s.terrain.areaAt(s.x,s.y):'';$('currentAction').textContent=labelFor(s.anim.clip?.state||'idle');$('dodgeButton').textContent=s.dodgeCooldown>0?`DASH · ${s.dodgeCooldown.toFixed(1)} s`:'DASH · CLIC DROIT';$('dodgeButton').disabled=s.dodgeCooldown>0;const loadoutKey=s.weapons.map(w=>w.id+':'+w.level).join('|');if(loadoutKey!==s.loadoutKey){s.loadoutKey=loadoutKey;$('loadout').replaceChildren();for(const w of s.weapons){const slot=document.createElement('span');slot.className='loadout-slot';slot.title=`${weapons[w.id].name} · Niveau ${w.level}`+(w.upgrades?' · '+Object.entries(w.upgrades).filter(([,n])=>n>0).map(([id,n])=>weapons[w.id].upgrades.find(b=>b.id===id)?.name+' '+n).join(' · '):'');slot.setAttribute('role','img');slot.setAttribute('aria-label',slot.title);const level=document.createElement('b');level.textContent=w.level;slot.append(itemIcon(weapons[w.id].icon),level);$('loadout').append(slot);}}const passiveKey=s.powerups.map(p=>p.id+':'+p.level).join('|');if(passiveKey!==s.passiveKey){s.passiveKey=passiveKey;$('powerupLoadout').replaceChildren();for(let i=0;i<6;i++){const p=s.powerups[i],slot=document.createElement('span');slot.className='loadout-slot'+(p?'':' empty-slot');if(p){slot.title=powerups[p.id].name+' · NIV. '+p.level+' · '+rarityDetail({type:'powerup',id:p.id,detail:powerups[p.id].detail},p.potency??p.level);const level=document.createElement('b');level.textContent=p.level;slot.append(itemIcon(powerups[p.id].icon),level);}else{slot.textContent='◇';slot.title='Emplacement de power-up libre';}$('powerupLoadout').append(slot);}}$('equipmentCount').textContent=s.weapons.length+'/6 ARMES · '+s.powerups.length+'/6 POWER-UPS';}
function draw(){const s=state,w=canvas.width,h=canvas.height;ctx.fillStyle=s.stage.colors[0];ctx.fillRect(0,0,w,h);const ox=w/2-s.x,oy=h/2-s.y,halfW=w/(2*s.zoom),halfH=h/(2*s.zoom);ctx.save();ctx.translate(w/2,h/2);ctx.scale(s.zoom,s.zoom);ctx.translate(-w/2,-h/2);mapArt.draw(ctx,s,ox,oy,w,h);if(!s.crystalEncounter)drawExploration(ctx,s,ox,oy);pickupArt.draw(ctx,s,ox,oy);drawCrystalEncounter(ctx,s,ox,oy);drawBossEncounters(ctx,s,ox,oy);drawEnemyAttacks(ctx,s,ox,oy);drawHitboxes(ctx,s,ox,oy);drawSpawnPortals(ctx,s,ox,oy);
drawExperienceCrystals(ctx,s,ox,oy);for(const e of s.enemies){if(e.mechanicTarget&&(e.objectiveKind!=='mage'||e.hp<=0))continue;drawHitAura(ctx,e,e.x+ox,e.y+oy);const emergence=emergenceScale(e);ctx.globalAlpha=(e.fakeDeath?.4:e.dying?Math.max(0,1-e.dying/(e.deathDuration||.65)):1)*emergence;cache.draw(ctx,e.anim.clip,e.anim.elapsed,e.x+ox,e.y+oy,{scale:scaleFor(e.variant,e.size||40)*emergence,flip:spriteFlip(e.facing,e.nativeFacing||'right'),loop:!e.anim.busy});ctx.globalAlpha=1;if(emergence>0)drawEliteHealth(ctx,e,scaleFor(e.variant,e.size||40)*emergence,s.zoom,ox,oy);drawRareMog(ctx,s,e,ox,oy);}drawCombat(ctx,s,ox,oy,save.options.effects,save.options.playerEffects);
drawLegendaryAura(ctx,s,w/2,h/2);ctx.globalAlpha=s.invuln>0&&!s.ending ? .8 : 1;const clip=s.anim.clip;const frame=cache.draw(ctx,clip,s.anim.elapsed,w/2,h/2,{scale:scaleFor(s.variant),flip:spriteFlip(s.facing,s.variant.nativeFacing||'left'),loop:!s.anim.busy});if(frame===null)cache.draw(ctx,clipFor(s.variant,'idle'),s.time,w/2,h/2,{scale:scaleFor(s.variant),flip:spriteFlip(s.facing,s.variant.nativeFacing||'left')});ctx.globalAlpha=1;drawGilFeedback(ctx,s,ox,oy);drawDamageNumbers(ctx,s,ox,oy);if(frame!==null&&clip){const prev=s.history.at(-1);if(!prev||prev.state!==clip.state||prev.variant!==s.variant.id){s.history.push({hero:s.id,variant:s.variant.id,state:clip.state,resource:clip.resource,time:s.time,frames:clip.frames.length});if(s.history.length>500)s.history.shift();}}ctx.restore();if(s.screenFlash?.life>0){ctx.save();ctx.globalAlpha=.3*s.screenFlash.life/s.screenFlash.maxLife;ctx.fillStyle=s.screenFlash.color;ctx.fillRect(0,0,w,h);ctx.restore();}drawHeroBars(ctx,s,w,h);drawReticle();}
function drawReticle(){if(!aimPoint.active||$('modal').open||heroReveal.active||bossRatingReveal.active||state?.targetingMode==='auto')return;ctx.save();ctx.translate(aimPoint.x,aimPoint.y);ctx.strokeStyle='#fff1c1';ctx.lineWidth=2;ctx.shadowColor='#080c1c';ctx.shadowBlur=4;ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.moveTo(-16,0);ctx.lineTo(-6,0);ctx.moveTo(6,0);ctx.lineTo(16,0);ctx.moveTo(0,-16);ctx.lineTo(0,-6);ctx.moveTo(0,6);ctx.lineTo(0,16);ctx.stroke();ctx.fillStyle='#91e9dd';ctx.fillRect(-1,-1,2,2);ctx.restore();}
async function openWorkshop(fromRun=false){if(fromRun)state.paused=true;let hero=selected,entity=await manifest(hero.id);const variant=fromRun?state.variant:defaultVariant(entity);show('<h2>Atelier des animations</h2><p id="workshopName"></p><select id="workshopEntity" aria-label="Personnage de la bibliothèque complète"></select><div class="workshop-controls"><select id="workshopVariant" aria-label="Forme à tester"></select><select id="workshopState" aria-label="Animation à tester"></select></div><canvas id="animationPreview" width="540" height="320"></canvas><div class="workshop-controls"><button id="previewReplay">Relire</button><button id="previewAll">Lire toutes les animations</button></div><label class="preview-fit"><input type="checkbox" id="previewFit" checked> Voir l’animation entière</label><input type="range" id="previewFrame" min="0" value="0" aria-label="Image de l’animation"><p id="previewInfo"></p><div id="portraits"></div>',[{text:fromRun?'Reprendre l’expédition':'Retour aux héros',action:()=>{close();if(fromRun)state.paused=false;}}]);gallery={entity,variant,clip:null,time:0,all:false,clipIndex:0,clips:[]};$('workshopName').textContent=hero.name;for(const e of catalog.filter(e=>e.section.startsWith('Characters:'))){const o=document.createElement('option');o.value=e.id;o.textContent=e.name+' · '+e.section.replace('Characters: ','');o.selected=e.id===hero.id;$('workshopEntity').append(o);}$('workshopEntity').onchange=async e=>{const data=await manifest(e.target.value);if(!gallery)return;hero=summaries.get(e.target.value);entity=data;gallery.entity=data;gallery.all=false;const v=defaultVariant(data);$('workshopName').textContent=hero.name;$('workshopVariant').replaceChildren();for(const form of data.variants){const o=document.createElement('option');o.value=form.id;o.textContent=form.label;o.selected=form.id===v.id;$('workshopVariant').append(o);}chooseVariant(v.id);};for(const v of entity.variants){const o=document.createElement('option');o.value=v.id;o.textContent=v.label;o.selected=v.id===variant.id;$('workshopVariant').append(o);}
function chooseVariant(id){gallery.variant=entity.variants.find(v=>v.id===id);gallery.clips=Object.entries(gallery.variant.animations).flatMap(([key,list])=>list.map((clip,i)=>({key,label:labelFor(key)+(list.length>1?' '+(i+1):''),clip})));$('workshopState').replaceChildren();for(let i=0;i<gallery.clips.length;i++){const o=document.createElement('option');o.value=i;o.textContent=gallery.clips[i].label;$('workshopState').append(o);}const idle=gallery.clips.findIndex(c=>c.key==='idle');setClip(Math.max(0,idle));$('portraits').replaceChildren();for(const id of [...(gallery.variant.portrait||[]),...(gallery.variant.icon||[])]){const img=document.createElement('img');img.src='/resources/'+id;img.alt=hero.name;img.loading='lazy';$('portraits').append(img);}}
function setClip(index){gallery.clipIndex=index;gallery.clip=gallery.clips[index].clip;gallery.time=0;gallery.scrub=false;$('workshopState').value=index;$('previewFrame').max=gallery.clip.frames.length-1;$('previewFrame').value=0;cache.loadClip(gallery.clip).catch(reportError);}
$('workshopVariant').onchange=e=>chooseVariant(e.target.value);$('workshopState').onchange=e=>{gallery.all=false;setClip(Number(e.target.value));};$('previewReplay').onclick=()=>{gallery.time=0;gallery.all=false;gallery.scrub=false;};$('previewAll').onclick=()=>{gallery.all=true;setClip(0);};$('previewFrame').oninput=e=>{gallery.all=false;gallery.time=Number(e.target.value)/gallery.clip.frames.length*clipDuration(gallery.clip);gallery.scrub=true;};gallery.setClip=setClip;chooseVariant(variant.id);}

function drawWorkshop(dt){if(!gallery||!gallery.clip)return;const g=gallery,preview=$('animationPreview'),c=preview.getContext('2d');c.clearRect(0,0,preview.width,preview.height);c.fillStyle='#172b32';c.fillRect(0,0,preview.width,preview.height);c.strokeStyle='#d6b87555';c.beginPath();c.moveTo(0,270);c.lineTo(preview.width,270);c.stroke();if(cache.ready(g.clip,g.time)&&!g.scrub)g.time+=dt;const duration=clipDuration(g.clip);if(g.all&&g.time>=duration){g.setClip((g.clipIndex+1)%g.clips.length);}const fit=$('previewFit').checked||g.clip.rawSheet,scale=fit?Math.min(480/g.clip.fw,270/g.clip.fh):scaleFor(g.variant,95);const x=fit?270+(g.clip.anchor[0]-g.clip.fw/2)*scale:270,y=fit?160+(g.clip.anchor[1]-g.clip.fh/2)*scale:265;const index=cache.draw(c,g.clip,g.time,x,y,{scale,loop:true});if(index!==null&&!g.scrub)$('previewFrame').value=index;$('previewInfo').textContent=`${labelFor(g.clip.state)} · image ${(index??0)+1} / ${g.clip.frames.length} · ${g.variant.label}`;}
const titleCards=[];for(const [id,canvasId] of [['asset-70472','titleRain'],['asset-87187','titleLasswell'],['asset-87186','titleFina']]){manifest(id).then(async e=>{const variant=defaultVariant(e);await cache.loadClip(clipFor(variant,'idle'));titleCards.push({variant,canvas:$(canvasId)});}).catch(reportError);}
function drawUnit(c,variant,now,height,x,y){const context=c.getContext('2d');context.clearRect(0,0,c.width,c.height);cache.draw(context,clipFor(variant,'idle')||clipFor(variant,'standby'),now/1000,x,y,{scale:scaleFor(variant,height)});}
function frame(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;if(state&&screen==='arena'){if(!state.paused&&!state.over)advanceSimulation(state,dt,update);draw();}else if(screen==='characterScreen'){for(const card of cards)if(card.variant)drawUnit(card.canvas,card.variant,now,62,55,91);if(selectedVariant)drawUnit($('selectedPortrait'),selectedVariant,now,115,125,170);}else if(screen==='titleScreen'){for(const card of titleCards)drawUnit(card.canvas,card.variant,now,210,150,275);}heroReveal.tick(dt);bossRatingReveal.tick(dt);gachaView.tick(dt);drawWorkshop(dt);requestAnimationFrame(frame);}
if(playtest)$('playtestBanner').hidden=false;
if(testMode)window.__BES_TEST__={get heroes(){return heroes;},get catalog(){return catalog;},get state(){return state;},get save(){return save;},get screen(){return screen;},get cache(){return cache;},get stages(){return stages;},get enemyPool(){return enemyPool;},get music(){return music;},get sfx(){return sfx;},get heroReveal(){return heroReveal;},get bossRatingReveal(){return bossRatingReveal;},get gacha(){return gachaView;},chooseStage:id=>{stage=stages.find(s=>s.id===id)||stage;forcedTestStage=stage.id;difficulty=difficulties[0];turbo=false;},dash:()=>startDash(state),step:update,castLimit:()=>castLimitBreak(state),manifest,spawnRareMog:()=>spawn(enemyCatalog.find(e=>e.rareMog)),spawnElite:id=>{const profile=enemyCatalog.find(e=>e.variant.unitId===id);return profile&&state?.stage.elites?.includes(id)?spawn(profile,true):null;},select:async(id,variant)=>{await selectHero(heroes.find(h=>h.id===id),variant);renderRoster();},start,action:requestAction,finish,setHp:hp=>{state.hp=hp;},changeForm,workshop:()=>openWorkshop(),levelup,renderChoices:renderLevelChoices,resume:()=>{close();state.paused=false;},persist,route,renderStages,snapshot:()=>({hero:state?.id,variant:state?.variant.id,state:state?.anim.clip?.state,time:state?.time,kills:state?.kills,history:state?.history,failures:cache.failures})};
await sfx.prepare();route('titleScreen');await selectHero(selected);requestAnimationFrame(frame);
