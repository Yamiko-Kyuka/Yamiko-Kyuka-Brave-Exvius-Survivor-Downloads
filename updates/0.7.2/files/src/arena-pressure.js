import {recordBossDamage} from './boss-rating.js';
import {mitigatedDamage} from './permanent-upgrades.js';
import {playerRadius} from './hitboxes.js';
export const arenaPalettes={midgar:{color:'#63d993',name:'Mako instable'},zanarkand:{color:'#8b73d8',name:'Brume des priants'},'crystal-tower':{color:'#af79d5',name:'Corruption du cristal'},'dark-world':{color:'#9878cc',name:'Néant envahissant'}};
export function hurtInArena(s,damage){if(s.invuln>0||s.godMode||s.ending||s.over)return false;const received=mitigatedDamage(s,damage*s.difficulty.damage);recordBossDamage(s,received);s.hp-=received;s.invuln=.65;return true;}
/** An encounter clock, never the paused stage clock. Threat fills the arena by two minutes. */
export function tickArenaPressure(s,c,dt){
 if(c.redesigned){const end=c.rules.enrage,start=end*.65,progress=Math.max(0,Math.min(1,(c.clock-start)/(end-start)));c.enrageProgress=progress;c.safeHalf=c.arenaHalf*(1-progress*.88);if(c.clock>=end)hurtInArena(s,s.maxHp*.4);else if(progress>0&&(Math.abs(s.x-c.center.x)>c.safeHalf||Math.abs(s.y-c.center.y)>c.safeHalf))hurtInArena(s,s.maxHp*.16);return;}

 // Xande's longer placement sequence needs room for both full cycles before enrage.
 const meteorEncounter=c.profile?.mechanics?.includes('meteor-seals');
 const half=c.arenaHalf||384,start=meteorEncounter?95:c.final?45:35,end=c.final?150:120;
 const elapsed=Math.max(0,Math.min(1,(c.clock-start)/(end-start)));
 c.enrageProgress=c.final?elapsed*elapsed:elapsed;
 c.safeHalf=half*(1-c.enrageProgress);
 if(c.enrageProgress>0&&(Math.abs(s.x-c.center.x)+playerRadius(s)>c.safeHalf||Math.abs(s.y-c.center.y)+playerRadius(s)>c.safeHalf))hurtInArena(s,Math.max(12,s.maxHp*.18));
 if(!c.scripted){for(const p of c.pools||[])p.radius=Math.min(65,26+Math.max(0,p.age-15)*1.3);return;}
 // Ground hazards come only from actual boss attacks (for example missed meteors).
 // Never place passive puddles under the player merely because time passed.
 c.groundHazards??=[];
 for(const p of c.groundHazards){const age=c.clock-p.born;p.radius=Math.min(65,(p.baseRadius||26)+Math.max(0,age-15)*1.3);if(age>.85&&Math.hypot(s.x-p.x,s.y-p.y)<p.radius+playerRadius(s))hurtInArena(s,9);}
}
export function drawArenaPressure(ctx,s,ox,oy){
 const c=s.crystalEncounter;if(!c)return;const palette=c.scripted?arenaPalettes[s.stage.id]:{color:'#87b94c',name:'Poison'},half=c.arenaHalf||384,x=c.center.x+ox,y=c.center.y+oy,safe=c.safeHalf??half;
 ctx.save();
 for(const p of c.groundHazards||[]){const warning=c.clock-p.born<.85;ctx.fillStyle=palette.color;ctx.globalAlpha=warning?.12:.38;ctx.beginPath();ctx.arc(p.x+ox,p.y+oy,p.radius,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.85;ctx.lineWidth=2;ctx.strokeStyle=palette.color;if(warning)ctx.setLineDash([5,5]);ctx.stroke();ctx.setLineDash([]);}
 if(c.enrageProgress>0){ctx.fillStyle=palette.color;ctx.globalAlpha=.42;ctx.fillRect(x-half,y-half,half*2,half-safe);ctx.fillRect(x-half,y+safe,half*2,half-safe);ctx.fillRect(x-half,y-safe,half-safe,safe*2);ctx.fillRect(x+safe,y-safe,half-safe,safe*2);ctx.globalAlpha=.9;ctx.lineWidth=3;ctx.strokeStyle='#ef7b8b';ctx.strokeRect(x-safe,y-safe,safe*2,safe*2);}
 ctx.restore();
}
