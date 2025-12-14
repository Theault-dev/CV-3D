# Changelog

Toutes les modifications notables de ce projet sont documentées ici.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Unreleased]

## [0.3.0] - 2024-12-14

### Added

- Composant KeyButton réutilisable pour afficher des touches de clavier stylisées en 3D
    - Trois tailles disponibles : small (32px), medium (48px), large (64px)
    - Effet de profondeur avec dégradés et ombres portées
    - Aspect "key cap" de clavier mécanique moderne
    - Animation au survol simulant l'enfoncement
- Indicateur de touches de déplacement (KeyboardIndicator)
    - Détection automatique du layout clavier (AZERTY/QWERTY)
    - Trois méthodes de détection : Keyboard API, localStorage, langue du navigateur
    - Affichage automatique au chargement pendant 5 secondes
    - Toggle on/off avec la touche H
    - Animations slide-up/slide-down fluides (300ms)
    - Timer auto-hide de 5 secondes qui se reset à chaque affichage
    - Positionnement en bas de l'écran avec backdrop-filter
    - Sauvegarde du layout détecté dans localStorage pour apprentissage
- Gestion de la touche H pour afficher/masquer l'indicateur de déplacement
- Label HUD de la touche H mis à jour : "Touches de déplacement"
- Formulaire de contact avec deux thèmes (Minimaliste et Terminal)
- Validation en temps réel des champs avec messages d'erreur français
- Toggle de thème avec préservation des données saisies
- Intégration avec ApiService pour envoi des messages
- Loader avec durée minimale de 500ms lors de la soumission
- Notification de succès style Xbox avec animations slide-up/down
- Gestion de la touche C pour ouvrir/fermer le formulaire de contact (toggle)
- Animation d'ouverture du formulaire depuis le bouton HUD
- HUD permanent affichant les raccourcis clavier disponibles
- Système d'overlay centralisé avec gestion de pile (LIFO)
- Animations d'ouverture/fermeture des overlays depuis le bouton déclencheur
- Blocage automatique des inputs du jeu quand un overlay est actif
- Fermeture des overlays via touche Échap, bouton X ou clic sur backdrop

### Changed

- Refactorisation de InteractionPrompt pour utiliser le composant KeyButton
    - Cohérence visuelle avec le reste de l'UI
    - Remplacement de la touche E stylée en dur par le composant réutilisable
- Ajout des styles CSS modulaires :
    - key-button.css : composant de touche réutilisable
    - keyboard-indicator.css : indicateur de touches de déplacement
- Refactorisation CSS : séparation du fichier style.css (508 lignes) en modules :
    - base.css : styles de base et reset
    - door-labels.css : labels des portes 3D
    - hud.css : affichage du HUD
    - overlay.css : système d'overlay
    - contact-form.css : formulaire de contact avec thèmes
    - success-notification.css : notification de succès
- Animation de fermeture des overlays retourne désormais vers le bouton déclencheur
- Ajustement de l'ombre des overlays pour meilleur alignement visuel (décalage vertical -5px)
- Nettoyage des console.log de débogage dans ApiService

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
