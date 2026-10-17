import {TILE,SIZE,ORIGIN} from './terrain.js';
/** Matching ground and architecture are drawn from the fixed collision plan. */
const banks={midgar:['#a99b74','#353c43','#0a111a'],zanarkand:['#b9c4c5','#6b8c9b','#163846'],'crystal-tower':['#b5c4dc','#6f8bae','#243b5d'],'dark-world':['#927d9b','#4b3b55','#171322']};
export class MapArt {
 constructor(){this.images=new Map();this.promises=new Map();}
 load(stage){
  if(this.promises.has(stage.id))return this.promises.get(stage.id);
  const promise=new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{this.images.set(stage.id,image);resolve(image);};image.onerror=()=>{this.promises.delete(stage.id);reject(Error('Décor indisponible : '+stage.name));};image.src='/assets/maps/tiles/'+(stage.tileset||stage.id)+'.webp';});
  this.promises.set(stage.id,promise);return promise;
 }
 draw(ctx,s,ox,oy,w,h){
  const image=this.images.get(s.stage.id),terrain=s.terrain;if(!image||!terrain)return;
  const fw=image.naturalWidth/3,fh=image.naturalHeight/2,halfW=w/(2*s.zoom),halfH=h/(2*s.zoom),minX=Math.floor((s.x-halfW-ORIGIN)/TILE)-1,maxX=Math.ceil((s.x+halfW-ORIGIN)/TILE)+1,minY=Math.floor((s.y-halfH-ORIGIN)/TILE)-1,maxY=Math.ceil((s.y+halfH-ORIGIN)/TILE)+1;
  const patch=(art,x,y,width,height)=>ctx.drawImage(image,art%3*fw,Math.floor(art/3)*fh,fw,fh,x+ox,y+oy,width,height);
  ctx.save();ctx.imageSmoothingEnabled=false;
  const revised=s.stage.tileset?.endsWith('-v2'),voidSky=s.stage.id==='dark-world'&&revised;
  if(voidSky)ctx.drawImage(image,2*fw,0,fw,fh,s.x-halfW+ox,s.y-halfH+oy,halfW*2,halfH*2);
  // Ground contains no raised architecture. Only blocked cells carry walls, water or void.
  for(let cy=minY;cy<=maxY;cy++)for(let cx=minX;cx<=maxX;cx++){
   const open=terrain.open(cx,cy),index=cy*SIZE+cx,art=open?terrain.styles[index]:2,x=ORIGIN+cx*TILE+ox,y=ORIGIN+cy*TILE+oy;
   if(!open&&voidSky)continue;
   const architectural=s.stage.id==='midgar'||s.stage.id==='crystal-tower',edge=!open&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>terrain.open(cx+dx,cy+dy));
   if(!open&&architectural&&!edge){ctx.fillStyle=s.stage.id==='midgar'?'#09141e':'#111c33';ctx.fillRect(x,y,TILE,TILE);}
   else ctx.drawImage(image,art*fw+((cx%4+4)%4)*fw/4,((cy%4+4)%4)*fh/4,fw/4,fh/4,x,y,TILE,TILE);
  }
  // Each public room has one deliberately placed floor landmark; corridors stay clear.
  for(const a of terrain.areas){if(revised)continue;const side=256,x=ORIGIN+(a.x+a.w/2)*TILE-side/2,y=ORIGIN+(a.y+a.h/2)*TILE-side/2;if(x+side<s.x-halfW||x>s.x+halfW||y+side<s.y-halfH||y>s.y+halfH)continue;patch(5,x,y,side,side);}
  // Banks and thresholds follow the actual edges, connecting the room art to the architecture.
  const [light,mid,shade]=banks[s.stage.id];
  for(let cy=minY;cy<=maxY;cy++)for(let cx=minX;cx<=maxX;cx++)if(terrain.open(cx,cy)){
   const x=ORIGIN+cx*TILE+ox,y=ORIGIN+cy*TILE+oy;
   for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]])if(!terrain.open(cx+dx,cy+dy)){
    if(revised&&terrain.propCells[(cy+dy)*SIZE+cx+dx])continue;
    const bx=dx===1?x+TILE-6:x,by=dy===1?y+TILE-6:y,bw=dx?6:TILE,bh=dy?6:TILE;ctx.fillStyle=shade;ctx.fillRect(bx,by,bw,bh);ctx.fillStyle=mid;ctx.fillRect(bx,by,dx?4:bw,dy?4:bh);ctx.fillStyle=light;ctx.fillRect(bx,by,dx?2:bw,dy?2:bh);
    if(s.stage.id==='midgar'&&!dx){ctx.fillStyle='#25252c';for(let k=0;k<TILE;k+=12)ctx.fillRect(x+k,by,5,4);}
   }
  }
  // The full footprint of every machine, pillar and monument is solid in Terrain.
  for(const p of terrain.props){const x=ORIGIN+p.x*TILE,y=ORIGIN+p.y*TILE,width=p.w*TILE,height=p.h*TILE;if(x+width<s.x-halfW||x>s.x+halfW||y+height<s.y-halfH||y>s.y+halfH)continue;
   if(revised){
    // A wall is assembled from square architectural modules, never stretched.
    // The solid footing covers the exact rectangle used by Terrain collisions.
    const foundation={midgar:'#252e36',zanarkand:'#30434f','crystal-tower':'#394c66','dark-world':'#292531'}[s.stage.id];
    ctx.fillStyle='#06091499';ctx.fillRect(x+ox+4,y+oy+7,width,height);ctx.fillStyle=foundation;ctx.fillRect(x+ox,y+oy,width,height);
    ctx.fillStyle=shade;ctx.fillRect(x+ox,y+oy+height-7,width,7);
    const side=Math.min(width,height),cols=Math.ceil(width/side),rows=Math.ceil(height/side),cw=width/cols,ch=height/rows,size=Math.min(cw,ch);
    for(let py=0;py<rows;py++)for(let px=0;px<cols;px++)patch(p.art,x+px*cw+(cw-size)/2,y+py*ch+(ch-size)/2,size,size);
   }else patch(p.art,x,y,width,height);
   ctx.fillStyle=shade+'88';ctx.fillRect(x+ox,y+oy+height-6,width,6);
  }
  ctx.fillStyle='#04091626';ctx.fillRect(s.x-halfW+ox,s.y-halfH+oy,halfW*2,halfH*2);ctx.restore();
 }
}
