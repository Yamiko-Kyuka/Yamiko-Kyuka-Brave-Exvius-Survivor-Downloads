# Décors et bestiaires — 0.6.2

Les quatre cartes utilisent désormais les atlas `tiles/*-v2.webp` et les aperçus `previews/*-v2.png`, exportés depuis le vrai moteur. Les sols sont calmes et les détails se concentrent sur l’architecture. Zanarkand représente une cité détruite sans stade ; Midgar son infrastructure de réacteurs ; la Tour des piliers de cristal bleu ; le Monde des ténèbres des plateformes et ruines monumentales suspendues dans une tempête rouge et violette, selon la direction demandée pour FFXIV. Les accès aux galeries externes étant bloqués, ces décors sont des adaptations originales de ces repères, sans comparaison vérifiée à des artworks officiels consultables.

Chaque zone propose dix espèces ordinaires et trois élites. Quatre familles ouvrent le niveau ; deux arrivent à une minute, deux à deux minutes et les deux dernières à quatre minutes. Les 37 identités FFBE distinctes ont été vérifiées dans les données épinglées ; elles sont consignées dans `bestiary-v0.6.2.json`. Le rapprochement avec les zones reste une adaptation de familles pour le fan game.

Les monstres ordinaires sont agrandis de 50 %. Les élites gagnent encore 50 % de taille, six fois les PV ordinaires et un tir propre à leur famille. Les portails annoncent les arrivées, à 160–380 unités du joueur, sur sol praticable et libre. Une fenêtre d’élite apparaît toutes les trente secondes de vagues normales, en dehors des rendez-vous de boss. Leurs cristaux garantissent un niveau avec 20 % de chances de deux niveaux. Les consommables instantanés ordinaires restent rares (0,5 % par élimination).

Les bases des obstacles et leurs collisions utilisent le même plan fixe. Les objets architecturaux conservent leurs proportions, sur des fondations solides adaptées à leur empreinte. Le ciel du Monde des ténèbres est rendu au-delà des plateformes ; il ne remplace pas le sol praticable. `guide/cartes-obstacles.png` montre les quatre plans actuels et les obstacles en rouge. Les musiques fournies restent affectées aux mêmes identifiants de zone.

## Historique 0.5.3–0.6.0

Les niveaux sont assemblés à partir de textures de sol et d’architecture (`tiles/*.webp`), suivant les plans fixes et nommés de `src/level-plans.js`. Ces textures sont des illustrations originales générées pour les quatre thèmes ; leur encodage WebP sans perte a été vérifié pixel par pixel. Les aperçus `previews/*.png` sont des captures du rendu des plans complets, pas des propositions de carte différentes du jeu.

Midgar possède une chambre du réacteur, une salle de contrôle, des ateliers, une salle de générateurs et un quai de fret, reliés par des coursives de maintenance. Zanarkand relie une place des priants, un temple, des jardins et une esplanade avec des ponts sur l’eau. La Tour articule une grande nef, deux chapelles, les reliquaires et la salle du trône. Les Ténèbres relient cinq îlots distincts par des passerelles. Tous les chemins restent connectés, avec des itinéraires de contournement.

Les machines, colonnes, murs en ruine, cristaux et monuments ont une position, un nom et une empreinte solide déclarés dans ces plans. Le rendu et les collisions utilisent ces mêmes empreintes. L’architecture ne se répartit pas au hasard sur une illustration répétée. Les anciennes images `midgar.png`, `zanarkand.png`, `crystal-tower.png` et `dark-world.png` restent comme références dans le dépôt ; elles ne sont plus utilisées pour dessiner les niveaux ni incluses dans le petit installateur.

