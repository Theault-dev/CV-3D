# Contribuer au projet

Merci de ton intérêt pour ce projet ! Voici comment contribuer.

## 🔀 Workflow Git

Ce projet utilise un workflow basé sur les Pull Requests :

1. **Jamais de push direct sur `main`**

2. Crée une branche depuis `main` :

```bash
   git switch main
   git pull origin main
   git switch -c feature/ma-fonctionnalite
```

3. Fais tes modifications et commit :

```bash
   git add .
   git commit -m "feat: description de la fonctionnalité"
```

4. Pousse ta branche :

```bash
   git push origin feature/ma-fonctionnalite
```

5. Crée une Pull Request sur GitHub

## 📝 Convention de commits

Ce projet suit [Conventional Commits](https://www.conventionalcommits.org/) :

| Préfixe     | Usage                                 |
| ----------- | ------------------------------------- |
| `feat:`     | Nouvelle fonctionnalité               |
| `fix:`      | Correction de bug                     |
| `docs:`     | Documentation                         |
| `style:`    | Formatage (pas de changement de code) |
| `refactor:` | Refactorisation                       |
| `test:`     | Ajout de tests                        |
| `chore:`    | Maintenance (deps, config...)         |

Exemple : `feat: ajouter la salle ENSICAEN`

## 🧪 Avant de soumettre

-   [ ] Le projet build sans erreur (`npm run build`)
-   [ ] Le code est formaté (`npm run format` si configuré ou `npx prettier --write "src/**/*.ts"`)
-   [ ] Les types TypeScript sont corrects (pas d'erreurs dans VS Code)

## 🏗️ Architecture

Voir le README pour la structure des dossiers. En résumé :

-   `core/` : Moteur Three.js, ne devrait pas changer souvent
-   `world/` : Ajouter des salles/objets ici
-   `player/` : Logique du personnage
-   `data/` : Types partagés
