# MathDrill conseil

Application d'entraînement au calcul mental pour les études de cas de conseil (MathBook : réflexes, calculs de case, Deal). Elle s'utilise sur téléphone, y compris hors ligne.

- App : https://mathisazz-tech.github.io/mathbook-drill-conseil/
- La progression est stockée sur l'appareil (localStorage `mathdrill.v3`). Pour la sauvegarder ou changer de téléphone, utilise l'onglet Sauvegarde (export / import JSON).
- Fichiers publiés à la racine : `index.html`, `sw.js` (hors ligne), `manifest.webmanifest`, icônes.
- `src/` : sources. Lance `python3 src/build3.py` depuis un dossier qui contient les sources pour régénérer les fichiers publiés.
- `tests/` : tests Node et Playwright.
