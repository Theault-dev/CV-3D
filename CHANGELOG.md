# Changelog

Toutes les modifications notables de ce projet sont documentées ici.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Unreleased]

### Added

- Chargement du modèle 3D du personnage depuis un fichier FBX (`/models/character.fbx`)
- Support du FBXLoader de three-stdlib pour l'import de modèles FBX
- Avatar temporaire affiché pendant le chargement du modèle FBX
- Mur frontal transparent dans les salles de période (effet vitrine)
- Système de collision avec les murs des salles de période et du hall
- Détection automatique des limites de salle pour bloquer le joueur
- Scrollbars personnalisées pour le textarea du formulaire de contact
    - Style bleu avec track gris clair pour le thème Minimaliste
    - Style vert avec effet glow pour le thème Terminal

### Changed

- Remplacement du modèle procédural du personnage (cubes) par un modèle FBX
- Configuration automatique des ombres et matériaux pour le modèle FBX
- Positionnement automatique du modèle avec les pieds au niveau du sol
- Correction de l'orientation du modèle FBX pour correspondre au système de contrôle
- Murs des salles de période rendus semi-transparents (opacité 30%)
- `depthWrite: true` pour empêcher de voir à travers les murs
- RoomManager gère maintenant les collisions automatiquement lors des transitions
- Player vérifie les collisions avant tout déplacement
- Thème par défaut du formulaire de contact changé de Minimaliste à Terminal
- Labels du formulaire : "Nom / Entreprise" → "Nom ou Entreprise"
- Formulaire de contact rendu responsive (max-width: 90vw)

### Fixed

- Touches d'action (H, C) bloquées quand un input/textarea a le focus
- Notification de succès rendue non-sélectionnable (user-select: none)
- Messages d'erreur du formulaire : espace réservé pour éviter redimensionnement

## [0.4.0] - 2024-12-16

### Added

- Système de salles de période : chaque porte mène à une salle 3D dédiée
- PeriodRoom : génération procédurale de salles basées sur les données de période
- Cubes de projets interactifs avec overlay de détails (nom, description, technos)
- Trophées de compétences décoratifs sur les murs latéraux
- Téléporteur au fond de chaque salle pour retour au hall
- RoomManager pour gestion des transitions entre hall et salles
- Portes visitées restent visuellement ouvertes (animation rotation panneau)
- Touche Escape pour sortir d'une salle de période
- Transition instantanée entre hall et salles (toggle visibility)
- Retour au hall à la position d'origine (0, 0, 5)
- Chargement dynamique des portes depuis l'API au démarrage
- Positionnement automatique des portes selon leur type (formation/travail)
- Support du champ `type` dans l'interface Periode
- Tri chronologique des portes par date de début
- Placement des formations sur le mur gauche (ancien→récent de l'entrée vers le fond)
- Placement des travaux sur le mur du fond (ancien→récent de gauche à droite)
- Fonction calculateRoomDimensions() pour ajuster la taille de la salle selon le nombre de portes
- Fonction calculateDoorPosition() pour calcul automatique des positions avec dimensions dynamiques
- Fonction initializeWorld() asynchrone pour chargement API et création de la salle
- Gestion d'erreur avec salle par défaut et porte fallback en cas d'échec de l'API
- Espacement minimum de 3 unités entre les portes pour éviter le chevauchement
- Dimensions adaptatives de la salle (min: 10x8, max: 25x20)

### Changed

- Suppression des 3 portes hardcodées dans main.ts
- Les portes sont maintenant générées dynamiquement au démarrage
- La salle s'adapte automatiquement au nombre de portes sur chaque mur
- Espacement dynamique des portes selon leur nombre et les dimensions de la salle
- Les positions des portes sont calculées relativement aux dimensions de la salle (-width/2, -depth/2)

### Fixed

- Animation d'ouverture des portes : pivot correct sur le bord gauche (rotation -90°)
- Priorité touche Escape : ferme d'abord les overlays avant de sortir d'une salle
- Nettoyage des labels CSS2D lors du retour au hall (plus de texte fantôme)
- Poignées de porte ajoutées des deux côtés (avant et arrière) pour plus de réalisme

### Technical

- Ajout du champ `type: 'formation' | 'travail'` à l'interface Periode
- Utilisation du top-level await pour initializeWorld()
- Les portes de formation utilisent une rotation de 90° (mur gauche)
- Les portes de travail utilisent une rotation de 0° (mur du fond)
- Algorithme de dimensionnement : minSpacing \* doorCount + margins (avec min/max)

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
