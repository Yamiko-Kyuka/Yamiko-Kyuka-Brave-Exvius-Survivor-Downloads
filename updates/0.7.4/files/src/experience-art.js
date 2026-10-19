const sprites=new Map();
function crystalSprite(elite){
 if(sprites.has(elite))return sprites.get(elite);
 const image=document.createElement('canvas');image.width=40;image.height=48;const c=image.getContext('2d');
 const glow=c.createRadialGradient(20,25,1,20,25,19);glow.addColorStop(0,elite?'#f1d18b66':'#75efdf66');glow.addColorStop(1,'#00000000');c.fillStyle=glow;c.fillRect(0,5,40,40);
 c.fillStyle='#071e30';c.beginPath();c.moveTo(20,4);c.lineTo(31,19);c.lineTo(29,32);c.lineTo(20,43);c.lineTo(11,32);c.lineTo(9,19);c.closePath();c.fill();
 c.fillStyle=elite?'#d1b356':'#55c9c2';c.beginPath();c.moveTo(20,7);c.lineTo(28,20);c.lineTo(26,31);c.lineTo(20,39);c.lineTo(14,31);c.lineTo(12,20);c.closePath();c.fill();
 c.fillStyle=elite?'#fff0b1':'#d6fffb';c.beginPath();c.moveTo(20,7);c.lineTo(20,24);c.lineTo(12,20);c.closePath();c.fill();
 c.fillStyle=elite?'#e7cd79':'#8fe9df';c.beginPath();c.moveTo(20,7);c.lineTo(28,20);c.lineTo(20,24);c.closePath();c.fill();
 c.fillStyle=elite?'#94703b':'#277e94';c.beginPath();c.moveTo(20,24);c.lineTo(26,31);c.lineTo(20,39);c.closePath();c.fill();
 c.strokeStyle=elite?'#fff4b8':'#bbfff3';c.lineWidth=1;c.beginPath();c.moveTo(14,31);c.lineTo(20,39);c.lineTo(26,31);c.stroke();
 sprites.set(elite,image);return image;
}
/** Glow and facets are drawn once into tiny cached sprites, never blurred per gem per frame. */
export function drawExperienceCrystals(ctx,s,ox,oy){
 const halfW=ctx.canvas.width/(2*s.zoom)+30,halfH=ctx.canvas.height/(2*s.zoom)+30;
 ctx.save();ctx.imageSmoothingEnabled=false;
 for(const g of s.gems){
  if(Math.abs(g.x-s.x)>halfW||Math.abs(g.y-s.y)>halfH)continue;
  const elite=(g.value||1)>=8,seed=Math.abs(g.x*.013+g.y*.019),bob=Math.sin(s.time*2.4+seed)*2,scale=elite?.82:.62,w=40*scale,h=48*scale,x=Math.round(g.x+ox),y=Math.round(g.y+oy+bob);
  if(g.magnetized){const angle=Math.atan2(s.y-g.y,s.x-g.x);ctx.strokeStyle='#c4f6ff88';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-Math.cos(angle)*9,y-Math.sin(angle)*9);ctx.lineTo(x-Math.cos(angle)*22,y-Math.sin(angle)*22);ctx.stroke();}
  ctx.drawImage(crystalSprite(elite),Math.round(x-w/2),Math.round(y-h*.62),w,h);
  const phase=(s.time*1.5+seed)%2;
  if(phase<.25){ctx.globalAlpha=Math.sin(phase/.25*Math.PI);ctx.fillStyle=elite?'#fff1b8':'#e1fff9';ctx.fillRect(x+5,y-12,2,7);ctx.fillRect(x+3,y-10,6,2);ctx.globalAlpha=1;}
 }
 ctx.restore();
}
