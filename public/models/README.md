# Modèles 3D (FBX)

Ce dossier contient tous les modèles 3D au format FBX organisés par catégorie.

## 📁 Structure

```
models/
├── characters/          # Personnages jouables (1 modèle)
│   └── AL_Standard.fbx
├── enemies/             # Ennemis (3 modèles)
│   ├── Enemy_EyeDrone.fbx
│   ├── Enemy_QuadShell.fbx
│   └── Enemy_Trilobite.fbx
├── weapons/             # Armes (6 modèles)
│   ├── Gun_Pistol.fbx
│   ├── Gun_Revolver.fbx
│   ├── Gun_Rifle.fbx
│   ├── Gun_SMG_Ammo.fbx
│   ├── Gun_Sniper.fbx
│   └── Gun_Sniper_Ammo.fbx
├── props/               # Objets et décorations (46 modèles)
│   ├── Prop_Ammo.fbx
│   ├── Prop_Barrel1.fbx
│   ├── Prop_Chair.fbx
│   ├── Prop_Chest.fbx
│   ├── Prop_Crate.fbx
│   └── ... (et plus)
├── architecture/        # Éléments de structure (27 modèles)
│   ├── columns/         # Colonnes (4 modèles)
│   ├── doors/           # Portes (2 modèles)
│   ├── floors/          # Dalles de sol (8 modèles)
│   ├── roofs/           # Dalles de toit (11 modèles)
│   ├── stairs/          # Escaliers (1 modèle)
│   └── pipes/           # Tuyaux (1 modèle)
├── details/             # Détails décoratifs (26 modèles)
│   ├── Details_Arrow.fbx
│   ├── Details_Cylinder.fbx
│   ├── Details_Vent_1.fbx
│   └── ... (et plus)
└── walls/               # Murs avec fenêtres/portes (20 modèles)
    ├── Wall_1.fbx
    ├── DoorSingle_Wall_SideA.fbx
    ├── Window_Wall_SideA.fbx
    └── ... (et plus)
```

## 📊 Statistiques

- **Total**: 129 modèles FBX
- **Characters**: 1 modèle
- **Enemies**: 3 modèles
- **Weapons**: 6 modèles
- **Props**: 46 modèles
- **Architecture**: 27 modèles
- **Details**: 26 modèles
- **Walls**: 20 modèles

## 🔧 Utilisation

Pour charger un modèle FBX dans Three.js :

```typescript
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

const loader = new FBXLoader();

// Charger un personnage
loader.load('/models/characters/AL_Standard.fbx', (fbx) => {
    scene.add(fbx);
});

// Charger un ennemi
loader.load('/models/enemies/Enemy_EyeDrone.fbx', (fbx) => {
    scene.add(fbx);
});

// Charger un élément d'architecture
loader.load('/models/architecture/columns/Column_1.fbx', (fbx) => {
    scene.add(fbx);
});
```

## 📝 Notes

- Les fichiers dans `public/` sont servis directement à la racine par Vite
- Les chemins commencent par `/models/` (pas de `public/`)
- Le FBXLoader est inclus dans Three.js (pas besoin de package séparé)
