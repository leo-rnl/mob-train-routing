# Workflow de développement

Ce document définit les règles de workflow applicables à tout le projet, indépendamment du plan de développement.

## Stratégie de branches
```
main                    # Production-ready, protégée, jamais de push direct
└── develop             # Branche d'intégration
    └── phase/*         # Branches de travail par phase
```

### Règles

- `main` : uniquement des merges depuis `develop` via `--no-ff`
- `develop` : intégration des phases terminées
- `phase/*` : travail en cours, nommage `phase/X-description`

### Cycle de vie d'une phase
```bash
# 1. Créer la branche
git checkout develop
git pull origin develop
git checkout -b phase/X-name

# 2. Développer (commits atomiques)
# ... voir règles de commit ci-dessous

# 3. Merger dans develop
git checkout develop
git merge phase/X-name --no-ff
git push origin develop
git branch -d phase/X-name
```

---

## Convention de commits (Conventional Commits)

### Format
```
<type>(<scope>): <description>

[body optionnel]

[footer optionnel]
```

### Types autorisés

| Type | Usage |
|------|-------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `test` | Ajout ou modification de tests uniquement |
| `refactor` | Refactoring sans changement fonctionnel |
| `docs` | Documentation uniquement |
| `chore` | Maintenance (deps, config, tooling) |
| `ci` | Modifications CI/CD |

### Scopes autorisés

`backend`, `frontend`, `docker`, `ci`, `docs`

### Règles de rédaction

- Langue : **anglais**
- Casse : **lowercase** (sauf noms propres)
- Temps : **impératif présent** ("add" pas "added" ni "adds")
- Ponctuation : **pas de point final**
- Longueur : **max 72 caractères** première ligne
- Atomicité : **un commit = une unité logique**

### Exemples valides
```
feat(backend): implement Dijkstra algorithm in GraphService
test(backend): add unit tests for GraphService
fix(frontend): handle 422 error on invalid station
docs: add API authentication section to README
chore(docker): optimize backend Dockerfile for production
ci: add security scanning job to workflow
```

### Exemples invalides
```
❌ Added new feature          # Passé, pas de type
❌ feat: stuff                 # Trop vague, pas de scope
❌ feat(backend): Add thing.   # Majuscule, point final
❌ fix(backend): fixed the bug and also refactored some code  # Pas atomique
```

---

## Checklist avant commit

### Séquence obligatoire

Exécuter **dans l'ordre** avant chaque commit :
```bash
# === BACKEND ===
cd backend

# 1. Lint PSR-12
composer phpcs
# Si erreurs → corriger avant de continuer

# 2. Analyse statique
composer phpstan
# Si erreurs → corriger avant de continuer

# 3. Tests + coverage
php artisan test --coverage
# Si coverage < 80% ou tests fail → corriger avant de continuer

# === FRONTEND ===
cd ../frontend

# 1. Lint + format
npm run lint
# Si erreurs → corriger avant de continuer

# 2. Type check
npm run type-check
# Si erreurs → corriger avant de continuer

# 3. Tests + coverage
npm run test:coverage
# Si coverage < 80% ou tests fail → corriger avant de continuer
```

### Règle TDD

Pour toute nouvelle fonctionnalité :

1. **Écrire le test** qui échoue
2. **Implémenter** le code minimal pour passer
3. **Refactor** si nécessaire
4. **Vérifier** lint + coverage
5. **Commit**

### Seuils de coverage

| Composant | Seuil minimum | Cible |
|-----------|---------------|-------|
| Backend global | 80% | 85%+ |
| GraphService | 95% | 100% |
| Controllers | 90% | 95% |
| Frontend global | 80% | 85%+ |

---

## Validation avant merge

### Merge phase/* → develop

Avant de merger une phase dans develop :
```bash
# 1. Rebase sur develop à jour
git checkout phase/X-name
git fetch origin
git rebase origin/develop

# 2. Full validation
cd backend
composer phpcs && composer phpstan && php artisan test --coverage

cd ../frontend
npm run lint && npm run type-check && npm run test:coverage

# 3. Build Docker (vérifier que ça compile)
docker compose build

# 4. Si tout passe → merge
git checkout develop
git merge phase/X-name --no-ff
```

