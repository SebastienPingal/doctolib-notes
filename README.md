# DoctoNote

DoctoNote est une extension pour Chrome et Firefox qui affiche les notes Google Maps des médecins directement sur leur profil Doctolib.

## Fonctionnalités

- Affichage des notes Google Maps sur les pages de profil des médecins
- Affichage des notes directement dans les résultats de recherche de médecins
- Affichage du nombre d'avis
- Interface simple et intuitive qui s'intègre au design de Doctolib

## Installation

Les manifests sont générés par navigateur (Chrome en Manifest V3, Firefox en Manifest V2) :

```bash
node build.js
```

Pour publier, `pnpm zip` construit puis crée `dist/doctonote-chrome-<version>.zip` (Chrome Web Store) et `dist/doctonote-firefox-<version>.zip` (addons.mozilla.org).

### Chrome

1. Ouvrez `chrome://extensions/` et activez le "Mode développeur"
2. Cliquez sur "Charger l'extension non empaquetée"
3. Sélectionnez le dossier `dist/chrome`

### Firefox

1. Ouvrez `about:debugging#/runtime/this-firefox`
2. Cliquez sur "Charger un module temporaire..."
3. Sélectionnez `dist/firefox/manifest.json`

## Utilisation

1. Visitez [Doctolib](https://www.doctolib.fr/)
2. Naviguez jusqu'à la page de recherche de médecins ou un profil médecin
3. Les notes Google Maps s'afficheront automatiquement sur la page

## Fonctionnement

- `content.js` est injecté sur `doctolib.fr`, repère les fiches médecin (résultats de recherche et profil) et interroge le backend.
- `server.js` (déployé sur Vercel, `https://doctolib-notes.vercel.app`) appelle l'API Google Places Text Search avec `GOOGLE_MAPS_API_KEY`.
- Les notes sont mises en cache 7 jours dans `storage.local`.

Les sélecteurs CSS de Doctolib sont regroupés en tête de `content.js` : si Doctolib change son DOM, c'est là qu'il faut les mettre à jour.

## Structure des fichiers

- `manifest.base.json` + `manifest.chrome.json` / `manifest.firefox.json` : fusionnés par `build.js`
- `content.js` : script injecté dans les pages Doctolib
- `popup.html` / `popup.js` : popup de l'extension
- `styles.css` : styles des badges injectés
- `server.js` / `vercel.json` : backend
- `icons/` : icônes de l'extension

## Licence

Ce projet est sous licence MIT. 