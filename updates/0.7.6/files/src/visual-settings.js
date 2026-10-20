export function playerEffectsOpacity(value){return Number.isFinite(value)?Math.max(.01,Math.min(1,value)):1;}
export function normalizeVisualSettings(options={}){return {playerEffects:playerEffectsOpacity(options?.playerEffects),combatReadability:options.combatReadability!==false};}

/** Fade only player cosmetics in dense fights. Hostile telegraphs retain full strength. */
export function combatEffectsOpacity(state,value,readability=true){
 const requested=playerEffectsOpacity(value);if(!readability)return requested;
 const pressure=(state.projectiles?.length||0)+(state.effects?.length||0)*.5;
 const factor=pressure>120?.4:pressure>60?.6:pressure>25?.8:1;
 return Math.max(.01,requested*factor);
}
