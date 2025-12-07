# CV 3D

Un CV interactif en 3D sous forme de visite virtuelle, développé avec Three.js et TypeScript.

## 🎮 Concept

Explorez mon parcours professionnel comme dans un jeu vidéo ! Naviguez dans un hall avec plusieurs portes, chacune représentant une période de ma carrière :

- 🎓 **ENSICAEN** — Formation d'ingénieur
- 💾 **NXP Semiconductors** — Logiciel embarqué (alternance)
- 🌐 **genOway** — Développement web

## 🛠️ Technologies

- **Frontend** : Three.js, TypeScript, Vite
- **Backend** : Node.js, Express (API séparée)
- **Hébergement** : Raspberry Pi 4, Nginx, Let's Encrypt

## 🚀 Installation

### Prérequis

- Docker Desktop (pour le devcontainer)
- VS Code avec l'extension "Dev Containers"

### Lancer le projet

1. Clone le repo :

```bash
   git clone https://github.com/TON_USERNAME/cv3d.git
   cd cv3d
```

2. Ouvre dans VS Code :

```bash
   code .
```

3. Quand VS Code propose "Reopen in Container", accepte (ou `F1` → "Dev Containers: Reopen in Container")

4. Dans le terminal du conteneur :

```bash
   npm run dev
```

5. Ouvre http://localhost:5173

## 📁 Structure du projet

```
src/
├── assets/          # Images, textures, modèles 3D
├── core/            # Moteur 3D (Engine, InputManager)
├── world/           # Éléments du monde (Room, Door)
├── player/          # Avatar et contrôles
├── data/            # Types TypeScript
└── main.ts          # Point d'entrée
```

## 🎮 Contrôles

| Action    | PC  | Mobile     |
| --------- | --- | ---------- |
| Avancer   | Z   | Joystick ↑ |
| Reculer   | S   | Joystick ↓ |
| Gauche    | Q   | Joystick ← |
| Droite    | D   | Joystick → |
| Interagir | E   | Tap        |

## 📝 License

MIT — voir [LICENSE](LICENSE)
