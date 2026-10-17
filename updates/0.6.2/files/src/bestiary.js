// Sprite identities checked against the FFBE monster AI data (see assets/maps/README.md).
// Generic families remain named after their actual FFBE art rather than a missing FF monster.
export const monsters={
 "1010260":{"name":"Loup aveugle","size":42,"hp":0.8,"speed":1.3},
 "1030150":{"name":"Mousse blanche","size":42,"hp":1.3,"speed":0.65},
 "1030170":{"name":"Bavarois pourpre","size":44,"hp":1.4,"speed":0.7},
 "1040180":{"name":"Azazel","size":56,"hp":1.7,"speed":0.75},
 "1040210":{"name":"Bombo","size":40,"hp":1,"speed":0.9,eliteSpecial:'elite-bomb'},
 "1050020":{"name":"Garde gobelin","size":42,"hp":1.1,"speed":1.1},
 "1050130":{"name":"Mage noir","size":44,"hp":1,"speed":0.8},
 "1050330":{"name":"Soldat de Zoldaad","size":44,"hp":1.2,"speed":0.95},
 "1050340":{"name":"Épéiste des forces spéciales","size":44,"hp":1.3,"speed":1},
 "1050350":{"name":"Porte-hache des forces spéciales","size":48,"hp":1.5,"speed":0.75},
 "1050430":{"name":"Capitaine","size":46,"hp":1.5,"speed":0.85},
 "1060040":{"name":"Robot de signalisation","size":42,"hp":1.35,"speed":0.75},
 "1120410":{"name":"Crâne errant","size":38,"hp":0.75,"speed":1.1},
 "2010210":{"name":"Coeurl","size":46,"hp":1.2,"speed":1.15,eliteSpecial:'elite-coeurl'},
 "2100110":{"name":"Golem","size":64,"hp":2.4,"speed":0.55},
 "2100260":{"name":"Roper des ténèbres","size":48,"hp":1.6,"speed":0.7},
 "2100310":{"name":"Gargouille","size":52,"hp":1.3,"speed":1},
 "2100330":{"name":"Gargouille de roche","size":56,"hp":1.8,"speed":0.75},
 "2120170":{"name":"Gespenst","size":44,"hp":1,"speed":0.95},
 "3010010":{"name":"Chimère","size":62,"hp":2.2,"speed":0.75},
 "3010030":{"name":"Chimère démoniaque","size":66,"hp":2.6,"speed":0.7},
 "3050010":{"name":"Gigas des collines","size":68,"hp":2.5,"speed":0.55},

 '3020510':{name:'Gardien des limbes',size:195,hp:1,speed:0},
 // Scripted reliquary encounter: Dracozombie (ドラゴンゾンビ), verified FFBE sprite 3120810.
 '3120810':{name:'Dragon Zombie',size:180,hp:1,speed:0},
 '1120010':{name:'Squelette du reliquaire',size:44,hp:1,speed:1},
 '1010010':{name:'Rat géant',size:32,hp:.6,speed:1.25},
 '1050310':{name:'Fantassin',size:42,hp:1,speed:1,eliteSpecial:'elite-soldier'},
 '1060020':{name:'Robot éclaireur',size:38,hp:1.1,speed:.85,eliteSpecial:'elite-searcher'},
 '4060810':{special:'scorpion-laser',name:'Scorpion gardien',size:92,hp:1.3,speed:.7},
 '4060910':{special:'mako-salvo',name:'Air Buster',size:94,hp:1.5,speed:.6},
 '1050320':{name:'Soldat zombie',size:42,hp:1.2,speed:.8},
 '1030130':{name:'Flan rouge',size:40,hp:1.1,speed:.75,eliteSpecial:'elite-red-flan'},
 '3010110':{special:'behemoth-quake',name:'Béhémoth',size:62,hp:2.2,speed:.7},
 '1100170':{name:'Gardien de pierre ancien',size:54,hp:1.8,speed:.6,eliteSpecial:'elite-stone'},
 '1050110':{name:'Sorcier',size:40,hp:.85,speed:1,eliteSpecial:'elite-sorcerer'},
 '4070430':{name:'Dragon vert',size:58,hp:1.5,speed:.85,eliteSpecial:'elite-green-dragon'},
 '4070420':{name:'Dragon jaune',size:60,hp:1.7,speed:.8},
 '4070410':{name:'Dragon rouge',size:64,hp:2,speed:.75,eliteSpecial:'elite-red-dragon'},
 '4050210':{special:'xande-meteor',name:'Xande',size:86,hp:1.4,speed:.65},
 '1080110':{name:'Élémentaire des ténèbres',size:38,hp:.8,speed:1.2,eliteSpecial:'elite-dark-elemental'},
 '1040030':{name:'Œil sanglant',size:38,hp:.9,speed:1.15,eliteSpecial:'elite-bloody-eye'},
 '3040510':{name:'Archidémon',size:56,hp:1.8,speed:.85,eliteSpecial:'elite-archdemon'},
 '3011010':{special:'cerberus-thunder',name:'Cerbère',size:84,hp:1.4,speed:.95},
 '4070210':{special:'twin-breath',name:'Dragon à deux têtes',size:100,hp:1.7,speed:.7}
};
export function zoneEnemies(stage,wave=0){
 // More dangerous families enter later; every entry always belongs to the selected zone.
 return stage.enemies.filter((id,index)=>index<4||wave>=(index<6?2:index<8?4:8));
}
