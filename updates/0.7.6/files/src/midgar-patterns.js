/** Bespoke attack geometry for Midgar; mechanics and damage stay in the raid engine. */
export function scheduleMidgarPattern(s,c,spec,base,add){
 const rank=c.rules.rank,segment=c.segmentIndex||0;
 if(c.kind==='air-buster'){
  if(spec.id==='machinegun'){
   for(const side of [-1,1])add('fan',{x:base.x+side*64,y:base.y-12,shots:3+Math.floor(rank/2),projectileSpeed:210+rank*13,windup:base.windup+(side>0?.3:0),device:'cannon'});return true;
  }
  if(spec.id==='big-bomber'){
   for(let i=0;i<3+(rank>=3?1:0);i++){const angle=base.angle+Math.PI/2,offset=(i-1)*105;add('meteor',{tx:s.x+Math.cos(angle)*offset,ty:s.y+Math.sin(angle)*offset,radius:48,windup:base.windup+.3+i*.28,device:'bomber'});}return true;
  }
  if(spec.id==='rail-cannon'){add('beam',{width:84,windup:Math.max(1.5,base.windup+.35),device:'tankbuster'});return true;}
  if(spec.id==='wing-batteries'){
   for(const side of [-1,1]){const x=c.center.x+side*(c.arenaHalf-90),y=c.center.y-120;add('fan',{x,y,angle:Math.atan2(s.y-y,s.x-x),shots:3,windup:base.windup+(side>0?.45:0),projectileSpeed:195+rank*12,device:'detached-hand'});}return true;
  }
 }
 if(c.kind==='jenova'){
  if(spec.id==='tentacle-shear'){
   const rotation=segment*Math.PI/8;for(let i=0;i<4;i++)add('beam',{angle:base.angle+rotation+i*Math.PI/2,width:48,windup:base.windup,device:'tentacle'});return true;
  }
  if(spec.id==='cellular-seeds'){
   const count=3+Math.floor(rank/2);for(let i=0;i<count;i++){const angle=i*Math.PI*2/count+segment*.4,r=i?105+segment*20:0;add('meteor',{tx:s.x+Math.cos(angle)*r,ty:s.y+Math.sin(angle)*r,radius:42,windup:base.windup+.35+i*.24,device:'cell'});}return true;
  }
  if(spec.id==='genetic-helix'){
   add('fan',{shots:7,angle:base.angle-.22,device:'cell'});c.followups??=[];c.followups.push({at:c.clock+base.windup+.7,spec:{...spec,id:'genetic-return',type:'fan'},options:{angle:base.angle+.32,shots:7,followup:true,device:'cell'}});return true;
  }
 }
 return false;
}
export function nextMidgarPattern(c,random=Math.random){
 if(!['air-buster','jenova'].includes(c.kind))return null;
 const specs=c.profile.attackSpecs;
 if(!c.midgarAttackBag?.length){
  c.midgarAttackBag=specs.map(a=>a.id);for(let i=c.midgarAttackBag.length-1;i>0;i--){const j=Math.min(i,Math.floor(random()*(i+1)));[c.midgarAttackBag[i],c.midgarAttackBag[j]]=[c.midgarAttackBag[j],c.midgarAttackBag[i]];}
  if(c.midgarAttackBag[0]===c.midgarLast&&c.midgarAttackBag.length>1)[c.midgarAttackBag[0],c.midgarAttackBag[1]]=[c.midgarAttackBag[1],c.midgarAttackBag[0]];
 }
 if(!c.midgarOpened&&c.rules.rank>0){c.midgarOpened=true;const opening=specs.at(-1).id;c.midgarAttackBag=c.midgarAttackBag.filter(id=>id!==opening);c.midgarLast=opening;}
 else c.midgarLast=c.midgarAttackBag.shift();
 c.patternStep++;return specs.find(a=>a.id===c.midgarLast);
}
export function midgarPatternInterval(c){return Math.max(2.1,(c.kind==='jenova'?4.6:4.4)-c.rules.rank*.35)*(1-(c.segmentIndex||0)*.07);}
export function drawMidgarDevice(ctx,c,a,ox,oy,active){
 if(!a.device)return;const progress=Math.max(0,Math.min(1,(c.clock-a.born)/a.windup));ctx.save();ctx.translate(a.x+ox,a.y+oy);
 if(a.device==='cannon'||a.device==='detached-hand'||a.device==='tankbuster'){
  ctx.rotate(a.angle);ctx.fillStyle='#0a1320';ctx.fillRect(-22,-17,54,34);ctx.fillStyle='#65818a';ctx.fillRect(-18,-13,43,26);ctx.fillStyle='#a9bbc1';ctx.fillRect(16,-10,14,20);ctx.fillStyle=active?'#fff0b1':'#e1b56a';ctx.globalAlpha=.35+progress*.6;ctx.fillRect(26,-7,10,14);
 }else if(a.device==='tentacle'){
  ctx.rotate(a.angle);const length=Math.min(250,c.arenaHalf*.55),reach=active?1:.45+.35*progress;ctx.strokeStyle='#608e9a';ctx.lineWidth=15;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(length*.3,-12,length*.65,12,length*reach,0);ctx.stroke();ctx.strokeStyle='#b0e9d7';ctx.lineWidth=3;ctx.stroke();
 }else{
  const x=a.tx-a.x,y=a.ty-a.y-(1-progress)*160;ctx.translate(x,y);ctx.fillStyle=a.device==='cell'?'#83c9ba':'#3a4650';ctx.strokeStyle=a.device==='cell'?'#c5fff1':'#dfbf85';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,a.device==='cell'?11:9,14,0,0,Math.PI*2);ctx.fill();ctx.stroke();if(a.device==='bomber'){ctx.fillStyle='#e9b46b';ctx.fillRect(-3,-9,6,5);}
 }
 ctx.restore();
}
