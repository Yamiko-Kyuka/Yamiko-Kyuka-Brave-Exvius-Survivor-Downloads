import {clipFor} from './animation.js';
import {drawMeteorCountdown} from './xande-meteors.js';
/** Anchor to the idle model, never to a weapon, spell or moving animation frame. */
export function heroBarLayout(state,width,height){
 const idle=clipFor(state.variant,'idle')||clipFor(state.variant,'standby'),first=idle?.frames[0];
 const scale=first?52/Math.max(10,first[5]):1;
 const top=idle?Math.min(...idle.frames.map(rect=>rect[3]-idle.anchor[1]))*scale:-52;
 return {x:Math.round(width/2-32),y:Math.max(62,Math.round(height/2+top*state.zoom-28)),width:64,height:8};
}
export function drawHeroBars(ctx,state,width,height){
 const {x,y}=heroBarLayout(state,width,height),health=Math.max(0,Math.min(1,state.hp/state.maxHp)),xp=Math.max(0,Math.min(1,(state.xp||0)/Math.max(1,state.nextXp||1)));
 ctx.save();ctx.globalAlpha=1;ctx.textAlign='center';ctx.textBaseline='bottom';ctx.font='bold 11px Arial, sans-serif';ctx.strokeStyle='#080f20';ctx.lineWidth=3;
 const label='NIV. '+Math.max(1,Math.floor(state.level||1));ctx.strokeText(label,x+32,y-5);ctx.fillStyle='#ffdf98';ctx.fillText(label,x+32,y-5);
 ctx.fillStyle='#080f20';ctx.fillRect(x-2,y-2,68,24);
 ctx.fillStyle='#26344a';ctx.fillRect(x,y,64,8);ctx.fillStyle=health<=.25?'#f36c70':health<=.5?'#f0c663':'#72dda5';ctx.fillRect(x,y,64*health,8);
 ctx.fillStyle='#1c294b';ctx.fillRect(x,y+12,64,8);ctx.fillStyle='#79bdff';ctx.fillRect(x,y+12,64*xp,8);
 ctx.strokeStyle='#dfc586';ctx.lineWidth=1;ctx.strokeRect(x-.5,y-.5,65,9);ctx.strokeStyle='#9fbbe5';ctx.strokeRect(x-.5,y+11.5,65,9);
 ctx.restore();drawMeteorCountdown(ctx,state,width/2,y-20);
}
