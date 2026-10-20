import {trainingChoices} from './training.js';
const rarityNames={normal:'Normal',magic:'Magique',rare:'Rare',epic:'Épique',legendary:'Légendaire'};
const number=n=>Math.round(n).toLocaleString('fr-FR');
export class TrainingView{
 constructor({root,getState,getSave,change,exit}){Object.assign(this,{root,getState,getSave,change,exit});this.tab='weapons';this.lastPaint=0;}
 open(){this.root.hidden=false;this.render();}
 close(){this.root.hidden=true;}
 async commit(config){
  try{this.root.querySelector('[role=status]').textContent='';await this.change(config);if(this.getState()?.training)this.render();}
  catch{const status=this.root.querySelector('[role=status]');if(status)status.textContent='Ce personnage n’a pas pu être chargé.';}
 }
 render(){
  const s=this.getState();if(!s?.training)return;const config=s.training.config,choices=trainingChoices(this.getSave());
  this.root.innerHTML='<div class="training-meter panel"><span>DPS ACTUEL</span><strong id="trainingDps">0</strong><small>Moyenne des 3 dernières secondes</small><div><span>Dégâts <b id="trainingTotal">0</b></span><span>Meilleur coup <b id="trainingBest">0</b></span></div><button id="trainingReset">REMISE À ZÉRO</button></div><aside class="training-loadout panel"><div class="training-heading"><h2>Entraînement</h2><button id="trainingExit" aria-label="Quitter l’entraînement">✕</button></div><label class="training-hero">PERSONNAGE<select id="trainingHero" aria-label="Personnage d’entraînement"></select></label><div class="training-tabs"><button data-training-tab="weapons">ARMES</button><button data-training-tab="powerups">POWER-UPS</button></div><div id="trainingEquipment"></div><button id="trainingAdd">+ AJOUTER</button><p role="status" aria-live="polite"></p></aside>';
  const select=this.root.querySelector('#trainingHero');for(const h of choices.heroes){const option=new Option(h.name,h.id);option.selected=h.id===config.heroId;select.add(option);}select.onchange=()=>this.commit({...config,heroId:select.value});
  this.root.querySelector('#trainingExit').onclick=this.exit;
  this.root.querySelector('#trainingReset').onclick=()=>{s.training.meter.reset();s.multiHitQueue=[];s.projectiles=[];s.effects=[];s.damageNumbers=[];this.paint(true);};
  for(const button of this.root.querySelectorAll('[data-training-tab]')){button.classList.toggle('selected',button.dataset.trainingTab===this.tab);button.onclick=()=>{this.tab=button.dataset.trainingTab;this.render();};}
  const list=config[this.tab],definitions=choices[this.tab],container=this.root.querySelector('#trainingEquipment');
  for(const [index,item]of list.entries()){
   const definition=definitions.find(d=>d.id===item.id),row=document.createElement('article');row.className='training-item';row.dataset.rarity=item.rarity;
   const head=document.createElement('div');head.className='training-item-heading';const icon=document.createElement('img');icon.src=definition.icon;icon.alt='';head.append(icon);
   const itemSelect=document.createElement('select');itemSelect.setAttribute('aria-label',this.tab==='weapons'?'Choisir une arme':'Choisir un power-up');
   for(const d of definitions.filter(d=>d.id===item.id||!list.some(p=>p.id===d.id))){const option=new Option(d.name,d.id);option.selected=d.id===item.id;itemSelect.add(option);}head.append(itemSelect);
   const remove=document.createElement('button');remove.textContent='×';remove.setAttribute('aria-label','Retirer '+definition.name);remove.disabled=this.tab==='weapons'&&list.length===1;remove.onclick=()=>this.commit({...config,[this.tab]:list.filter((_,i)=>i!==index)});head.append(remove);row.append(head);
   const controls=document.createElement('div');controls.className='training-item-controls';const levelLabel=document.createElement('label');levelLabel.textContent='Niveau';const level=document.createElement('input');level.type='number';level.min=1;level.max=this.tab==='weapons'?8:definition.maxLevel;level.value=item.level;level.setAttribute('aria-label','Niveau de '+definition.name);levelLabel.append(level);
   const rarity=document.createElement('select');rarity.setAttribute('aria-label','Rareté de '+definition.name);for(const [id,name]of Object.entries(rarityNames)){if(definition.legendaryOnly&&id!=='legendary')continue;const option=new Option(name,id);option.selected=id===item.rarity;rarity.add(option);}controls.append(levelLabel,rarity);row.append(controls);
   const update=patch=>this.commit({...config,[this.tab]:list.map((entry,i)=>i===index?{...entry,...patch}:entry)});
   itemSelect.onchange=()=>update({id:itemSelect.value,level:1,rarity:'normal'});level.onchange=()=>update({level:Number(level.value)});rarity.onchange=()=>update({rarity:rarity.value});container.append(row);
  }
  const add=this.root.querySelector('#trainingAdd'),next=definitions.find(d=>!list.some(p=>p.id===d.id));add.disabled=list.length>=6||!next;add.onclick=()=>this.commit({...config,[this.tab]:[...list,{id:next.id,level:1,rarity:next.legendaryOnly?'legendary':'normal'}]});add.textContent='+ AJOUTER · '+list.length+' / 6';this.paint(true);
 }
 paint(force=false){const s=this.getState();if(!s?.training||this.root.hidden)return;const meter=s.training.meter;if(!force&&meter.clock-this.lastPaint<.1)return;this.lastPaint=meter.clock;for(const [id,value]of [['trainingDps',meter.dps],['trainingTotal',meter.total],['trainingBest',meter.best]]){const node=this.root.querySelector('#'+id);if(node)node.textContent=number(value);}}
}
