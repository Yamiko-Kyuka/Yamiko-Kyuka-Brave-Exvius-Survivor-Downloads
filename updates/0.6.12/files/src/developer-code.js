import {heroes,stages,difficulties,normalizeSave} from './model.js';
import {permanentUpgrades} from './permanent-upgrades.js';
import {skinCatalog} from './skin-catalog.js';
import {challengeBosses} from './hero-achievements.js';
import {monsters} from './bestiary.js';

/** Explicitly applied to the active profile only; never runs during save loading. */
export function applyDeveloperCode(save,code){
 if(typeof code!=='string'||code.trim().toUpperCase()!=='CRISTALDEV')return false;
 const next=normalizeSave(structuredClone(save));
 next.unlocked=heroes.filter(h=>!h.unavailable).map(h=>h.id);
 next.coins=Math.max(next.coins,1000000);next.limitBreakLevel=1;
 for(const stage of stages){next.stageWins[stage.id]=Math.max(1,next.stageWins[stage.id]||0);for(const d of difficulties)next.difficultyWins[stage.id][d.id]=Math.max(1,next.difficultyWins[stage.id][d.id]||0);}
 for(const id of Object.keys(challengeBosses))for(const d of difficulties)next.bossWins[id][d.id]=Math.max(99,next.bossWins[id][d.id]||0);
 for(const u of permanentUpgrades)next.permanentUpgrades[u.id]=u.maxLevel;
 next.cosmetics.owned=skinCatalog.map(s=>s.id);
 for(const [id,m]of Object.entries(monsters))next.bestiary[id]??={name:m.name,seen:1,kills:0};
 Object.assign(save,normalizeSave(next));return true;
}
