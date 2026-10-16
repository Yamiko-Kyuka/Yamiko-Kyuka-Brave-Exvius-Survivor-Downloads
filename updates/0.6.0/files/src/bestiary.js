// Sprite identities checked against the FFBE monster AI data (see assets/maps/README.md).
// Generic families remain named after their actual FFBE art rather than a missing FF monster.
export const monsters={
 '3020510':{name:'Gardien des limbes',size:195,hp:1,speed:0},
 // Scripted reliquary encounter: Dracozombie (ドラゴンゾンビ), verified FFBE sprite 3120810.
 '3120810':{name:'Dragon Zombie',size:180,hp:1,speed:0},
 '1120010':{name:'Squelette du reliquaire',size:44,hp:1,speed:1},
 '1010010':{name:'Rat géant',size:32,hp:.6,speed:1.25},
 '1050310':{name:'Fantassin',size:42,hp:1,speed:1},
 '1060020':{name:'Robot éclaireur',size:38,hp:1.1,speed:.85},
 '4060810':{special:'scorpion-laser',name:'Scorpion gardien',size:92,hp:1.3,speed:.7},
 '4060910':{special:'mako-salvo',name:'Air Buster',size:94,hp:1.5,speed:.6},
 '1050320':{name:'Soldat zombie',size:42,hp:1.2,speed:.8},
 '1030130':{name:'Flan rouge',size:40,hp:1.1,speed:.75},
 '3010110':{special:'behemoth-quake',name:'Béhémoth',size:62,hp:2.2,speed:.7},
 '1100170':{name:'Gardien de pierre ancien',size:54,hp:1.8,speed:.6},
 '1050110':{name:'Sorcier',size:40,hp:.85,speed:1},
 '4070430':{name:'Dragon vert',size:58,hp:1.5,speed:.85},
 '4070420':{name:'Dragon jaune',size:60,hp:1.7,speed:.8},
 '4070410':{name:'Dragon rouge',size:64,hp:2,speed:.75},
 '4050210':{special:'xande-meteor',name:'Xande',size:86,hp:1.4,speed:.65},
 '1080110':{name:'Élémentaire des ténèbres',size:38,hp:.8,speed:1.2},
 '1040030':{name:'Œil sanglant',size:38,hp:.9,speed:1.15},
 '3040510':{name:'Archidémon',size:56,hp:1.8,speed:.85},
 '3011010':{special:'cerberus-thunder',name:'Cerbère',size:84,hp:1.4,speed:.95},
 '4070210':{special:'twin-breath',name:'Dragon à deux têtes',size:100,hp:1.7,speed:.7}
};
export function zoneEnemies(stage,wave=0){
 // More dangerous families enter later; every entry always belongs to the selected zone.
 return stage.enemies.filter((id,index)=>index<2||wave>=2+(index-2)*2);
}
