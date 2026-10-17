# Icônes d’interface

40 illustrations SVG originales pour les armes du roster, et 5 pour les bonus de statistiques. Elles ont été dessinées pour cette interface ; elles ne sont pas présentées comme des sprites officiels extraits de FFBE.

Les silhouettes représentent l’objet ou le sort associé : épées, katanas, pistolames, arcs, marteau, fusils, grimoires, bâtons, fouet, sphères et magie. Les armes partageant un comportement de combat conservent des illustrations distinctes. Les noms et identifiants restent ceux de src/model.js.

Source des dessins : tools/build_icons.mjs. Régénération : npm run build:icons. L’installateur les incorpore directement, sans téléchargement supplémentaire ; il les régénère avant son build. Les images sont décoratives lorsque le nom est déjà affiché. Les slots d’équipement donnent le nom et le niveau dans leur infobulle et leur libellé accessible.

L’icône de l’application est le cristal d’invocation arc-en-ciel de FFBE, repris de FFBE Equip. Provenance et empreinte : app-icon-source.json. Le même fichier est intégré dans l’exécutable Windows et affecté aux fenêtres du jeu et du lanceur. Le PNG sert aussi de favicon local.
