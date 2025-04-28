# DoctoNote

DoctoNote est une extension pour Chrome et Firefox qui affiche les notes Google Maps des médecins directement sur leur profil Doctolib.

## Fonctionnalités

- Affichage des notes Google Maps sur les pages de profil des médecins
- Affichage des notes directement dans les résultats de recherche de médecins
- Affichage du nombre d'avis
- Interface simple et intuitive qui s'intègre au design de Doctolib

## Installation

### Chrome

1. Téléchargez ou clonez ce dépôt sur votre ordinateur
2. Ouvrez Chrome et accédez à `chrome://extensions/`
3. Activez le "Mode développeur" (en haut à droite)
4. Cliquez sur "Charger l'extension non empaquetée"
5. Sélectionnez le dossier contenant les fichiers de l'extension

### Firefox

1. Téléchargez ou clonez ce dépôt sur votre ordinateur
2. Ouvrez Firefox et accédez à `about:debugging#/runtime/this-firefox`
3. Cliquez sur "Charger un module temporaire..."
4. Naviguez jusqu'au dossier de l'extension et sélectionnez le fichier `manifest.json`

## Utilisation

1. Visitez [Doctolib](https://www.doctolib.fr/)
2. Naviguez jusqu'à la page de recherche de médecins ou un profil médecin
3. Les notes Google Maps s'afficheront automatiquement sur la page

## Remarques importantes

Cette version de l'extension utilise des données fictives pour simuler les notes des médecins. Une implémentation complète nécessiterait:

1. Un serveur backend pour:
   - Rechercher les informations des médecins sur Google Maps
   - Stocker les données en cache pour améliorer les performances

2. Mise en place d'une API Google Maps Places pour obtenir les véritables données de notation

## Développement

### Structure des fichiers

- `manifest.json`: Configuration de l'extension
- `content.js`: Script injecté dans les pages Doctolib
- `popup.html`: Interface utilisateur de l'extension
- `popup.js`: Logique de l'interface utilisateur
- `styles.css`: Styles pour les éléments injectés
- `icons/`: Dossier contenant les icônes de l'extension

### Amélioration possibles

- Ajout d'un système de cache local pour stocker les notes déjà consultées
- Implémentation d'un backend pour récupérer les véritables notes depuis Google Maps
- Ajout de fonctionnalités de filtrage par note minimale
- Support pour d'autres plateformes de prise de rendez-vous médicaux
- Amélioration de la détection des pages de recherche différentes

## Licence

Ce projet est sous licence MIT. 