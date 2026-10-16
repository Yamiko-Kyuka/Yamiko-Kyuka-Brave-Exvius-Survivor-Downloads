import {moveEntity} from './terrain.js';

/** Ground footprints: a monster's weapon or animation does not enlarge its body. */
export function enemyRadius(size=40,boss=false){return Math.max(10,Math.min(boss?90:32,size*(boss ? .34 : .27)));}

/** Resolve only nearby circles. Large creatures yield less; corpses have no collision. */
export function separateEnemies(state,passes=4){
 const enemies=state.enemies.filter(e=>e.hp>0&&!e.dying&&!e.mechanicTarget);
 if(enemies.length<2||state.freezeTimer>0||state.awaitingVictory)return;
 const radii=enemies.map(e=>e.radius??enemyRadius(e.size,e.superboss));
 const cellSize=64;
 const bounds=(e,r)=>[Math.floor((e.x-r)/cellSize),Math.floor((e.x+r)/cellSize),Math.floor((e.y-r)/cellSize),Math.floor((e.y+r)/cellSize)];
 const mass=i=>Math.max(1,enemies[i].collisionMass??radii[i]*radii[i]);
 for(let pass=0;pass<passes;pass++){
  const cells=new Map();
  for(let i=0;i<enemies.length;i++){
   const [left,right,top,bottom]=bounds(enemies[i],radii[i]);
   for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
    const key=x+','+y;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(i);
   }
  }
  let contacts=0;
  const seen=new Int32Array(enemies.length).fill(-1);
  for(let i=0;i<enemies.length;i++){
   const a=enemies[i],[left,right,top,bottom]=bounds(a,radii[i]);
   for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++)for(const j of cells.get(x+','+y)||[]){
    if(j<=i||seen[j]===i)continue;seen[j]=i;
    const b=enemies[j],dx=b.x-a.x,dy=b.y-a.y,reach=radii[i]+radii[j];
    if(dx*dx+dy*dy>=(reach-.01)**2)continue;
    const distance=Math.hypot(dx,dy);
    contacts++;
    // A deterministic direction also separates monsters spawned at exactly the same point.
    const angle=((i+1)*2.399963229728653+(j+1)*.754877666)*Math.PI;
    const nx=distance>1e-8?dx/distance:Math.cos(angle),ny=distance>1e-8?dy/distance:Math.sin(angle);
    const overlap=reach-distance,share=mass(j)/(mass(i)+mass(j));
    const push=(e,amount,sign,radius)=>{
     const ox=e.x,oy=e.y;moveEntity(state.terrain,e,nx*amount*sign,ny*amount*sign,radius);
     return Math.max(0,(e.x-ox)*nx*sign+(e.y-oy)*ny*sign);
    };
    const movedA=push(a,overlap*share,-1,radii[i]);
    const movedB=push(b,overlap-movedA,1,radii[j]);
    // Transfer pressure to the free side when the other creature is against a wall.
    if(overlap-movedA-movedB>.01)push(a,overlap-movedA-movedB,-1,radii[i]);
   }
  }
  if(!contacts)break;
 }
}
