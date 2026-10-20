import {clipFor,frameAt} from './animation.js';
import {spriteFlip} from './controls.js';
/** Damage bounds use the very same frame, anchor, size and mirroring as SpriteCache.draw.
 * Ground footprints remain separate so tall sprites can still fit through doorways. */
export function enemyBounds(e){
 if(e.mechanicTarget&&e.objectiveKind!=='mage')return null;
 const idle=clipFor(e.variant,'idle')||clipFor(e.variant,'standby'),clip=e.anim?.clip||idle;
 if(!clip?.frames?.length||!idle?.frames?.length)return null;
 const [, ,bx,by,bw,bh]=frameAt(clip,e.anim?.elapsed||0,{loop:!e.anim?.busy}).rect;
 const scale=(e.size||40)/Math.max(10,idle.frames[0][5]),flip=spriteFlip(e.facing,e.nativeFacing||'right');
 const left=(bx-clip.anchor[0])*scale,right=left+bw*scale;
 return {left:e.x+(flip?-right:left),right:e.x+(flip?-left:right),top:e.y+(by-clip.anchor[1])*scale,bottom:e.y+(by+bh-clip.anchor[1])*scale};
}
export function closestEnemyPoint(e,p){const b=enemyBounds(e);return b?{x:Math.max(b.left,Math.min(b.right,p.x)),y:Math.max(b.top,Math.min(b.bottom,p.y))}:{x:e.x,y:e.y};}
export function enemyDistance(e,p){const b=enemyBounds(e);return b?Math.hypot(Math.max(b.left-p.x,0,p.x-b.right),Math.max(b.top-p.y,0,p.y-b.bottom)):Math.max(0,Math.hypot(e.x-p.x,e.y-p.y)-(e.radius||16));}
/** Swept projectile against the rendered rectangle, with circular fallback for drawn objectives. */
export function segmentEnemyHit(e,x,y,tx,ty,radius=0){
 const b=enemyBounds(e),dx=tx-x,dy=ty-y;
 if(!b){const ex=x-e.x,ey=y-e.y,r=radius+(e.radius||16),c=ex*ex+ey*ey-r*r;if(c<=0)return 0;const len=dx*dx+dy*dy;if(!len)return null;const dot=ex*dx+ey*dy,d=dot*dot-len*c;if(d<0)return null;const t=(-dot-Math.sqrt(d))/len;return t>=0&&t<=1?t:null;}
 let first=0,last=1;
 for(const [start,delta,low,high]of [[x,dx,b.left-radius,b.right+radius],[y,dy,b.top-radius,b.bottom+radius]]){
  if(Math.abs(delta)<1e-9){if(start<low||start>high)return null;continue;}
  let a=(low-start)/delta,z=(high-start)/delta;if(a>z)[a,z]=[z,a];first=Math.max(first,a);last=Math.min(last,z);if(first>last)return null;
 }return first;
}
/** Minimum displacement for a circular player outside the rendered enemy bounds. */
export function playerSpriteSeparation(e,p,radius){
 const b=enemyBounds(e);if(!b)return null;
 const q=closestEnemyPoint(e,p),dx=p.x-q.x,dy=p.y-q.y,d=Math.hypot(dx,dy);
 if(d>=radius-.01)return {x:0,y:0};
 if(d>1e-8)return {x:dx/d*(radius-d),y:dy/d*(radius-d)};
 const edges=[{x:b.left-radius-p.x,y:0},{x:b.right+radius-p.x,y:0},{x:0,y:b.top-radius-p.y},{x:0,y:b.bottom+radius-p.y}];
 return edges.sort((a,z)=>Math.hypot(a.x,a.y)-Math.hypot(z.x,z.y))[0];
}
export function enemyBodiesTouch(a,b,padding=1){
 const aa=enemyBounds(a),bb=enemyBounds(b);
 if(aa&&bb)return aa.left<=bb.right+padding&&aa.right+padding>=bb.left&&aa.top<=bb.bottom+padding&&aa.bottom+padding>=bb.top;
 return Math.hypot(a.x-b.x,a.y-b.y)<=(a.radius||16)+(b.radius||16)+padding;
}
