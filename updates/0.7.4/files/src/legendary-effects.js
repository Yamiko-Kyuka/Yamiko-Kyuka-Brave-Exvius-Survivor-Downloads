const owns=(state,id)=>(state.powerups||[]).some(p=>p.id===id);

export function tickLegendaryEffects(state,dt){
 state.legendaryClock=(state.legendaryClock||0)+dt;
 if(owns(state,'aegis')&&!state.aegisShield){
  state.aegisCooldown=Math.max(0,(state.aegisCooldown??25)-dt);
  if(state.aegisCooldown===0){state.aegisShield=true;state.pickupNotice={name:'Égide d’Alexandre · bouclier prêt',life:2};}
 }
 if(owns(state,'stasis')){
  state.stasisCooldown=(state.stasisCooldown??30)-dt;
  if(state.stasisCooldown<=0){state.stasisCooldown+=30;state.freezeTimer=Math.max(state.freezeTimer||0,3);state.screenFlash={color:'#b2ebff',life:.3,maxLife:.3};state.pickupNotice={name:'Stase de Shiva',life:2};}
 }
}
export function tryAutoPhoenix(state){
 if(state.hp>0||state.phoenixUsed||!owns(state,'phoenix'))return false;
 state.phoenixUsed=true;state.hp=Math.max(1,Math.ceil(state.maxHp*.5));state.invuln=3;
 state.screenFlash={color:'#ffce86',life:.6,maxLife:.6};state.pickupNotice={name:'Auto-Phénix · une seconde chance !',life:3};return true;
}
export function drawLegendaryAura(ctx,state,x,y){
 if(!state.aegisShield)return;
 ctx.save();ctx.strokeStyle='#fff0b0';ctx.globalAlpha=.65+.2*Math.sin((state.legendaryClock||0)*3);ctx.lineWidth=2;
 ctx.beginPath();ctx.ellipse(x,y-18,25,40,0,0,Math.PI*2);ctx.stroke();ctx.restore();
}
