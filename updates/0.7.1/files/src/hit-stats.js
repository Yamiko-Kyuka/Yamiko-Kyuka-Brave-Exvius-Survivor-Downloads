/** Chances are fractions; critical damage is the full damage multiplier. */
export const HIT_BASE={critRate:.05,critDamage:2,multiHitRate:.01};
export const HIT_POWERUP_STEPS={critRate:.04,critDamage:.20,multiHit:.03};
export const MULTI_HIT_DAMAGE=.20;
export const MULTI_HIT_DELAY=.07;
export const MAX_MULTI_HIT_CHANCE=.95;
const finite=(value,fallback=0)=>Number.isFinite(value)?value:fallback;
export function hitStats(state,modifiers={}){
 return {
  critRate:Math.max(0,Math.min(1,HIT_BASE.critRate+finite(state.critRateBonus)+finite(modifiers.critRate))),
  critDamage:Math.max(2,HIT_BASE.critDamage+finite(state.critDamageBonus)+finite(modifiers.critDamage)),
  multiHitRate:Math.max(0,Math.min(MAX_MULTI_HIT_CHANCE,HIT_BASE.multiHitRate+finite(state.multiHitBonus)+finite(modifiers.multiHitRate)))
 };
}
