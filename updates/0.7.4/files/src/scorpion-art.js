const TAU=Math.PI*2;
function line(ctx,points,color,width=2){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function poly(ctx,points,fill,stroke){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
function ellipse(ctx,x,y,rx,ry,fill,stroke){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
export function drawScorpionObject(ctx,o,clock,{done=false,hp=1}={}){
 if(!o.art?.startsWith('scorpion-'))return false;
 const x=o.x,y=o.y,col=done?'#7a8b87':o.art==='scorpion-generator'?'#9ee9ff':'#ffb982';
 ctx.save();ellipse(ctx,x+8,y+12,45,18,'#020b1999');
 if(o.art==='scorpion-generator'||o.art==='scorpion-relay'){
  poly(ctx,[[x-28,y-10],[x-24,y-64],[x+24,y-64],[x+28,y-10]],'#243e44','#9aabb0');
  ctx.fillStyle=done?'#354946':'#326b81';ctx.fillRect(x-15,y-57,30,44);
  for(let i=0;i<4;i++){ellipse(ctx,x,y-52+i*11,24,8,null,done?'#6f7f7e':'#b9a37b');line(ctx,[[x-22,y-52+i*11],[x-22,y-47+i*11]],col,3);}
  if(!done){const glow=ctx.createRadialGradient(x,y-37,4,x,y-37,62);glow.addColorStop(0,'#a5eeff55');glow.addColorStop(1,'#a5eeff00');ctx.fillStyle=glow;ctx.fillRect(x-62,y-99,124,124);line(ctx,[[x,y-59],[x-7,y-38],[x+6,y-29],[x,y-13]],'#e1fbff',3);}
  else line(ctx,[[x-13,y-59],[x+4,y-44],[x-6,y-27],[x+15,y-12]],'#071b22',6);
  poly(ctx,[[x-34,y-6],[x-22,y-16],[x+22,y-16],[x+34,y-6],[x+28,y+9],[x-28,y+9]],'#526468','#b0b7a0');
 }else{
  poly(ctx,[[x-34,y-13],[x-21,y-57],[x+3,y-67],[x+23,y-51],[x+36,y-12],[x+22,y+10],[x-24,y+10]],done?'#3b4342':'#81493c','#c4b7a3');
  line(ctx,[[x-12,y-54],[x+14,y-18]],'#142a32',16);line(ctx,[[x-12,y-54],[x+14,y-18]],'#9caba8',7);
  ellipse(ctx,x-12,y-55,14,14,'#263b41',col);ellipse(ctx,x+13,y-18,12,12,'#263b41',col);
  for(const dx of [-18,0,18])poly(ctx,[[x+dx-7,y+1],[x+dx+8,y+1],[x+dx+12,y+16],[x+dx-10,y+16]],'#74817b','#c2c6ad');
  if(!done){line(ctx,[[x+13,y-47],[x+26,y-38],[x+23,y-24]],'#a5ffc8',3);if(Math.sin(clock*5)>0)ellipse(ctx,x+23,y-31,4,4,'#c2ffe2');}
  else line(ctx,[[x-25,y-42],[x+17,y-6]],'#091b22',6);
 }
 if(!done&&o.shielded){for(const sign of [-1,1])poly(ctx,[[x+sign*8,y-65],[x+sign*30,y-48],[x+sign*26,y-7],[x+sign*8,y-20]],'#24343ef2','#879ea6');}
 if(!done&&o.exposedUntil>clock){ctx.strokeStyle='#ffc385';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y-25,36,-Math.PI/2,-Math.PI/2+TAU*Math.min(1,(o.exposedUntil-clock)/6));ctx.stroke();}
 if(!done&&o.art!=='scorpion-relay'){ctx.fillStyle='#07121d';ctx.fillRect(x-31,y+23,62,7);ctx.fillStyle=col;ctx.fillRect(x-30,y+24,60*hp,5);}
 ctx.restore();return true;
}
export function drawScorpionCovers(ctx,c,ox,oy){
 if(c.kind!=='scorpion')return;
 for(const o of c.scorpionCovers||[]){const x=o.x+ox,y=o.y+oy;ctx.save();
  if(o.broken){for(let i=0;i<9;i++){ctx.fillStyle=i%2?'#61736e':'#263b35';ctx.fillRect(x-55+(i*23)%100,y-16+(i*13)%38,18,8);}ctx.restore();continue;}
  if(!o.solid){ctx.globalAlpha=.4;ctx.setLineDash([7,5]);ctx.strokeStyle='#e6ce93';ctx.lineWidth=2;ctx.strokeRect(x-64,y-32,128,64);ctx.setLineDash([]);ctx.globalAlpha=.65;ctx.translate(0,-Math.max(0,o.landingAt-c.clock)*170);}
  ellipse(ctx,x+7,y+23,74,24,'#030d1699');
  poly(ctx,[[x-64,y-28],[x+40,y-36],[x+64,y+6],[x+52,y+35],[x-50,y+35],[x-68,y+10]],'#344b48','#93a19a');
  poly(ctx,[[x-64,y-28],[x+40,y-36],[x+64,y+6],[x-49,y+5]],'#647872','#c3c6a4');
  line(ctx,[[x-51,y-21],[x-26,y+27]],'#202f2d',8);line(ctx,[[x+21,y-27],[x+42,y+27]],'#202f2d',8);
  poly(ctx,[[x-13,y-25],[x+13,y-27],[x+25,y-4],[x-3,y-2]],'#d7c986','#333d32');
  line(ctx,[[x-2,y-22],[x+10,y-9]],'#3b4735',4);line(ctx,[[x-39,y+13],[x+29,y+13]],'#9db4a5',3);
  for(const dx of [-40,38])ellipse(ctx,x+dx,y-13,4,4,'#d0d0b5');
  ctx.restore();
 }
}
function laserShape(ctx,c,a,ox,oy,active){
 const x=a.x+ox,y=a.y+oy,length=c.arenaHalf*3,half=a.halfAngle||.43;
 ctx.save();if(c.raidBaseTerrain){ctx.beginPath();for(const cell of c.raidBaseTerrain.floor){const p=c.raidBaseTerrain.center(cell);ctx.rect(p.x+ox-32,p.y+oy-32,64,64);}ctx.clip();}
 ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,length,a.angle-half,a.angle+half);ctx.closePath();ctx.clip();
 // Clip the solid debris shadows out of both the light cone and its core.
 ctx.beginPath();ctx.rect(x-length,y-length,length*2,length*2);
 for(const o of c.scorpionCovers||[])if(o.solid&&!o.broken){
  const center=Math.atan2(o.y-a.y,o.x-a.x),angles=[[-64,-32],[64,-32],[64,32],[-64,32]].map(([dx,dy])=>Math.atan2(Math.sin(Math.atan2(o.y+dy-a.y,o.x+dx-a.x)-center),Math.cos(Math.atan2(o.y+dy-a.y,o.x+dx-a.x)-center)));
  const low=center+Math.min(...angles),high=center+Math.max(...angles),near=Math.max(15,Math.hypot(o.x-a.x,o.y-a.y)-70);
  ctx.moveTo(x+Math.cos(low)*near,y+Math.sin(low)*near);ctx.lineTo(x+Math.cos(low)*length,y+Math.sin(low)*length);ctx.lineTo(x+Math.cos(high)*length,y+Math.sin(high)*length);ctx.lineTo(x+Math.cos(high)*near,y+Math.sin(high)*near);ctx.closePath();
 }
 ctx.clip('evenodd');
 const gradient=ctx.createRadialGradient(x,y,10,x,y,length);gradient.addColorStop(0,active?'#f1fdff':'#83d5ff');gradient.addColorStop(.5,active?'#9ce5ff':'#6fc4f2');gradient.addColorStop(1,'#3574a8');ctx.fillStyle=gradient;ctx.globalAlpha=active?.62:.09;ctx.fillRect(x-length,y-length,length*2,length*2);
 ctx.globalAlpha=active?.95:.7;
 for(const sign of [-1,1])line(ctx,[[x,y],[x+Math.cos(a.angle+sign*half)*length,y+Math.sin(a.angle+sign*half)*length]],active?'#c4f6ff':'#88c9ee',active?3:2);
 if(active){ctx.globalAlpha=.65;line(ctx,[[x,y],[x+Math.cos(a.angle)*length,y+Math.sin(a.angle)*length]],'#8edbff',104+Math.sin(c.clock*19)*6);ctx.globalAlpha=.95;line(ctx,[[x,y],[x+Math.cos(a.angle)*length,y+Math.sin(a.angle)*length]],'#d7f7ff',66);line(ctx,[[x,y],[x+Math.cos(a.angle)*length,y+Math.sin(a.angle)*length]],'#fff',18);}
 ctx.restore();
}
export function drawScorpionCast(ctx,c,a,ox,oy,active=false){
 if(a.type!=='scorpion-tail'&&a.type!=='scorpion-emp')return false;
 const x=a.x+ox,y=a.y+oy,progress=Math.max(0,Math.min(1,(c.clock-a.born)/a.windup));
 ctx.save();
 if(a.type==='scorpion-tail'){
  laserShape(ctx,c,a,ox,oy,active);const pulse=1+Math.sin(c.clock*11)*.08;
  ellipse(ctx,x,y-c.boss.size*.45,25*pulse,18*pulse,'#80dcff33','#b3efff');
  line(ctx,[[x-16,y-c.boss.size*.45],[x+17,y-c.boss.size*.45]],'#e0faff',3);
  ctx.font='600 15px Cinzel,Georgia,serif';ctx.textAlign='center';ctx.strokeStyle='#061720';ctx.lineWidth=4;ctx.fillStyle='#d5f6ff';const label='Laser caudal ciblé · '+Math.max(0,a.windup-(c.clock-a.born)).toFixed(1)+' s';ctx.strokeText(label,x,y-c.boss.size*.9);ctx.fillText(label,x,y-c.boss.size*.9);
 }else{
  ctx.globalAlpha=active?.28:.12;ellipse(ctx,x,y,a.radius,a.radius,'#7ff6d3');ctx.globalAlpha=.9;ctx.strokeStyle=active?'#dcfff2':'#8cebcf';ctx.lineWidth=active?5:3;ctx.beginPath();ctx.arc(x,y,a.radius,0,TAU);ctx.stroke();
  for(let i=0;i<12;i++){const angle=i*TAU/12;line(ctx,[[x+Math.cos(angle)*a.radius*.9,y+Math.sin(angle)*a.radius*.9],[x+Math.cos(angle)*a.radius,y+Math.sin(angle)*a.radius]],'#c2fff0',2);}
  ctx.beginPath();ctx.arc(x,y,a.radius+6,-Math.PI/2,-Math.PI/2+TAU*progress);ctx.stroke();
 }
 ctx.restore();return true;
}
export function drawScorpionLasers(ctx,c,ox,oy){for(const a of c.scorpionLasers||[]){laserShape(ctx,c,a,ox,oy,true);ctx.save();ctx.font='600 15px Cinzel,Georgia,serif';ctx.textAlign='center';ctx.strokeStyle='#071824';ctx.lineWidth=4;ctx.fillStyle='#e4faff';const label='Laser caudal · '+Math.max(0,a.expires-c.clock).toFixed(1)+' s',x=c.boss.x+ox,y=c.boss.y+oy-c.boss.size*.9;ctx.strokeText(label,x,y);ctx.fillText(label,x,y);ctx.restore();}}
export function drawScorpionArenaDetails(ctx,c,ox,oy){
 if(c.kind!=='scorpion')return;
 const x=c.center.x+ox,y=c.center.y+oy,hot=c.segmentIndex>0;
 ctx.save();
 // Mako light stays at the architectural perimeter, leaving a quiet combat floor.
 for(const sign of [-1,1]){
  const px=x+sign*540,py=y-480;ellipse(ctx,px,py+55,66,18,'#020d1399');ctx.fillStyle='#192f2b';ctx.fillRect(px-52,py-126,104,180);ellipse(ctx,px,py-126,52,19,'#546e60','#9cae8f');
  const g=ctx.createLinearGradient(px-35,py,px+35,py);g.addColorStop(0,'#286447');g.addColorStop(.5,'#8cd6a0');g.addColorStop(1,'#285c41');ctx.fillStyle=g;ctx.fillRect(px-35,py-117,70,152);
  for(let j=0;j<4;j++)line(ctx,[[px-46,py-100+j*43],[px+46,py-100+j*43]],'#6e8270',7);
  line(ctx,[[px,py+40],[px,py+103],[px-sign*75,py+103]],'#465d50',13);line(ctx,[[px-9,py-124],[px-9,py+35]],'#b7e8b46b',3);
  const lampX=x+sign*430,lampY=y+350;ctx.fillStyle='#152820';ctx.fillRect(lampX-15,lampY-12,30,24);ctx.fillStyle=hot?'#ff765c':'#86dda5';ctx.globalAlpha=.6+.3*Math.sin(c.clock*(hot?8:2));ctx.fillRect(lampX-10,lampY-7,20,14);ctx.globalAlpha=1;
 }
 if(hot){for(const sign of [-1,1])for(let i=0;i<4;i++){const px=x+sign*(390+i*16),py=y-300+i*175;ctx.globalAlpha=.3;poly(ctx,[[px-9,py],[px-4,py-13-Math.sin(c.clock*7+i)*5],[px+2,py-5],[px+7,py-19],[px+11,py]],'#ffb472');}ctx.globalAlpha=1;}
 if(c.phase==='mechanic'&&c.segmentIndex){
  for(const o of c.raidObjects||[])if(!o.done){ctx.globalAlpha=.55;line(ctx,[[o.x+ox,o.y+oy-35],[x,y-c.boss.size*.3]],'#a4ffd0',2);}
  ctx.globalAlpha=1;
 }
 for(const o of c.scorpionRelays||[]){
  const px=o.x+ox,py=o.y+oy,generator=c.raidObjects?.[0];
  ctx.globalAlpha=o.done?.2:o.active?.9:.35;line(ctx,[[px,py],[px,y-115],[x,y-115]],o.done?'#a5d5ba':o.active?'#bdefff':'#557386',o.active?3:2);ctx.globalAlpha=1;
  drawScorpionObject(ctx,{...o,x:px,y:py,shielded:!o.active&&!o.done},c.clock,{done:o.done});
  if(o.active&&!o.done){ctx.strokeStyle='#b5efff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(px,py-37,37,c.clock*1.5,c.clock*1.5+Math.PI*1.4);ctx.stroke();}
  if(generator&&!generator.done&&Number.isFinite(c.scorpionGeneratorUntil)){ctx.fillStyle='#d7f3ff';ctx.font='600 13px Cinzel,Georgia,serif';ctx.textAlign='center';ctx.fillText(Math.max(0,c.scorpionGeneratorUntil-c.clock).toFixed(1)+' s',generator.x+ox,generator.y+oy-80);}
 }
 if(c.scorpionLastTargets)for(const o of c.scorpionLastTargets)drawScorpionObject(ctx,{...o,x:o.x+ox,y:o.y+oy},c.clock,{done:true});
 if(c.phase==='mechanic'&&c.segmentIndex){ctx.textAlign='center';ctx.font='600 14px Cinzel,Georgia,serif';ctx.lineWidth=4;ctx.strokeStyle='#071c1a';ctx.fillStyle='#c4ffdc';const remaining=c.firstKillAt===null?null:Math.max(0,(c.scorpionRules?.sync||8)-(c.clock-c.firstKillAt));const label='Auto-réparation'+(remaining===null?'':' · '+remaining.toFixed(1)+' s');ctx.strokeText(label,x,y-c.boss.size*.92);ctx.fillText(label,x,y-c.boss.size*.92);}
 ctx.restore();drawScorpionCovers(ctx,c,ox,oy);
}
