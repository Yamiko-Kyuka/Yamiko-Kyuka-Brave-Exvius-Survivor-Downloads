# Bibliothèque originale FFBE

Source : https://www.spriters-resource.com/mobile/finalfantasybraveexvius/
Les 1 226 ressources disponibles sur cette page ont été téléchargées (4 716 089 172 octets). Ce catalogue ne garantit pas de contenir toutes les ressources existantes du jeu original.

- originals/ : toutes les archives et images d’origine, conservées sur disque et dans le build complet, ignorées par Git.
- catalog.json et download-report.json : sources, résultats de téléchargement, tailles et SHA-256. Les ZIP ont été vérifiés par CRC.
- resource-index.json : les 42 596 membres d’origine, avec leurs emplacements dans les ZIP, dimensions, types et propriétaire. Les tuiles dérivées sont marquées derived.
- animation-catalog.json : les 1 226 entrées et leurs variantes.
- animation-data/ : les animations de chaque personnage et variante, avec les cellules occupées et les points d’ancrage.
- animation-tiles/ : découpes dérivées des planches trop grandes. Les séquences et les images d’origine restent intactes ; les tuiles sont chargées progressivement.
- animation-coverage.json : nombres d’entrées, de variantes, de séquences et erreurs d’import.
- characters/ et monsters/ : extractions de la version 0.1, désormais remplacées en jeu par la bibliothèque complète.

Régénération : `python3 tools/download_assets.py`, puis `python3 tools/import_animations.py`, `python3 tools/link_partial_sets.py` et `python3 tools/tile_animations.py`. L’importeur nécessite Pillow et NumPy. TLS, SHA-256 et CRC restent actifs.

Les grilles sont inférées à partir des séparations transparentes et les cellules vides sont écartées. Les images originales ont été décodées pendant l’import sans erreur. Cela ne remplace pas une revue visuelle exhaustive des cadrages et points d’ancrage. Les planches composites peuvent nécessiter une découpe manuelle pour des événements de combat précis.

Les crédits des contributeurs restent dans les archives lorsque présents ; la provenance de chaque ressource est conservée par son URL. Les téléchargements n’accordent pas de droits supplémentaires sur les personnages ou images.
