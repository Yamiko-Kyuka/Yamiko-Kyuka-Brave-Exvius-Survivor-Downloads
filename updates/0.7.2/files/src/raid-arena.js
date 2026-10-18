import {Terrain,ORIGIN,TILE} from './terrain.js';
const sizes={gantry:[20,16],kennel:[20,18],twins:[20,18]};
export function createRaidArena(stage,profile){
 const old=profile.final?16:12,[rx,ry]=profile.room||[10,7],cx=rx+old/2,cy=ry+old/2;
 const [w,h]=sizes[profile.shape]||[profile.final?22:18,profile.final?22:18],x=cx-w/2,y=cy-h/2;
 const area=(name,shape,ax,ay,aw,ah)=>({name,shape,x:ax,y:ay,w:aw,h:ah,style:1});
 let areas=[area(profile.arena,'rect',x,y,w,h)];
 if(['specimen','procession','observatory','twins','void-crown','sun'].includes(profile.shape))areas=[area(profile.arena,'ellipse',x,y,w,h)];
 if(profile.shape==='sun')areas.push(area('Allée des priants','rect',cx-3,y,6,h));
 if(profile.shape==='throne')areas=[area(profile.arena,'ellipse',x,y,w,h),area('Estrade impériale','rect',cx-4,y,8,5)];
 const prop=(dx,dy,pw,ph,art)=>({x:cx+dx,y:cy+dy,w:pw,h:ph,art:3,raidDecor:art,name:art});
 const props=[];
 if(profile.shape==='reactor')props.push(prop(-8,-6,2,3,'exchanger'),prop(6,-6,2,3,'exchanger'),prop(-8,3,2,3,'exchanger'),prop(6,3,2,3,'exchanger'));
 if(profile.shape==='gantry')props.push(prop(-9,-6,2,2,'crane-base'),prop(7,-6,2,2,'crane-base'),prop(-9,4,2,2,'crane-base'),prop(7,4,2,2,'crane-base'));
 if(profile.shape==='ossuary')for(const dx of [-7,5])for(const dy of [-6,4])props.push(prop(dx,dy,2,2,'tomb'));
 if(profile.shape==='throne')props.push(prop(-2,-9,4,2,'throne'));
 if(profile.shape==='colonnade')props.push(prop(-8,-7,2,2,'ruined-arch'),prop(6,-7,2,2,'ruined-arch'));
 const plan={passage:profile.arena,areas,paths:[],props,raid:true,shape:profile.shape,theme:profile.theme};
 return {plan,terrain:new Terrain(stage,plan),center:{x:ORIGIN+cx*TILE,y:ORIGIN+cy*TILE},half:Math.max(w,h)*TILE/2,width:w,height:h};
}
