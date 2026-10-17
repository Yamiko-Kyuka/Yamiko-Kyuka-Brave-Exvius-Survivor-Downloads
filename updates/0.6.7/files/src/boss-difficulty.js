const ids=['normal','crystal','light','aeon','primal','transcendence'];
export function bossTier(s){return Math.max(0,ids.indexOf(s.difficulty?.id));}
export function bossTuning(s){const rank=bossTier(s);return {rank,hp:[1,1.15,1.35,1.6,1.95,2.35][rank],cadence:[1,.96,.92,.88,.84,.8][rank],shots:rank*2};}
export function extraBossPatterns(stage,rank){
 const first={midgar:'radial',zanarkand:'starfall','crystal-tower':'lattice','dark-world':'radial'}[stage]||'radial';
 const order=[first,...['radial','starfall','lattice','spiral','nova'].filter(k=>k!==first)];return order.slice(0,Math.max(0,Math.min(5,rank)));
}
export function bossSegmentRatios(boss){const count=boss.segmentCount||2,unit=boss.maxHp/count;return Array.from({length:count},(_,i)=>Math.max(0,Math.min(1,(boss.hp-i*unit)/unit)));}
