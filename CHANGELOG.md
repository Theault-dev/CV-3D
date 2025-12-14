# Changelog

Toutes les modifications notables de ce projet sont documentées ici.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Unreleased]

### Added

- Formulaire de contact avec deux thèmes (Minimaliste et Terminal)
- Validation en temps réel des champs avec messages d'erreur français
- Toggle de thème avec préservation des données saisies
- Intégration avec ApiService pour envoi des messages
- Loader avec durée minimale de 500ms lors de la soumission
- Notification de succès style Xbox avec animations slide-up/down
- Gestion de la touche C pour ouvrir le formulaire de contact
- Animation d'ouverture du formulaire depuis le bouton HUD
- HUD permanent affichant les raccourcis clavier disponibles
- Système d'overlay centralisé avec gestion de pile (LIFO)
- Animations d'ouverture/fermeture des overlays depuis le bouton déclencheur
- Blocage automatique des inputs du jeu quand un overlay est actif
- Fermeture des overlays via touche Échap, bouton X ou clic sur backdrop

## [0.2.0] - 2024-12-08

### Added

- Labels au-dessus des portes (titre + dates) avec CSS2DRenderer
- Moteur 3D avec Three.js (Engine)
- Gestion des contrôles clavier ZQSD (InputManager)
- Personnage jouable avec caméra TPS (Player)
- Système de pièces avec murs (Room)
- Portes interactives avec highlight (Door)
- Service de connexion à l'API backend (ApiService)
- Interface d'interaction "Appuyez sur E" (InteractionPrompt)
- Types TypeScript pour les données CV
- Configuration Prettier et EditorConfig

### Changed

- Index.html avec favicon et titre personnalisé

## [0.1.0] - 2024-12-07

### Added

- Création du repository
- Documentation (README, CONTRIBUTING, LICENSE)
- CI/CD avec GitHub Actions
- Setup initial du projet avec Vite + TypeScript
- Configuration devcontainer pour le développement
