export function simulationRate(s){return s.turbo&&s.phase==='survival'&&!s.crystalEncounter?1.5:1;}
/** Consume real time in small simulation steps and re-evaluate speed at boss transitions. */
export function advanceSimulation(s,realDt,update){
 let remaining=realDt;
 while(remaining>1e-8&&!s.paused&&!s.over){const rate=simulationRate(s),step=Math.min(remaining,.05/rate);update(step*rate);remaining-=step;}
}