### Merge develop → main (release)

Avant de merger dans main :
```bash
# 1. Tests complets en environnement Docker
docker compose down -v
docker compose up -d --build
docker compose exec backend php artisan test
docker compose exec frontend npm run test

# 2. Test manuel E2E
# - Login fonctionne
# - Calcul de route fonctionne
# - Stats s'affichent

# 3. Merge + tag
git checkout main
git merge develop --no-ff -m "release: vX.Y.Z - Description"
git tag -a vX.Y.Z -m "Description"
git push origin main --tags
```

---

## Gestion des erreurs

### Test qui échoue

1. Ne **jamais** skip ou ignorer
2. Corriger le code OU corriger le test si mal écrit
3. Re-run toute la suite avant commit

### Coverage insuffisant

1. Identifier les lignes non couvertes
2. Ajouter les tests manquants
3. Ne pas baisser le seuil

### Lint qui échoue

1. Corriger toutes les erreurs (pas de `// @ts-ignore` ou `// phpcs:ignore`)
2. Exception : si faux positif documenté, ajouter ignore avec commentaire explicatif

---

## Gestion du contexte Claude Code

### Alerte de saturation

Lorsque le contexte approche **80% de sa capacité**, Claude doit :

1. **Alerter** : "⚠️ Contexte à ~80%. On devrait conclure cette session."
2. **Proposer** : terminer la tâche en cours ou trouver un point d'arrêt propre
3. **Documenter** : alimenter le fichier de reprise avant de conclure

### Fichier de reprise : `.claude/current_context.md`

> ⚠️ Ce fichier est **gitignored** — il sert uniquement à la continuité entre sessions.

Avant de conclure une session saturée, Claude génère/met à jour ce fichier avec :
```markdown
# Current Context - [Date ISO]

## Dernière phase active
phase/X-name

## Tâche en cours
Description concise de ce qui était en train d'être fait.

## État
- [x] Étapes terminées dans cette session
- [ ] Prochaine étape immédiate

## Fichiers modifiés (non commités)
- path/to/file.php — description changement
- path/to/autre.ts — description changement

## Blocages / Questions ouvertes
- Point bloquant ou décision en attente (si applicable)

## Commande pour reprendre
La commande ou action exacte pour continuer.
```

### Règles de rédaction

- **Concis** : max 30-40 lignes
- **Actionnable** : la prochaine étape doit être claire
- **Pas de code** : uniquement références aux fichiers, pas de dumps
- **Daté** : toujours inclure la date ISO en en-tête

### Reprise de session

Au démarrage d'une nouvelle session, si `.claude/current_context.md` existe :

1. Claude le lit en priorité
2. Résume l'état en une phrase
3. Propose de continuer ou de repartir fresh

Une fois la reprise effectuée et la tâche terminée, **supprimer le contenu** du fichier (ou le vider) pour éviter toute confusion lors des sessions suivantes.

---

## Commandes de référence

### Backend
```bash
composer phpcs              # Lint PSR-12
composer phpcs:fix          # Auto-fix PSR-12
composer phpstan            # Analyse statique niveau 6
php artisan test            # Tests
php artisan test --coverage # Tests + rapport coverage
php artisan test --filter=X # Tests filtrés
```

### Frontend
```bash
npm run lint                # ESLint + Prettier check
npm run lint:fix            # Auto-fix
npm run type-check          # TypeScript check
npm run test                # Vitest
npm run test:coverage       # Vitest + rapport coverage
npm run test -- --filter=X  # Tests filtrés
```

### Docker
```bash
docker compose up -d        # Démarrer
docker compose down         # Arrêter
docker compose down -v      # Arrêter + supprimer volumes
docker compose build        # Rebuild images
docker compose logs -f X    # Logs service X
docker compose exec X sh    # Shell dans service X
```

### Git
```bash
git log --oneline -10       # Voir derniers commits
git diff --staged           # Voir ce qui sera commité
git commit --amend          # Modifier dernier commit (avant push)
git rebase -i HEAD~N        # Rebase interactif N commits
```