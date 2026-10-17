import {skinCatalog} from './skin-catalog.js';
import {rarities} from './rarity.js';
export const GACHA_COST=20000;
export const GACHA_DUPLICATE_REFUND=GACHA_COST/2;
export const gachaRarities=rarities.map((r,i)=>({...r,weight:[50,27,15,6,2][i]}));
const byId=new Map(skinCatalog.map(s=>[s.id,s])),classics=skinCatalog.filter(s=>s.classic);
export function normalizeCosmetics(raw){
 const owned=[...new Set([...classics.map(s=>s.id),...(Array.isArray(raw?.owned)?raw.owned.filter(id=>byId.has(id)):[])])],ownership=new Set(owned);
 const selected=Object.fromEntries(classics.map(base=>{const skin=byId.get(raw?.selected?.[base.heroId]);return [base.heroId,skin?.heroId===base.heroId&&ownership.has(skin.id)?skin.id:base.id];}));
 return {owned,selected,draws:Number.isFinite(raw?.draws)?Math.max(0,Math.floor(raw.draws)):0};
}
export function gachaUnlocked(save){return ['midgar','zanarkand','crystal-tower','dark-world'].every(stage=>['aeon','primal','transcendence'].some(d=>Number(save.difficultyWins?.[stage]?.[d])>0));}
export function equippedSkin(save,heroId){const cosmetics=normalizeCosmetics(save.cosmetics);return byId.get(cosmetics.selected[heroId]);}
export function heroSkins(save,heroId,developer=false){const owned=new Set(normalizeCosmetics(save.cosmetics).owned);return skinCatalog.filter(s=>s.heroId===heroId&&(developer||owned.has(s.id)));}
export function equipSkin(save,heroId,skinId){const skin=byId.get(skinId),cosmetics=normalizeCosmetics(save.cosmetics);if(!skin||skin.heroId!==heroId||!cosmetics.owned.includes(skinId))return false;cosmetics.selected[heroId]=skinId;save.cosmetics=cosmetics;return true;}
export function gachaPool(){return skinCatalog.filter(s=>!s.classic);}
export function gachaOdds(save){const pool=gachaPool(save),available=gachaRarities.map(r=>({...r,count:pool.filter(s=>s.rarity===r.id).length})),total=available.reduce((n,r)=>n+(r.count?r.weight:0),0);return available.map(r=>({...r,probability:r.count&&total?r.weight/total:0}));}
export function drawSkin(save,random=Math.random){
 if(!gachaUnlocked(save)||!Number.isFinite(save.coins)||save.coins<GACHA_COST)return null;
 const pool=gachaPool(save);if(!pool.length)return null;
 let roll=Math.max(0,Math.min(1-Number.EPSILON,random())),tier=gachaOdds(save).filter(r=>r.count).at(-1);
 for(const r of gachaOdds(save)){roll-=r.probability;if(roll<0){tier=r;break;}}
 const choices=pool.filter(s=>s.rarity===tier.id),index=Math.min(choices.length-1,Math.max(0,Math.floor(random()*choices.length))),skin=choices[index];if(!skin)return null;
 save.cosmetics=normalizeCosmetics(save.cosmetics);const duplicate=save.cosmetics.owned.includes(skin.id),refund=duplicate?GACHA_DUPLICATE_REFUND:0;if(!duplicate)save.cosmetics.owned.push(skin.id);save.cosmetics.draws++;save.coins-=GACHA_COST-refund;return {...skin,duplicate,refund};
}
export {skinCatalog};
