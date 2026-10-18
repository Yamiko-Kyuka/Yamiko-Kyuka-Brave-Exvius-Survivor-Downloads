import {TILE,SIZE,ORIGIN} from './terrain.js';
export const raidPalettes={
 mako:{floor:'#243644',edge:'#77989b',metal:'#40535e',light:'#79f1c4',dark:'#101e2b'},steel:{floor:'#293847',edge:'#a6acaa',metal:'#52626b',light:'#edc07e',dark:'#141c29'},bio:{floor:'#243b49',edge:'#739da4',metal:'#466370',light:'#9ef2dd',dark:'#0c1c2d'},
 ruin:{floor:'#34464d',edge:'#a1b3ad',metal:'#657b82',light:'#c4ddb2',dark:'#102b36'},water:{floor:'#304751',edge:'#a6bec0',metal:'#69838c',light:'#a8dff1',dark:'#142838'},sunset:{floor:'#3d4249',edge:'#beac89',metal:'#7a7778',light:'#ffbd7e',dark:'#221f33'},
 crypt:{floor:'#2c3a4b',edge:'#9bb1b0',metal:'#536c7d',light:'#b6e397',dark:'#111d30'},astral:{floor:'#303d57',edge:'#9cb3d1',metal:'#63799f',light:'#c7b9ff',dark:'#151f3a'},imperial:{floor:'#383a52',edge:'#c6b387',metal:'#746986',light:'#ffe1a0',dark:'#201d35'},
 void:{floor:'#302b43',edge:'#ab9ab5',metal:'#665c78',light:'#e6b0ec',dark:'#151225'},frostfire:{floor:'#2d324a',edge:'#9aa8c2',metal:'#626d8e',light:'#b7ddfc',dark:'#191b32'},abyss:{floor:'#282e40',edge:'#9ca5ba',metal:'#5e6986',light:'#caf3b1',dark:'#111326'}
};
const backgrounds=new Map();
function poly(ctx,points,fill,stroke=null,width=2){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
function oval(ctx,x,y,rx,ry,fill,stroke=null,width=2){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
function line(ctx,points,color,width=2){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.stroke();}
function star(ctx,x,y,r,color){poly(ctx,[[x,y-r],[x+r*.3,y-r*.3],[x+r,y],[x+r*.3,y+r*.3],[x,y+r],[x-r*.3,y+r*.3],[x-r,y],[x-r*.3,y-r*.3]],color);}
function crystal(ctx,x,y,r,color){poly(ctx,[[x,y-r*1.7],[x+r*.65,y-r*.5],[x+r*.45,y+r*.45],[x,y+r],[x-r*.45,y+r*.45],[x-r*.65,y-r*.5]],color,'#091225',2);line(ctx,[[x,y-r*1.7],[x,y+r]],'#f1fbff99',2);line(ctx,[[x-r*.65,y-r*.5],[x+r*.65,y-r*.5]],'#effbff77');}
function pedestal(ctx,x,y,r,p){oval(ctx,x+8,y+10,r+12,(r+12)*.42,'#050c1c77');poly(ctx,[[x-r,y-10],[x+r,y-10],[x+r,y+8],[x,y+22],[x-r,y+8]],p.dark,p.edge);poly(ctx,[[x-r,y-10],[x,y-24],[x+r,y-10],[x,y+5]],p.metal,p.edge);}
export function drawRaidObject(ctx,obj,p,clock,{active=false,done=false,hp=1,hold=0}={}){
 const x=obj.x,y=obj.y,kind=obj.art||'prism',col=done?'#7da692':active?'#ffe5a5':obj.color||p.light;
 ctx.save();ctx.imageSmoothingEnabled=false;
 if(active){const g=ctx.createRadialGradient(x,y-18,5,x,y-18,86);g.addColorStop(0,col+'44');g.addColorStop(1,col+'00');ctx.fillStyle=g;ctx.fillRect(x-86,y-104,172,172);}
 pedestal(ctx,x,y,kind==='crane'?46:32,p);
 if(kind==='battery'){ctx.fillStyle=p.dark;ctx.fillRect(x-22,y-72,44,58);ctx.strokeStyle=p.edge;ctx.lineWidth=3;ctx.strokeRect(x-22,y-72,44,58);ctx.fillStyle=p.metal;ctx.fillRect(x-11,y-80,22,8);ctx.fillStyle=col;ctx.fillRect(x-13,y-62,26,30);ctx.strokeStyle='#e8f7e9';line(ctx,[[x-7,y-47],[x+7,y-47]],'#e8f7e9',3);line(ctx,[[x,y-54],[x,y-40]],'#e8f7e9',3);ctx.fillStyle='#b99d67';ctx.fillRect(x-21,y-22,42,8);}
 else if(kind==='valve'){
  ctx.fillStyle=p.dark;ctx.fillRect(x-15,y-65,30,56);ctx.fillStyle=p.metal;ctx.fillRect(x-10,y-61,20,48);line(ctx,[[x-37,y-31],[x-37,y-13],[x+37,y-13],[x+37,y-31]],p.edge,9);
  ctx.save();ctx.translate(x,y-61);ctx.rotate(done?Math.PI*.5:hold*Math.PI*2);oval(ctx,0,0,23,23,null,col,5);for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);line(ctx,[[0,0],[21,0]],col,4);}oval(ctx,0,0,6,6,p.dark,col);ctx.restore();
  if(done)for(let i=0;i<5;i++){const a=(clock*.8+i*.2)%1;oval(ctx,x+(i-2)*8,y-65-a*65,8+a*13,7+a*12,'#c6f2d3'+Math.round((1-a)*110).toString(16).padStart(2,'0'));}
 }else if(kind==='crane'){
  line(ctx,[[x-38,y-17],[x-38,y-124],[x+38,y-124],[x+38,y-17]],p.dark,12);line(ctx,[[x-38,y-17],[x-38,y-124],[x+38,y-124],[x+38,y-17]],p.edge,5);ctx.fillStyle=p.metal;ctx.fillRect(x-48,y-132,96,19);
  const drop=done?32:0;line(ctx,[[x,y-119],[x,y-72+drop]],col,4);ctx.fillStyle=p.metal;ctx.fillRect(x-25,y-71+drop,50,15);line(ctx,[[x-25,y-70+drop],[x+25,y-70+drop]],p.edge,3);oval(ctx,x,y-65+drop,19,12,null,col,6);line(ctx,[[x-19,y-65+drop],[x-19,y-48+drop],[x-9,y-43+drop]],col,6);line(ctx,[[x+19,y-65+drop],[x+19,y-48+drop],[x+9,y-43+drop]],col,6);star(ctx,x,y-6,10,col);
 }else if(kind==='pod'){
  oval(ctx,x,y-44,29,47,p.dark,col,3);oval(ctx,x,y-48,21,36,'#89d7bd44');for(let i=-1;i<=1;i++)line(ctx,[[x+i*8,y-80],[x+i*12,y-45],[x+i*4,y-12]],done?'#4c6666':col,3);if(!done)crystal(ctx,x,y-47,11,'#d0f2bb');else line(ctx,[[x-20,y-66],[x+4,y-47],[x-11,y-26],[x+15,y-10]],'#050b1d',7);
 }else if(['pillar','sun-pillar','gargoyle','effigy','statue','aeon','lighthouse','obelisk','candelabra'].includes(kind)){
  const tall=kind==='lighthouse'||kind==='obelisk',h=tall?120:92;
  if(done&&['pillar','sun-pillar','gargoyle'].includes(kind)){for(let i=0;i<8;i++){ctx.fillStyle=i%2?p.edge:p.metal;ctx.fillRect(x-30+(i*19)%57,y-17+(i*11)%27,15,9);}ctx.restore();return;}
  poly(ctx,[[x-18,y-14],[x-14,y-h],[x+14,y-h],[x+18,y-14]],p.metal,p.edge);ctx.fillStyle=p.edge;ctx.fillRect(x-23,y-h-6,46,13);ctx.fillRect(x-24,y-23,48,12);line(ctx,[[x-8,y-h+10],[x-8,y-31]],'#d9e4dd55',3);
  if(kind==='gargoyle'){poly(ctx,[[x-12,y-h-4],[x-42,y-h+12],[x-26,y-h+33],[x-5,y-h+24]],p.edge,p.dark);poly(ctx,[[x+12,y-h-4],[x+42,y-h+12],[x+26,y-h+33],[x+5,y-h+24]],p.edge,p.dark);oval(ctx,x,y-h+7,17,15,p.metal,p.edge);ctx.fillStyle=col;ctx.fillRect(x-11,y-h+3,6,5);ctx.fillRect(x+5,y-h+3,6,5);}
  else if(kind==='statue'||kind==='aeon'||kind==='effigy'){oval(ctx,x,y-h-9,16,17,p.edge,p.dark);poly(ctx,[[x-11,y-h+8],[x-30,y-39],[x+30,y-39],[x+11,y-h+8]],p.metal,p.edge);line(ctx,[[x-21,y-69],[x+21,y-69]],col,5);if(kind==='aeon'){poly(ctx,[[x-10,y-h-2],[x-48,y-h-26],[x-34,y-h+25]],p.edge);poly(ctx,[[x+10,y-h-2],[x+48,y-h-26],[x+34,y-h+25]],p.edge);}}
  else if(kind==='candelabra'){line(ctx,[[x-28,y-h+15],[x-28,y-h-11],[x+28,y-h-11],[x+28,y-h+15]],p.edge,5);for(let i=-1;i<=1;i++)star(ctx,x+i*25,y-h-20,9,done?col:'#7d8199');}
  else if(kind==='sun-pillar'){for(let i=0;i<8;i++){const a=i*Math.PI/4;line(ctx,[[x+Math.cos(a)*16,y-h-10+Math.sin(a)*16],[x+Math.cos(a)*30,y-h-10+Math.sin(a)*30]],col,4);}oval(ctx,x,y-h-10,17,17,p.dark,col,4);}
  else crystal(ctx,x,y-h-7,tall?20:15,col);
  if(done&&kind==='gargoyle')line(ctx,[[x+15,y-h],[x-8,y-h+26],[x+3,y-h+47],[x-12,y-24]],p.dark,5);
 }else if(kind==='coffin'){
  poly(ctx,[[x-23,y-90],[x+23,y-90],[x+32,y-70],[x+24,y-7],[x-24,y-7],[x-32,y-70]],p.metal,p.edge,3);line(ctx,[[x,y-76],[x,y-22]],col,4);line(ctx,[[x-14,y-59],[x+14,y-59]],col,4);if(done)poly(ctx,[[x-22,y-84],[x+17,y-96],[x+37,y-31],[x-4,y-20]],p.dark,p.edge);crystal(ctx,x-35,y-9,10,col);
 }else if(kind==='astrolabe'){
  ctx.save();ctx.translate(x,y-59);for(let i=0;i<3;i++){ctx.save();ctx.rotate(i*Math.PI/3+clock*.05);oval(ctx,0,0,35,16,null,done?'#4c5873':col,3);ctx.restore();}crystal(ctx,0,0,18,obj.exposed?'#fff1b1':col);ctx.restore();line(ctx,[[x-15,y-10],[x-5,y-46],[x+5,y-46],[x+15,y-10]],p.edge,5);
 }else if(kind==='crown'){
  poly(ctx,[[x-26,y-32],[x-32,y-67],[x-13,y-53],[x,y-80],[x+13,y-53],[x+32,y-67],[x+26,y-32]],col,p.dark,3);oval(ctx,x,y-32,26,8,p.metal,col,3);crystal(ctx,x,y-45,7,obj.color||col);
 }else if(kind==='heart'){
  const pulse=1+Math.sin(clock*4)*.06;ctx.save();ctx.translate(x,y-55);ctx.scale(pulse,pulse);poly(ctx,[[0,-21],[18,-29],[32,-13],[26,8],[0,33],[-26,8],[-32,-13],[-18,-29]],obj.color||col,p.edge,3);line(ctx,[[0,-16],[-7,-2],[8,8],[0,22]],obj.exposed?'#fffbe9':p.dark,4);ctx.restore();
 }else if(kind==='portal'){
  oval(ctx,x,y-49,33,55,p.dark,col,4);oval(ctx,x,y-49,21,42,'#92a3e02a',done?'#a8f1cf':col,2);poly(ctx,[[x-43,y+1],[x-42,y-83],[x-23,y-111],[x,y-123],[x+23,y-111],[x+42,y-83],[x+43,y+1],[x+30,y-2],[x+28,y-80],[x,y-104],[x-28,y-80],[x-30,y-2]],p.metal,p.edge,3);star(ctx,x,y-121,11,col);
 }else if(kind==='lantern'||kind==='brazier'){
  ctx.fillStyle=p.metal;ctx.fillRect(x-10,y-41,20,28);oval(ctx,x,y-39,28,10,p.dark,p.edge);if(done||active){poly(ctx,[[x-15,y-43],[x-11,y-65],[x-2,y-56],[x+4,y-86],[x+15,y-61],[x+12,y-43]],col);star(ctx,x,y-57,8,'#fffbdb');}else oval(ctx,x,y-45,18,7,'#10192b');
 }else{
  poly(ctx,[[x-26,y-15],[x-19,y-74],[x,y-95],[x+19,y-74],[x+26,y-15]],p.metal,p.edge);crystal(ctx,x,y-58,25,col);
 }
 if(hp<1&&hp>0){ctx.fillStyle='#0b1227';ctx.fillRect(x-29,y+23,58,6);ctx.fillStyle=col;ctx.fillRect(x-28,y+24,56*hp,4);}
 if(hold>0){ctx.beginPath();ctx.arc(x,y+7,39,-Math.PI/2,-Math.PI/2+Math.PI*2*hold);ctx.strokeStyle='#ffe5a5';ctx.lineWidth=4;ctx.stroke();}
 if(active){const lift=Math.sin(clock*3)*3;poly(ctx,[[x,y-157+lift],[x-7,y-169+lift],[x+7,y-169+lift]],'#ffe5a5');}
 ctx.restore();
}
function surroundings(ctx,c,p,x,y,half){
 const mist=ctx.createRadialGradient(x,y,half*.35,x,y,half+150);mist.addColorStop(0,p.light+'18');mist.addColorStop(.78,p.light+'0d');mist.addColorStop(1,p.dark);ctx.fillStyle=mist;ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
 const industrial=['mako','steel','bio'].includes(c.profile.theme),ruins=['ruin','water','sunset'].includes(c.profile.theme),voided=['void','abyss','frostfire'].includes(c.profile.theme);
 if(industrial){
  for(const side of [-1,1]){const px=x+side*(half+44);line(ctx,[[px,y-half-40],[px,y+half+48]],'#101c28',45);line(ctx,[[px,y-half-40],[px,y+half+48]],p.metal,28);line(ctx,[[px-6,y-half-40],[px-6,y+half+48]],p.edge+'77',4);for(let k=-4;k<=4;k++){ctx.fillStyle=p.dark;ctx.fillRect(px-23,y+k*105-9,46,18);ctx.fillStyle=p.light+'55';ctx.fillRect(px-12,y+k*105-4,24,4);}}
  for(const side of [-1,1]){const py=y+side*(half+65);line(ctx,[[x-half-40,py],[x+half+40,py]],p.metal,16);line(ctx,[[x-half-40,py-3],[x+half+40,py-3]],p.edge,3);}
 }else if(ruins){
  for(let i=0;i<14;i++){ctx.strokeStyle=i%2?'#86b2bb12':'#69969e18';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,half+35+i*10,half*.8+35+i*12,-.15,0,Math.PI*2);ctx.stroke();}
  for(const side of [-1,1])for(const offset of [-.65,.15,.7]){const px=x+side*(half+40),py=y+half*offset;ctx.fillStyle='#0b1b25';ctx.fillRect(px-22,py-54,44,78);ctx.fillStyle=p.metal;ctx.fillRect(px-14,py-84,28,87);ctx.fillStyle=p.edge;ctx.fillRect(px-20,py-88,40,9);ctx.fillRect(px-23,py,46,13);line(ctx,[[px-6,py-70],[px+5,py-44],[px-4,py-29]],p.dark,4);}
 }else{
  for(let i=0;i<7;i++){const r=half+25+i*15;ctx.strokeStyle=(voided?'#c489ba':'#8fb3e4')+'0e';ctx.lineWidth=7-i*.6;ctx.beginPath();ctx.ellipse(x,y,r,r*.79,i*.11,0,Math.PI*2);ctx.stroke();}
  for(let i=0;i<12;i++){const a=i*Math.PI/6+.13,px=x+Math.cos(a)*(half+75),py=y+Math.sin(a)*(half+75);crystal(ctx,px,py,12+(i%3)*8,voided?'#a473a4':p.metal);}
 }
 for(let i=0;i<50;i++){const a=i*2.399,r=half+20+(i*29)%115;star(ctx,x+Math.cos(a)*r,y+Math.sin(a)*r,i%3+1,p.light+'44');}
}
function floorIdentity(ctx,c,p,x,y,half){
 const color=p.edge+'19';
 if(c.profile.shape==='throne'){ctx.fillStyle='#9b6d9120';ctx.fillRect(x-87,y-half+60,174,half+95);line(ctx,[[x-90,y-half+60],[x-90,y+95],[x+90,y+95],[x+90,y-half+60]],p.light+'30',3);for(const sign of [-1,1])poly(ctx,[[x,y-40],[x+sign*100,y+40],[x+sign*190,y-60],[x+sign*90,y-25]],color);}
 if(c.profile.shape==='gantry'){for(const dy of [-165,165]){for(let xx=-half+150;xx<half-130;xx+=30){line(ctx,[[x+xx,y+dy-18],[x+xx,y+dy+18]],p.edge+'2e',5);}line(ctx,[[x-half+120,y+dy-25],[x+half-120,y+dy-25]],p.edge+'33',4);}}
 if(['specimen','procession','void-crown'].includes(c.profile.shape))for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(105,0);ctx.bezierCurveTo(190,-80,300,-100,390,0);ctx.bezierCurveTo(300,100,190,80,105,0);ctx.stroke();ctx.restore();}
 if(c.profile.shape==='observatory'){for(let i=0;i<8;i++){const a=i*Math.PI/4,px=x+Math.cos(a)*290,py=y+Math.sin(a)*290;star(ctx,px,py,18,p.edge+'28');line(ctx,[[px,py],[x+Math.cos(a+Math.PI*.75)*290,y+Math.sin(a+Math.PI*.75)*290]],p.edge+'14',2);}}
 if(c.profile.shape==='ossuary'){for(const side of [-1,1])for(let i=-2;i<=2;i++){const px=x+side*(half-100),py=y+i*145;poly(ctx,[[px-28,py-37],[px+28,py-37],[px+35,py+34],[px-35,py+34]],p.dark+'55',p.edge+'2b');line(ctx,[[px,py-24],[px,py+24]],p.light+'1b',3);}}
 if(c.profile.shape==='kennel'){for(let i=0;i<3;i++){const a=-Math.PI/2+i*Math.PI*2/3;for(let r=180;r<half-60;r+=34){ctx.save();ctx.translate(x+Math.cos(a)*r,y+Math.sin(a)*r);ctx.rotate(a);oval(ctx,0,0,20,9,null,p.edge+'22',3);ctx.restore();}}}
}
function backdrop(c,terrain){
 const key=c.kind+':'+terrain.plan.shape;if(backgrounds.has(key))return backgrounds.get(key);
 const p=raidPalettes[c.profile.theme],half=c.arenaHalf,pad=160,size=half*2+pad*2,canvas=document.createElement('canvas');canvas.width=canvas.height=size;const ctx=canvas.getContext('2d'),ox=half+pad-c.center.x,oy=half+pad-c.center.y;
 ctx.fillStyle=p.dark;ctx.fillRect(0,0,size,size);ctx.imageSmoothingEnabled=false;surroundings(ctx,c,p,half+pad,half+pad,half);
 for(const index of terrain.floor){const {x,y}=terrain.center(index),px=x+ox-32,py=y+oy-32,ix=index%SIZE,iy=Math.floor(index/SIZE);ctx.fillStyle=(ix+iy)%4===0?p.floor:p.floor;ctx.fillRect(px,py,64,64);ctx.strokeStyle='#00000012';ctx.lineWidth=1;ctx.strokeRect(px+.5,py+.5,63,63);
  if((ix+iy)%4===0){ctx.fillStyle='#ffffff05';ctx.fillRect(px+8,py+8,48,2);}
  for(const [dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]])if(!terrain.open(ix+dx,iy+dy)){
   const a=dx?[[px+(dx>0?64:0),py],[px+(dx>0?64:0),py+64]]:[[px,py+(dy>0?64:0)],[px+64,py+(dy>0?64:0)]];
   line(ctx,a,p.dark,14);line(ctx,a,p.edge,5);line(ctx,a,p.light+'66',1);
   if(dy===-1){ctx.fillStyle=p.metal;ctx.fillRect(px-3,py-24,70,18);ctx.fillStyle=p.edge;ctx.fillRect(px-3,py-25,70,4);if(ix%3===0){ctx.fillStyle=p.light;ctx.fillRect(px+26,py-26,12,7);}}
  }
 }
 ctx.save();ctx.beginPath();for(const index of terrain.floor){const pos=terrain.center(index);ctx.rect(pos.x+ox-32,pos.y+oy-32,64,64);}ctx.clip();
 const x=half+pad,y=x;floorIdentity(ctx,c,p,x,y,half);ctx.strokeStyle=p.edge+'22';ctx.lineWidth=2;
 // Each dais has a broad, quiet emblem. Detail stays on the architecture at the perimeter.
 if(['reactor','gantry'].includes(c.profile.shape)){
  for(const dy of [-220,220]){line(ctx,[[x-half+55,y+dy],[x+half-55,y+dy]],p.edge+'22',14);line(ctx,[[x-half+55,y+dy],[x+half-55,y+dy]],p.light+'22',2);}
  for(const xx of [-half+75,half-75])for(let i=-5;i<=5;i++){ctx.save();ctx.translate(x+xx,y+i*68);ctx.rotate(-.45);ctx.fillStyle='#c7b77e33';ctx.fillRect(-11,-18,22,36);ctx.restore();}
 }else{for(const r of [110,130,Math.min(half-72,390)])oval(ctx,x,y,r,r*.87,null,p.edge+'22',3);for(let i=0;i<8;i++){const a=i*Math.PI/4;line(ctx,[[x+Math.cos(a)*136,y+Math.sin(a)*136*.87],[x+Math.cos(a)*(half-95),y+Math.sin(a)*(half-95)*.87]],p.edge+'16',2);}}
 if(c.profile.shape==='twins'){ctx.fillStyle='#a6483520';ctx.fillRect(x-half,y-half,half,half*2);ctx.fillStyle='#7acfee16';ctx.fillRect(x,y-half,half,half*2);line(ctx,[[x,y-half+100],[x,y+half-100]],'#b7d6ef33',3);}
 if(c.profile.shape==='sun'){for(let i=0;i<12;i++){const a=i*Math.PI/6;poly(ctx,[[x+Math.cos(a)*160,y+Math.sin(a)*160],[x+Math.cos(a+.09)*245,y+Math.sin(a+.09)*245],[x+Math.cos(a+.18)*160,y+Math.sin(a+.18)*160]],'#c3a88118');}}
 ctx.restore();
 for(const prop of terrain.plan.props.filter(t=>t.raidDecor)){
  const px=ORIGIN+(prop.x+prop.w/2)*TILE+ox,py=ORIGIN+(prop.y+prop.h/2)*TILE+oy;
  if(prop.raidDecor==='exchanger'){ctx.fillStyle='#101c29';ctx.fillRect(px-48,py-95,96,135);ctx.strokeStyle=p.edge;ctx.strokeRect(px-48,py-95,96,135);for(let i=0;i<5;i++){ctx.fillStyle=i%2?p.metal:p.light+'66';ctx.fillRect(px-35,py-80+i*21,70,12);}line(ctx,[[px-54,py+43],[px+54,py+43]],p.edge,8);}
  else if(prop.raidDecor==='throne'){poly(ctx,[[px-88,py+30],[px-69,py-110],[px,py-150],[px+69,py-110],[px+88,py+30]],p.metal,p.edge,4);ctx.fillStyle='#3a284a';ctx.fillRect(px-45,py-93,90,112);crystal(ctx,px,py-113,17,p.light);}
  else if(prop.raidDecor==='crane-base'){ctx.fillStyle=p.metal;ctx.fillRect(px-45,py-45,90,90);line(ctx,[[px-35,py+30],[px-35,py-105],[px+35,py-105],[px+35,py+30]],p.edge,9);}
  else drawRaidObject(ctx,{x:px,y:py,art:prop.raidDecor==='tomb'?'coffin':'pillar'},p,0);
 }
 const image={canvas,x:c.center.x-half-pad,y:c.center.y-half-pad};backgrounds.set(key,image);return image;
}
export function drawRaidArena(ctx,s,c,ox,oy,w,h){
 const p=raidPalettes[c.profile.theme];ctx.fillStyle=p.dark;ctx.fillRect(s.x-w/(2*s.zoom)+ox,s.y-h/(2*s.zoom)+oy,w/s.zoom,h/s.zoom);
 const image=backdrop(c,c.raidBaseTerrain||s.terrain);ctx.drawImage(image.canvas,image.x+ox,image.y+oy);
 const half=c.arenaHalf,x=c.center.x+ox,y=c.center.y+oy;
 ctx.save();ctx.globalAlpha=.25;
 for(let i=0;i<20;i++){const a=i*2.399,rr=half+65+(i%3)*15,px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr-15*Math.sin(c.clock*.5+i);star(ctx,px,py,i%3+2,p.light);}
 ctx.restore();
}
export function drawRaidMechanics(ctx,s,c,ox,oy){
 const p=raidPalettes[c.profile.theme];ctx.save();
 for(const o of c.ramInventory||[])if(o.done&&!(c.raidObjects||[]).includes(o))drawRaidObject(ctx,{...o,x:o.x+ox,y:o.y+oy},p,c.clock,{done:true});
 for(const t of c.raidObjects||[]){
  const dead=t.hp===0,active=t.active&&!t.done&&!dead,done=t.done||dead,point={...t,x:t.x+ox,y:t.y+oy};
  if(!done){const bx=c.boss.x+ox,by=c.boss.y+oy;line(ctx,[[point.x,point.y],[point.x+(bx-point.x)*.42,point.y],[bx,by]],p.dark,7);line(ctx,[[point.x,point.y],[point.x+(bx-point.x)*.42,point.y],[bx,by]],active?p.light+'a6':p.light+'30',2);}
  drawRaidObject(ctx,point,p,c.clock,{active,done,hp:t.maxHp?t.hp/t.maxHp:1,hold:t.hold/c.rules.hold});
 }
 if(c.raidSource){drawRaidObject(ctx,{...c.raidSource,x:c.raidSource.x+ox,y:c.raidSource.y+oy},p,c.clock,{active:!c.carried,done:Boolean(c.carried)});}
 if(c.carried){const x=s.x+ox,y=s.y+oy-76;star(ctx,x,y,13,'#fff1b8');oval(ctx,x,y,20,20,null,p.light,2);}
 if(c.phase==='mechanic'){
  const x=c.boss.x+ox,y=c.boss.y+oy-c.boss.size*.35,r=c.boss.size*.68;
  const g=ctx.createRadialGradient(x,y,r*.1,x,y,r);g.addColorStop(0,p.light+'08');g.addColorStop(.9,p.light+'08');g.addColorStop(1,p.light+'55');oval(ctx,x,y,r,r,g,p.light+'66',2);
  for(let i=0;i<6;i++){const a=i*Math.PI/3+c.clock*.04;line(ctx,[[x+Math.cos(a)*r,y+Math.sin(a)*r],[x+Math.cos(a+.2)*r,y+Math.sin(a+.2)*r]],p.light,3);}
 }
 // Temporary impact debris is visible but never becomes an automatic permanent damage pool.
 for(const fx of c.raidEffects||[]){const age=c.clock-fx.born;if(age>1)continue;ctx.globalAlpha=1-age;for(let i=0;i<12;i++){const a=i*2.4,r=age*70;ctx.fillStyle=fx.color||p.light;ctx.fillRect(fx.x+ox+Math.cos(a)*r-3,fx.y+oy+Math.sin(a)*r*.6-45*Math.sin(age*Math.PI),6,6);}}
 ctx.restore();
}
