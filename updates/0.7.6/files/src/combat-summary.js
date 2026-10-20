import {weapons} from './model.js';
export function recordWeaponDamage(s,{amount,weaponId,style}){
 if(!Number.isFinite(amount)||amount<=0)return;
 s.combatTotals??={damage:0,hits:0,critical:0,multiHit:0,weapons:{}};const total=s.combatTotals;total.damage+=amount;total.hits++;if(style==='critical')total.critical++;if(style==='multihit')total.multiHit++;
 const id=weapons[weaponId]?weaponId:'other';total.weapons[id]=(total.weapons[id]||0)+amount;
}
export function combatSummaryRows(s){const seconds=Math.max(1,s.combatSeconds||0);return Object.entries(s.combatTotals?.weapons||{}).sort((a,b)=>b[1]-a[1]).map(([id,damage])=>({id,name:weapons[id]?.name||'Autres dégâts',damage,dps:damage/seconds}));}
export function combatSummaryMarkup(s){const rows=combatSummaryRows(s);if(!rows.length)return '';const n=value=>Math.round(value).toLocaleString('fr-FR');return '<section class="combat-result"><h3>Votre équipement en action</h3><p>Dégâts infligés · DPS moyen sur la partie</p>'+rows.map(row=>'<div><strong>'+row.name+'</strong><span>'+n(row.damage)+'</span><small>'+n(row.dps)+' DPS</small></div>').join('')+'</section>';}
