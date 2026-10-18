import {raidMechanics} from './raid-design.js';
import {equipmentEffects} from './model.js';

export const bossRanks=[
 {id:'D',threshold:0,multiplier:1,color:'#c7d0e4'},
 {id:'C',threshold:35,multiplier:1.15,color:'#72e4b0'},
 {id:'B',threshold:50,multiplier:1.35,color:'#7dbaff'},
 {id:'A',threshold:65,multiplier:1.6,color:'#bf9aff'},
 {id:'S',threshold:80,multiplier:2,color:'#ffdc78'},
 {id:'SS',threshold:90,multiplier:2.5,color:'#ffbb75'},
 {id:'SSS',threshold:97,multiplier:3,color:'#fff0ac'}
];
const clamp=n=>Math.max(0,Math.min(1,n));
const mechanicPar={ram:14,break:10,ordered:16,'meteor-core':25,thermal:18,souls:28,shelter:20,carry:18,procession:18,channel:12};
export function beginBossRating(s,c){
 const count=c.profile?.mechanics?.length||1,segments=c.boss.segmentCount||2;
 c.rating={seconds:0,mechanicSeconds:0,damageTaken:0,maxHp:Math.max(1,s.maxHp||s.hp||1),solved:0,required:c.scripted?count*segments:1};
}
export function tickBossRating(c,dt){
 if(!c.rating||c.phase==='pull'||c.boss.hp<=0)return;
 c.rating.seconds+=Math.max(0,dt);
 if(c.phase==='mechanic'||c.phase==='false-death')c.rating.mechanicSeconds+=Math.max(0,dt);
}
export function recordBossDamage(s,damage){
 const rating=s.crystalEncounter?.rating;if(rating&&Number.isFinite(damage))rating.damageTaken+=Math.min(Math.max(0,s.hp),Math.max(0,damage));
}
export function recordBossMechanic(c){if(!c.rating)return;c.rating.solvedKeys??=new Set();const key=(c.segmentIndex||0)+':'+(c.mechanicIndex||0);c.rating.solvedKeys.add(key);c.rating.solved=c.rating.solvedKeys.size;}
export function bossRatingResult(s,c){
 const m=c.rating||{seconds:c.clock||0,mechanicSeconds:0,damageTaken:0,maxHp:s.maxHp||1,solved:0,required:1};
 const count=c.profile?.mechanics?.length||1,rank=c.rules?.rank||c.tuning?.rank||0;
 // Budgets include travel, native telegraphs and every repeated life segment.
 const mechanicBudget=(c.profile?.mechanics||[]).reduce((n,id)=>n+(mechanicPar[raidMechanics[id]?.kind]||16),0)||count*(c.final?18:16);
 const mechanicTarget=mechanicBudget*(c.scripted?(c.boss.segmentCount||2):1)*(1+rank*.05);
 const timeTarget=mechanicTarget+(c.final?40:24)+rank*3;
 const speed=clamp(1-Math.max(0,m.seconds-timeTarget)/(timeTarget*1.5));
 const execution=clamp(m.solved/Math.max(1,m.required))*clamp(1-Math.max(0,m.mechanicSeconds-mechanicTarget)/mechanicTarget);
 const safety=clamp(1-m.damageTaken/m.maxHp);
 const score=Math.max(0,Math.min(100,Math.round(40*speed+35*execution+25*safety-(c.failures||0)*3)));
 const tier=bossRanks.findLast(t=>score>=t.threshold),mods=equipmentEffects(s),reward=Math.max(0,s.difficulty?.reward||1);
 const xp=Math.max(1,Math.floor((c.final?50:20)*tier.multiplier*reward*(s.experienceMultiplier||1)*mods.experience));
 const gils=Math.max(1,Math.floor((c.final?750:250)*tier.multiplier*reward*(s.gilsMultiplier||1)*mods.gils));
 return {bossId:c.kind||c.boss.achievementId||c.boss.id,name:c.boss.name,at:c.scheduledAt||(c.final?360:120),rank:tier.id,tier:bossRanks.indexOf(tier),color:tier.color,multiplier:tier.multiplier,score,xp,gils,seconds:m.seconds,mechanicSeconds:m.mechanicSeconds,damageTaken:m.damageTaken,mechanicsSolved:m.solved,mechanicsRequired:m.required,failures:c.failures||0};
}
export function awardBossRating(s,c){
 if(c.ratingAward)return c.ratingAward;
 const result=bossRatingResult(s,c);c.ratingAward=result;
 s.bossRatings??=[];s.bossRatings.push(result);s.lastBossRating=result;
 s.xp=(s.xp||0)+result.xp;s.bossBonusGils=(s.bossBonusGils||0)+result.gils;
 return result;
}
