# Décors et bestiaires — 0.5.3

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
