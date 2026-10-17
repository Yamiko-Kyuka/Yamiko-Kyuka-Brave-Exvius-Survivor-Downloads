// Boss victories, rather than gils or ordinary kills, unlock hero rewards.
export const challengeDifficulties=['normal','crystal','light','aeon','primal','transcendence'];
export const challengeBosses={
 scorpion:{stage:'midgar',name:'Scorpion gardien'},'air-buster':{stage:'midgar',name:'Air Buster'},jenova:{stage:'midgar',name:'Jenova',final:true},
 behemoth:{stage:'zanarkand',name:'Béhémoth'},'spectral-keeper':{stage:'zanarkand',name:'Gardien des limbes'},jecht:{stage:'zanarkand',name:'Jecht',final:true},
 'dragon-zombie':{stage:'crystal-tower',name:'Dragon Zombie'},xande:{stage:'crystal-tower',name:'Xande'},emperor:{stage:'crystal-tower',name:'L’Empereur',final:true},
 cerberus:{stage:'dark-world',name:'Cerbère'},'two-headed':{stage:'dark-world',name:'Dragon à deux têtes'},'cloud-of-darkness':{stage:'dark-world',name:'Cloud of Darkness',final:true}
};
const defeat=(boss,difficulty='normal',count=1)=>({boss,difficulty,count});
const finals=difficulty=>['jenova','jecht','emperor','cloud-of-darkness'].map(id=>defeat(id,difficulty));
export const heroChallenges={
 'asset-70472':[defeat('scorpion','normal',3)],
 'asset-87187':[defeat('air-buster','normal',2)],
 'asset-87186':[defeat('jenova')],
 'asset-87692':[defeat('scorpion','crystal',2)],
 'asset-91127':[defeat('air-buster','crystal',2)],
 'asset-88183':[defeat('behemoth','normal',2)],
 'asset-92746':[defeat('spectral-keeper','normal',2)],
 'asset-88181':[defeat('cloud-of-darkness')],
 'asset-116655':[defeat('xande','crystal')],
 'asset-87214':[defeat('scorpion','light'),defeat('air-buster','light')],
 'asset-87210':[defeat('behemoth','crystal',2)],
 'asset-89281':[defeat('emperor','crystal')],
 'asset-95316':[defeat('dragon-zombie','normal',2)],
 'asset-87391':[defeat('cloud-of-darkness','crystal')],
 'asset-87146':[defeat('dragon-zombie','crystal',2)],
 'asset-87207':[defeat('xande','light')],
 'asset-86770':[defeat('air-buster','light',2)],
 'asset-86769':[defeat('cloud-of-darkness','light')],
 terra:[defeat('jenova','crystal')],
 'asset-87086':[defeat('jenova','aeon')],
 sephiroth:[defeat('jenova','primal')],
 'asset-99240':[defeat('two-headed','crystal',2)],
 'asset-129583':[defeat('spectral-keeper','light',2)],
 'asset-87021':[defeat('air-buster','aeon'),defeat('behemoth','aeon')],
 'asset-87346':[defeat('cloud-of-darkness','aeon')],
 'asset-93680':[defeat('jecht')],
 'asset-105336':[defeat('jecht','aeon')],
 yuna:[defeat('spectral-keeper','crystal'),defeat('jecht','crystal')],
 'asset-87355':[defeat('emperor','light')],
 'asset-109064':[defeat('cerberus','aeon',2),defeat('two-headed','aeon')],
 'asset-88524':[defeat('scorpion','aeon'),defeat('air-buster','aeon'),defeat('jenova','aeon')],
 'asset-93734':finals('crystal'),
 'asset-90421':[defeat('cerberus','crystal')],
 'asset-86630':finals('light'),
 'asset-117465':[defeat('jecht','transcendence'),defeat('cloud-of-darkness','transcendence')]
};
const safeCount=n=>Number.isFinite(n)?Math.min(Number.MAX_SAFE_INTEGER,Math.max(0,Math.floor(n))):0;
export function normalizeBossWins(raw,difficultyWins={},stageWins={}){
 return Object.fromEntries(Object.entries(challengeBosses).map(([id,boss])=>{
  const clears=difficultyWins?.[boss.stage],knownClears=challengeDifficulties.some(d=>safeCount(clears?.[d])>0);
  return [id,Object.fromEntries(challengeDifficulties.map(d=>{
   // A recorded stage clear proves its final boss was defeated. Never infer intermediate kills.
   const proved=boss.final?(safeCount(clears?.[d])||(!knownClears&&d==='normal'?safeCount(stageWins?.[boss.stage]):0)):0;
   return [d,Math.max(safeCount(raw?.[id]?.[d]),proved)];
  }))];
 }));
}
export function heroChallengeProgress(save,heroId){
 const conditions=(heroChallenges[heroId]||[]).map(goal=>{
  const rank=challengeDifficulties.indexOf(goal.difficulty),wins=challengeDifficulties.slice(rank).reduce((sum,d)=>sum+safeCount(save.bossWins?.[goal.boss]?.[d]),0);
  return {...goal,...challengeBosses[goal.boss],wins:Math.min(goal.count,wins),done:wins>=goal.count};
 });
 const current=conditions.reduce((sum,c)=>sum+c.wins,0),total=conditions.reduce((sum,c)=>sum+c.count,0);
 return {conditions,current,total,done:conditions.length>0&&conditions.every(c=>c.done)};
}
export function creditBossVictory(save,run,bossId){
 const boss=challengeBosses[bossId],difficulty=run.difficulty?.id;
 if(!boss||boss.stage!==run.stage?.id||!challengeDifficulties.includes(difficulty)||run.godMode||run.developerMode)return false;
 run.creditedHeroBosses??=[];if(run.creditedHeroBosses.includes(bossId))return false;
 save.bossWins=normalizeBossWins(save.bossWins);
 save.bossWins[bossId][difficulty]=Math.min(Number.MAX_SAFE_INTEGER,save.bossWins[bossId][difficulty]+1);
 run.creditedHeroBosses.push(bossId);return true;
}
