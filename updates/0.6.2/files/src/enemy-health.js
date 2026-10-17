import {clipFor} from './animation.js';

export function eliteHealthLayout(enemy,scale,zoom=1,ox=0,oy=0){
 if(!enemy.elite||enemy.superboss||enemy.miniboss||enemy.dying||enemy.hp<=0||!(enemy.maxHp>0))return null;
 const idle=clipFor(enemy.variant,'idle')||clipFor(enemy.variant,'standby'),clip=enemy.anim?.clip;
 const top=definition=>definition?.frames?.length?Math.min(...definition.frames.map(frame=>frame[3]-definition.anchor[1]))*scale:-(enemy.size||40);
 const width=80/zoom,height=7/zoom;
 return {x:enemy.x+ox-width/2,y:enemy.y+oy+Math.min(top(idle),top(clip))-14/zoom,width,height,ratio:Math.max(0,Math.min(1,enemy.hp/enemy.maxHp))};
}

/** A screen-sized gauge follows the real animation bounds, including tall attacks. */
export function drawEliteHealth(ctx,enemy,scale,zoom,ox,oy){
 const bar=eliteHealthLayout(enemy,scale,zoom,ox,oy);if(!bar)return;
 const pixel=1/zoom;
 ctx.save();ctx.globalAlpha=1;ctx.fillStyle='#080e23';ctx.fillRect(bar.x-pixel*2,bar.y-pixel*2,bar.width+pixel*4,bar.height+pixel*4);
 ctx.fillStyle='#332b3d';ctx.fillRect(bar.x,bar.y,bar.width,bar.height);
 ctx.fillStyle='#dd727b';ctx.fillRect(bar.x,bar.y,bar.width*bar.ratio,bar.height);
 ctx.strokeStyle='#e7c882';ctx.lineWidth=pixel;ctx.strokeRect(bar.x-pixel*.5,bar.y-pixel*.5,bar.width+pixel,bar.height+pixel);ctx.restore();
}