Les noms et identifiants des sprites ont été vérifiés dans [monster_ai.json d’aEnigmatic/ffbe](https://github.com/aEnigmatic/ffbe/blob/95727376e82d27acc1290b6dc8ad27ce3c89ea71/monster_ai.json), consulté le 13 octobre 2026. Les identifiants des entrées d’IA commencent par l’identifiant de leur sprite ; seuls les champs `monster` renseignés ont servi à confirmer les correspondances. Les archives FFBE et leurs empreintes restent dans `assets/download-report.json`.

| Zone | Familles FFBE utilisées | Élites |
| --- | --- | --- |
| Midgar | Dire Rat `1010010`, Foot Soldier `1050310`, Searcher `1060020` | Guard Scorpion `4060810`, Air Buster `4060910` |
| Zanarkand | Zombie Soldier `1050320`, Red Marshmallow `1030130`, Behemoth `3010110`, Ancient Objet d’Art `1100170` | Behemoth `3010110` |
| Tour de Cristal | Sorcerer `1050110`, Green/Yellow/Red Dragon `4070430` / `4070420` / `4070410` | Xande `4050210` |
| Monde des Ténèbres | Dark Elemental `1080110`, Bloody Eye `1040030`, Archeodemon `3040510` | Cerberus `3011010`, 2-Headed Dragon `4070210` |

Le Scorpion gardien et Air Buster, les dragons et Xande, Cerbère et le Dragon à deux têtes représentent leurs lieux d’origine. Les autres sprites sont des adaptations de familles FFBE : patrouilles et robots pour Midgar ; morts-vivants, flans, béhémoths et gardiens anciens pour Zanarkand ; sorciers pour la tour ; ombres, yeux volants et démons pour les ténèbres. Il ne s’agit pas d’un export exact du tableau des rencontres de FF VII, X ou III. Un sprite manquant n’est pas renommé comme s’il s’agissait d’un autre monstre.

Les pages de bestiaire de Final Fantasy Wiki ont aussi été recherchées, mais leur lecture est bloquée par la politique réseau de cette instance. Les données FFBE accessibles ont permis de vérifier les identités effectivement livrées. Le rapprochement avec les zones est un choix de conception du fan game ; ne pas présenter les familles adaptées comme des rencontres canoniques exactes.

Les vagues ne prennent que des identifiants déclarés pour leur zone. Deux familles ouvrent l’expédition, puis les suivantes entrent après 60 et 120 secondes. Une élite apparaît toutes les deux minutes, avec davantage de PV, un modèle plus grand et une attaque annoncée. Les avertissements fixent la cible avant l’impact pour permettre le dash.

À cinq minutes, les superboss demandés remplacent les vagues : Jenova, Jecht, l’Empereur de FF II et Cloud of Darkness, respectivement. Le choix de l’Empereur pour la Tour de Cristal suit la demande de conception ; Xande reste une élite. Jecht, l’Empereur et Cloud of Darkness utilisent leurs propres variantes FFBE. Le sprite de Jenova est une interprétation originale générée, faute de planche de ce boss dans les ressources téléchargées ; ses trois poses d’attente et trois attaques sont dans `assets/bosses/jenova.png`. Chaque boss tué donne un cristal de niveau.

Le guide `guide/cartes-obstacles.png` montre le rendu des quatre plans avec un voile rouge sur chaque cellule bloquée, les obstacles numérotés et le point de départ en turquoise. Il est inclus dans le build pour consultation hors du jeu. Le guide ne modifie pas les couleurs des niveaux en combat.

### Reliquaire du Dragon Zombie (0.5.11)

Le reliquaire ouest existant de la Tour de Cristal est temporairement scellé pendant la rencontre. Son plan de collision est aussi celui du rendu. Le boss utilise le dragon squelettique FFBE `2120010` du pack `asset-89673`, et les invocations le squelette `1120010` du pack `asset-89643`, avec leurs animations originales `idle` et `atk`. « Dragon Zombie » désigne ici le boss scénarisé du jeu ; ce sprite ne constitue pas une identification officielle d’une variante FFIII.

Correction 0.5.12 : le Bone Dragon `2120010` de la première version est remplacé par le **Dracozombie / ドラゴンゾンビ `3120810`**. Identité confirmée dans `monster_skillsets.json`, entrée `312081000`. L’atlas original est conservé sans modification ; les quatre poses natives d’attente et la séquence d’attaque CGS sont utilisées. Les sources GitHub épinglées, tailles et SHA-256 sont dans `assets/bosses/dracozombie/provenance.json`. Le masque d’ombre de l’atlas n’est pas une animation de corps et laisse place à l’anneau au sol du moteur.

### Arènes de raid — 0.6.0

Les niveaux durent six minutes de survie. Les arènes intermédiaires sont des chambres fixes de 12 × 12 cellules, les finales de 16 × 16, rattachées aux lieux nommés du niveau ; leur plan de terrain est aussi celui du rendu. Les obélisques de la mécanique d’abri sont des props solides de ce même plan. Les chaînes, projectiles, objectifs et zones dangereuses sont affichés par le moteur. Le timer de survie est suspendu, tandis qu’une horloge de combat fait croître les dangers au sol et fermer les bords de l’arène.

Les mécaniques sont décrites dans `src/boss-encounters.js` et `src/arena-mechanics.js`. Chaque boss intermédiaire introduit une mécanique distincte ; les finales en combinent trois. La barrière revient à mi-vie ; les dégâts ne peuvent pas traverser cette transition. Les erreurs relancent la mécanique concernée sans annuler l’enrage.

Le Gardien des limbes de Zanarkand utilise le **Spectral Keeper `3020510` / 魔天のガーディアン**, confirmé dans les données FFBE (entrée `302051000`). Son atlas original et les CSV natifs sont conservés sans retouche, avec les empreintes dans `assets/bosses/spectral-keeper/provenance.json`. Les différentes parties du corps sont composées au rendu selon leur ordre, opacité et mode additif natifs.
