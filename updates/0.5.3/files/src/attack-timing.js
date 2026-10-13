import {weapons,equipmentEffects} from './model.js';
import {clipDuration} from './animation.js';
/** One shared cadence for weapon cooldowns and the entire native attack sequence. */
export function weaponInterval(s,equipped){return Math.max(.12,weapons[equipped.id].cooldown*(s.cooldown??1)*equipmentEffects(s).cooldown*(1-Math.min(7,(equipped.level||1)-1)*.03));}
export function attackDuration(sequence){return sequence.reduce((time,clip)=>time+clipDuration(clip),0);}
export function attackPlaybackRate(s,action=s.action){return action.nativeDuration/(weaponInterval(s,s.weapons[0])*.9);}
export function advanceAttackAnimation(s,dt,ready,strike){
 const action=s.action,anim=s.anim;if(action?.event!=='attack')return false;
 let remaining=dt,steps=0;
 while(remaining>0&&s.action===action&&anim.busy&&steps++<anim.sequence.length+2){
  const clip=anim.clip;if(!ready(clip,anim.elapsed))break;
  const rate=attackPlaybackRate(s,action),nativeStep=Math.min(clipDuration(clip)-anim.elapsed,remaining*rate);
  // Strike while crossing the actual attack frame, even when a fast frame spans a clip boundary.
  if(!action.hit&&/^atk\d*$/.test(clip.state)&&anim.elapsed+nativeStep>=clipDuration(clip)*.35){action.hit=true;strike();}
  anim.update(nativeStep);remaining-=nativeStep/rate;
 }
 return true;
}
