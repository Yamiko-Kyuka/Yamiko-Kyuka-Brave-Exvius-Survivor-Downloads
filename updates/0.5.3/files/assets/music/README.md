# Musiques originales de combat

Quatre compositions originales de JRPG en OGG stéréo, environ une minute chacune, lues en boucle. Elles sont produites par `tools/build_music.py` avec NumPy et FFmpeg, sans enregistrement ni mélodie extraite des jeux Final Fantasy.

- Midgar : **Mako — alerte réacteur**, 136 BPM ; ostinato de basse et tension industrielle.
- Zanarkand : **Échos des priants — combat**, 124 BPM ; cloches, nappes et ligne mélodique lumineuse.
- Tour de Cristal : **Ascension des cristaux**, 144 BPM ; arpèges et accents majestueux.
- Monde des Ténèbres : **Le néant s’éveille**, 132 BPM ; progression sombre et tension chromatique.

Ces pistes adaptent l’ambiance des lieux au combat ; elles ne sont pas des arrangements des thèmes officiels. `manifest.json` conserve leurs titres, durées et tempos. Leur génération n’est pas nécessaire au lancement ou à la compilation de l’installateur : les fichiers audio sont déjà livrés. Les réglages musique/volume sont indépendants des effets sonores et sauvegardés avec les options du joueur.

Le fichier `menu.mp3` est le thème fourni par l’utilisateur. Il est copié sans réencodage, son empreinte est conservée dans le manifeste, et le lecteur le boucle dans les menus, en conservant la lecture entre leurs écrans. Le volume et l’option musique s’appliquent aux menus et aux zones.

`zanarkand.mp3` est également fourni par l’utilisateur et remplace la piste originale dans cette zone. Son empreinte est conservée ; la lecture boucle en fin de morceau. L’ancienne composition OGG reste comme référence locale.

Les fichiers fournis `dark-world.mp3` et `crystal-tower.mp3` remplacent également les anciennes pistes dans ces zones. Ils sont lus en boucle, avec le même volume et le même interrupteur de musique. Les anciens OGG restent comme références.

`victory.mp3` joue une seule fois après une victoire. Il ne boucle pas ; les menus reprennent leur thème au retour. Une défaite ne joue pas cette fanfare.

`menu-click.mp3` et `level-up.mp3` sont les bruitages fournis pour les boutons du menu principal et chaque montée de niveau, y compris les niveaux offerts par les boss. Ils jouent sans boucle, sur un canal indépendant de la musique, et respectent l’option Effets sonores.
