/** Fixed architectural plans, in 64-unit cells. Nothing here is random. */
const rect=(name,x,y,w,h,style=0)=>({name,shape:'rect',x,y,w,h,style});
const island=(name,cx,cy,rx,ry,style=0)=>({name,shape:'ellipse',x:cx-rx,y:cy-ry,w:rx*2,h:ry*2,style});
export const levelPlans={
 midgar:{passage:'Coursive de maintenance',areas:[
  rect('Salle de contrôle',23,28,31,24),rect('Chambre du réacteur',28,4,24,22),rect('Atelier mécanique',3,30,18,20,1),rect('Salle des générateurs',61,30,16,20,1),rect('Quai de fret',24,61,33,13,1),rect('Poste de refroidissement',7,10,12,12,1)
 ],paths:[[38,25,4,4],[20,37,4,4],[53,37,9,4],[38,51,4,11],[12,21,3,10],[18,16,11,3],[13,49,3,18],[15,65,10,3],[56,66,12,3],[66,49,3,19],[65,19,3,12],[51,18,17,3]],props:[
  {x:33,y:10,w:14,h:8,art:3,name:'Cœur du réacteur'}, {x:28,y:32,w:3,h:8,art:4,name:'Conduites de refroidissement'}, {x:46,y:44,w:5,h:5,art:4,name:'Ventilation'}, {x:63,y:34,w:5,h:5,art:3,name:'Générateur mako'}, {x:68,y:43,w:5,h:4,art:4,name:'Turbines'}, {x:31,y:65,w:9,h:3,art:4,name:'Équipement de chargement'}
 ]},
 zanarkand:{passage:'Passerelles de la cité',areas:[
  island('Place des ruines',40,40,13,12),rect('Quartier haut effondré',27,5,26,20),rect('Quartier inondé',6,28,17,24,1),rect('Rue des vestiges',57,32,17,18,1),rect('Entrée de la cité',26,62,28,13)
 ],paths:[[38,24,4,6],[22,38,8,4],[50,38,8,4],[38,50,4,13],[17,16,11,3],[17,17,3,12],[52,16,14,3],[63,18,3,15],[16,51,3,15],[18,63,9,3],[63,49,3,17],[53,63,12,3]],props:[
  {x:30,y:34,w:3,h:3,art:3,name:'Façade du quartier ouest'},{x:47,y:35,w:3,h:3,art:3,name:'Bâtiment éventré de la place'},{x:32,y:46,w:4,h:2,art:4,name:'Passerelle brisée de la place'},{x:46,y:45,w:3,h:3,art:3,name:'Façade du quartier est'}, {x:31,y:9,w:3,h:3,art:3,name:'Façade du quartier haut'},{x:46,y:9,w:3,h:3,art:3,name:'Façade du quartier haut'},{x:62,y:35,w:6,h:2,art:4,name:'Passerelle effondrée'}
 ]},
 'crystal-tower':{passage:'Galerie de cristal',areas:[
  rect('Grande nef',29,25,22,33),rect('Salle du trône',26,4,28,16),rect('Vestibule',31,65,18,11),rect('Chapelle occidentale',7,30,15,15),rect('Chapelle orientale',58,30,15,15),rect('Reliquaire ouest',11,8,12,12,1),rect('Reliquaire est',57,8,12,12,1)
 ],paths:[[38,19,4,7],[38,57,4,9],[21,35,9,4],[50,35,9,4],[16,19,3,12],[62,19,3,12],[22,12,5,3],[53,12,5,3]],props:[
  {x:31,y:29,w:2,h:4,art:3,name:'Pilier de la nef'},{x:47,y:29,w:2,h:4,art:3,name:'Pilier de la nef'},{x:31,y:48,w:2,h:4,art:3,name:'Pilier de la nef'},{x:47,y:48,w:2,h:4,art:3,name:'Pilier de la nef'}, {x:37,y:7,w:6,h:4,art:4,name:'Estrade du trône'},{x:12,y:33,w:4,h:4,art:3,name:'Cristal du reliquaire'},{x:63,y:33,w:4,h:4,art:3,name:'Cristal du reliquaire'}
 ]},
 'dark-world':{passage:'Passerelle du néant',areas:[
  island('Îlot du sceau',40,40,13,10),island('Rochers des ombres',15,36,9,11,1),island('Sanctuaire brisé',65,38,10,10,1),island('Porte du néant',40,12,10,8),island('Autel des ténèbres',39,67,12,8)
 ],paths:[[22,35,9,3],[50,37,7,3],[39,19,3,12],[36,48,4,12],[38,58,6,4],[14,12,3,15],[16,11,17,3],[62,12,3,18],[48,11,17,3],[15,46,3,21],[17,65,14,3]],props:[
  {x:31,y:36,w:2,h:4,art:3,name:'Cristal corrompu'},{x:47,y:39,w:3,h:3,art:3,name:'Cristal corrompu'},{x:38,y:8,w:4,h:3,art:4,name:'Porte du néant'},{x:66,y:33,w:3,h:3,art:4,name:'Sanctuaire brisé'},{x:12,y:30,w:4,h:4,art:3,name:'Obélisque des ombres'},{x:40,y:63,w:3,h:3,art:4,name:'Autel ancien'}
 ]}
};
