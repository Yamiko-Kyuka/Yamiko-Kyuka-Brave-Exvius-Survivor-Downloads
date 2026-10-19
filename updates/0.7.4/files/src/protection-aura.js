import {enemyBounds} from './enemy-geometry.js';
/** Open ribbons, rising motes and a small resistance seal; no enclosing bubble. */
export function drawProtectionAura(ctx,c,ox,oy,color='#93d9ff'){
 if(!c||c.phase==='pull'||c.phase==='combat'||c.boss.hp<=0)return;
 const b=c.boss,box=enemyBounds(b),width=box?box.right-box.left:b.size*.85,height=box?box.bottom-box.top:b.size;
 const x=(box?(box.left+box.right)/2:b.x)+ox,y=(box?box.bottom:b.y)+oy,clock=c.clock||0;
 ctx.save();ctx.lineWidth=2;ctx.strokeStyle=color;ctx.fillStyle=color;
 for(let i=0;i<7;i++){
  const phase=(clock*.42+i/7)%1,px=x+Math.sin(i*2.4+clock*.7)*width*.55,py=y-height*phase;
  ctx.globalAlpha=Math.sin(phase*Math.PI)*.65;ctx.beginPath();ctx.moveTo(px-3,py+9);ctx.lineTo(px,py);ctx.lineTo(px+3,py+9);ctx.stroke();
 }
 for(const sign of [-1,1]){ctx.globalAlpha=.28;ctx.beginPath();ctx.moveTo(x+sign*width*.2,y-8);ctx.bezierCurveTo(x+sign*width*.7,y-height*.3,x+sign*width*.3,y-height*.55,x+sign*width*.55,y-height*.8);ctx.stroke();}
 const py=y-height-22;ctx.globalAlpha=.95;ctx.fillStyle='#081529dd';ctx.fillRect(x-34,py-14,68,22);ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(x-24,py-9);ctx.lineTo(x-14,py-9);ctx.lineTo(x-14,py-2);ctx.lineTo(x-19,py+3);ctx.lineTo(x-24,py-2);ctx.closePath();ctx.stroke();ctx.font='bold 12px Arial,sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText('−90 %',x-9,py-3);ctx.restore();
}
