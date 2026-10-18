const text=(tag,value,className)=>{const node=document.createElement(tag);node.textContent=value;if(className)node.className=className;return node;};
const amount=n=>Math.round(n).toLocaleString('fr-FR');
export function bossRatingSummary(ratings=[]){
 const section=document.createElement('section');section.className='boss-rating-summary';
 if(!ratings.length)return section;
 section.append(text('h3','Notes des boss'));
 for(const result of ratings){const row=document.createElement('div');row.className='boss-rating-row';row.style.setProperty('--rank-color',result.color);row.append(text('strong',result.rank,'rank-mini'),text('span',result.name),text('small',`+${amount(result.xp)} XP · +${amount(result.gils)} gils`));section.append(row);}
 return section;
}
export class BossRatingReveal{
 constructor(onComplete){this.onComplete=onComplete;this.dialog=document.createElement('dialog');this.dialog.className='boss-rating-modal';this.dialog.setAttribute('aria-label','Note du combat de boss');this.dialog.addEventListener('cancel',e=>e.preventDefault());document.body.append(this.dialog);}
 show(result){
  this.active=true;this.elapsed=0;this.dialog.replaceChildren();this.dialog.dataset.tier=result.tier;this.dialog.style.setProperty('--rank-color',result.color);
  const halo=document.createElement('div');halo.className='rank-halo';halo.setAttribute('aria-hidden','true');
  const rays=document.createElement('div');rays.className='rank-rays';rays.setAttribute('aria-hidden','true');
  for(let i=0;i<4+result.tier*2;i++){const star=text('i','✦');star.style.setProperty('--i',i);star.style.setProperty('--n',4+result.tier*2);rays.append(star);}
  const grade=text('strong',result.rank,'rank-grade');grade.setAttribute('aria-label','Rang '+result.rank);
  const rewards=document.createElement('div');rewards.className='rank-rewards';rewards.append(text('span','+ '+amount(result.xp)+' XP'),text('span','+ '+amount(result.gils)+' GILS'));
  this.dialog.append(halo,rays,text('div','BOSS VAINCU','eyebrow'),text('h2',result.name),grade,rewards,text('p',`${result.seconds.toFixed(1)} s · ${result.mechanicsSolved}/${result.mechanicsRequired} mécaniques · ${amount(result.damageTaken)} dégâts reçus`,'rank-performance'));
  this.dialog.showModal();
 }
 tick(dt){if(!this.active)return;this.elapsed+=Math.max(0,dt);if(this.elapsed>=3){this.active=false;this.dialog.close();this.onComplete?.();}}
}
