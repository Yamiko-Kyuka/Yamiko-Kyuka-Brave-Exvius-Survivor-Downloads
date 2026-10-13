/** Authored, connected room networks. The same grid drives rendering and collisions. */
export const TILE=64,SIZE=80,ORIGIN=-SIZE*TILE/2;
import {levelPlans} from './level-plans.js';
export class Terrain {
 constructor(stage,overridePlan=null){
  this.id=stage.id;this.cells=new Uint8Array(SIZE*SIZE);this.flow=new Int16Array(SIZE*SIZE);this.flowTarget=-1;
  const plan=overridePlan||levelPlans[this.id]||levelPlans.midgar;this.plan=plan;this.areas=plan.areas;this.props=plan.props;
  this.styles=new Uint8Array(SIZE*SIZE);this.propCells=new Uint8Array(SIZE*SIZE);
  for(const area of plan.areas){
   for(let y=area.y;y<area.y+area.h;y++)for(let x=area.x;x<area.x+area.w;x++){
    if(area.shape==='ellipse'&&((x+.5-area.x-area.w/2)/(area.w/2))**2+((y+.5-area.y-area.h/2)/(area.h/2))**2>1)continue;
    this.rect(x,y,1,1,1);this.styles[y*SIZE+x]=area.style;
   }
  }
  for(const [x,y,w,h]of plan.paths){this.rect(x,y,w,h,1);for(let cy=y;cy<y+h;cy++)for(let cx=x;cx<x+w;cx++)this.styles[cy*SIZE+cx]=1;}
  for(const prop of plan.props){this.rect(prop.x,prop.y,prop.w,prop.h,0);for(let cy=prop.y;cy<prop.y+prop.h;cy++)for(let cx=prop.x;cx<prop.x+prop.w;cx++)this.propCells[cy*SIZE+cx]=1;}
  this.floor=[];for(let i=0;i<this.cells.length;i++)if(this.cells[i])this.floor.push(i);
 }
 rect(x,y,w,h,value){for(let cy=Math.max(1,y);cy<Math.min(SIZE-1,y+h);cy++)for(let cx=Math.max(1,x);cx<Math.min(SIZE-1,x+w);cx++)this.cells[cy*SIZE+cx]=value;}
 cell(x,y){const cx=Math.floor((x-ORIGIN)/TILE),cy=Math.floor((y-ORIGIN)/TILE);return cx>=0&&cy>=0&&cx<SIZE&&cy<SIZE?cy*SIZE+cx:-1;}
 center(index){return {x:ORIGIN+(index%SIZE+.5)*TILE,y:ORIGIN+(Math.floor(index/SIZE)+.5)*TILE};}
 open(cx,cy){return cx>=0&&cy>=0&&cx<SIZE&&cy<SIZE&&this.cells[cy*SIZE+cx]===1;}
 walkable(x,y,radius=14){
  const left=Math.floor((x-radius-ORIGIN)/TILE),right=Math.floor((x+radius-ORIGIN)/TILE),top=Math.floor((y-radius-ORIGIN)/TILE),bottom=Math.floor((y+radius-ORIGIN)/TILE);
  for(let cy=top;cy<=bottom;cy++)for(let cx=left;cx<=right;cx++)if(!this.open(cx,cy)){
   const bx=ORIGIN+cx*TILE,by=ORIGIN+cy*TILE,px=Math.max(bx,Math.min(x,bx+TILE)),py=Math.max(by,Math.min(y,by+TILE));
   if((x-px)**2+(y-py)**2<=radius**2)return false;
  }
  return true;
 }
 lineClear(x,y,tx,ty,radius=2){const steps=Math.max(1,Math.ceil(Math.hypot(tx-x,ty-y)/12));for(let i=1;i<=steps;i++)if(!this.walkable(x+(tx-x)*i/steps,y+(ty-y)*i/steps,radius))return false;return true;}
 trace(x,y,tx,ty,radius=2){const steps=Math.max(1,Math.ceil(Math.hypot(tx-x,ty-y)/6));let point={x,y};for(let i=1;i<=steps;i++){const next={x:x+(tx-x)*i/steps,y:y+(ty-y)*i/steps};if(!this.walkable(next.x,next.y,radius))return {...point,blocked:true};point=next;}return {...point,blocked:false};}
 nearestFloor(x,y,radius=14){let best=null,cost=Infinity;for(const index of this.floor){const p=this.center(index),d=(x-p.x)**2+(y-p.y)**2;if(d<cost&&this.walkable(p.x,p.y,radius)){best=p;cost=d;}}return best;}
 spawnPoint(s,width,height,radius=20,random=Math.random){
  const halfW=width/(2*s.zoom),halfH=height/(2*s.zoom),distance=Math.hypot(halfW,halfH)+80;
  for(let i=0;i<80;i++){const a=random()*Math.PI*2,p={x:s.x+Math.cos(a)*distance,y:s.y+Math.sin(a)*distance};if(this.walkable(p.x,p.y,radius))return p;}
  // On an edge or at maximum zoom-out, prefer the most distant reachable room gate.
  const angle=random()*Math.PI*2,target={x:s.x+Math.cos(angle)*distance,y:s.y+Math.sin(angle)*distance};let best=null,cost=Infinity;
  for(const index of this.floor){const p=this.center(index);if(Math.abs(p.x-s.x)<=halfW+60&&Math.abs(p.y-s.y)<=halfH+60)continue;const d=(p.x-target.x)**2+(p.y-target.y)**2;if(d<cost&&this.walkable(p.x,p.y,radius)){best=p;cost=d;}}
  return best||this.nearestFloor(target.x,target.y,radius);
 }
 updateFlow(target){
  const index=this.cell(target.x,target.y);if(index===this.flowTarget)return;this.flowTarget=index;this.flow.fill(-1);if(index<0||!this.cells[index])return;
  const queue=new Int32Array(this.cells.length);let head=0,tail=0;queue[tail++]=index;this.flow[index]=0;
  while(head<tail){const current=queue[head++],x=current%SIZE,y=Math.floor(current/SIZE);for(const [nx,ny]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){const next=ny*SIZE+nx;if(this.open(nx,ny)&&this.flow[next]<0){this.flow[next]=this.flow[current]+1;queue[tail++]=next;}}}
 }
 direction(entity,target,radius=16){
  this.updateFlow(target);const distance=Math.hypot(target.x-entity.x,target.y-entity.y);
  if(distance<480&&this.lineClear(entity.x,entity.y,target.x,target.y,radius))return {x:target.x-entity.x,y:target.y-entity.y};
  const index=this.cell(entity.x,entity.y);if(index<0)return {x:0,y:0};const x=index%SIZE,y=Math.floor(index/SIZE);let next=index,value=this.flow[index];
  for(const [nx,ny]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){const n=ny*SIZE+nx;if(this.open(nx,ny)&&this.flow[n]>=0&&(value<0||this.flow[n]<value)){next=n;value=this.flow[n];}}
  const point=this.center(next);return {x:point.x-entity.x,y:point.y-entity.y};
 }
 areaAt(x,y){const cx=(x-ORIGIN)/TILE,cy=(y-ORIGIN)/TILE;return this.areas.find(a=>cx>=a.x&&cx<a.x+a.w&&cy>=a.y&&cy<a.y+a.h)?.name||this.plan.passage;}

}
export function moveEntity(terrain,entity,dx,dy,radius=14){
 if(!terrain){entity.x+=dx;entity.y+=dy;return;}
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/6));
 for(let i=0;i<steps;i++){
  const mx=dx/steps,my=dy/steps;
  if(terrain.walkable(entity.x+mx,entity.y+my,radius)){entity.x+=mx;entity.y+=my;}
  else{if(terrain.walkable(entity.x+mx,entity.y,radius))entity.x+=mx;if(terrain.walkable(entity.x,entity.y+my,radius))entity.y+=my;}
 }
}
