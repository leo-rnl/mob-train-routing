# CLAUDE.md - Train Routing & Analytics

## Contexte projet

Défi technique pour MOB (Montreux Oberland Bernois) - entreprise de gestion du trafic ferroviaire suisse.
Objectif : démontrer des compétences full-stack dans un environnement DevSecOps.

---

## Méthodologie & Assistance IA

### Outils utilisés

Ce projet a été développé avec l'assistance de **Claude Code**, l'outil de développement agentique d'Anthropic, utilisant le modèle **Claude Opus 4.5**.

L'IA a été utilisée pour :
- Analyse et clarification des spécifications
- Génération de code boilerplate et scaffolding
- Assistance à l'implémentation d'algorithmes (Dijkstra)
- Génération de tests unitaires et d'intégration
- Revue de code et suggestions d'amélioration

### Rôle du développeur

L'expertise humaine reste centrale :
- Analyse du besoin métier et prise de décisions architecturales
- Validation et revue de tout code généré
- Choix techniques et arbitrages
- Garantie de la cohérence et de la qualité globale
- Compréhension approfondie de chaque ligne de code

### Reproductibilité on-premise

Le workflow adopté est **entièrement reproductible en environnement local et air-gapped** via :
```
Claude Code + Claude Code Router → LLM local (Ollama, LM Studio, vLLM...)
```

Cette configuration permet :
- **Confidentialité totale** : aucune donnée ne quitte l'infrastructure
- **Compliance** : compatible avec les exigences réglementaires strictes (données sensibles, secteur bancaire, santé, défense)
- **Souveraineté** : modèles hébergés on-premise ou cloud privé

Modèles locaux compatibles testés :
- Llama 3.1 70B / 405B
- Mixtral 8x22B
- DeepSeek Coder 33B
- Qwen 2.5 72B

> Cette adaptabilité démontre que l'expertise développée avec les outils IA modernes est déployable dans des contextes à forte contrainte de confidentialité.

---

## Workflow de développement

Les règles de développement (conventions de commit, stratégie de branches, checklist avant commit, seuils de coverage) sont définies dans :

📄 **[.claude/workflow.md](.claude/workflow.md)**

Ce document est indépendant du plan de développement et s'applique à toutes les phases.

---

## Stack technique

### Backend
- PHP 8.4 (obligatoire)
- Laravel 11
- Laravel Sanctum (authentification API)
- PostgreSQL 16
- PHPUnit avec couverture ≥ 80%
- PSR-12 (PHPCS) + PHPStan niveau 6

### Frontend
- TypeScript 5 (obligatoire)
- Vue 3 + Vuetify 3
- Pinia (state management)
- Vitest avec couverture ≥ 80%
- ESLint + Prettier

### Infrastructure
- Docker + Docker Compose
- Démarrage en une commande : `docker compose up -d`
- GitHub Actions pour CI/CD
- GitHub Container Registry (GHCR) pour les images

---

## Spécification API (OpenAPI 3.1.1)

### Authentification (Sanctum)

**POST /api/v1/auth/token**
```json
// Request
{
  "email": "user@example.com",
  "password": "password",
  "device_name": "frontend"
}

// Response 200
{
  "token": "1|abc123...",
  "expires_at": null
}
```

Usage : `Authorization: Bearer 1|abc123...`

### GET /api/v1/stations

Liste des stations pour l'autocomplétion frontend.

> ⚠️ **Extension** : Endpoint ajouté car nécessaire à l'UX, absent de la spec OpenAPI initiale.

**Query params optionnels:**
- `search` (string): Filtre sur shortName ou longName (LIKE)
- `connected` (boolean, default: true): Si true, retourne uniquement les stations présentes dans le graphe

**Response 200:**
```json
{
  "items": [
    {
      "id": 46,
      "shortName": "MX",
      "longName": "Montreux"
    }
  ]
}
```

### POST /api/v1/routes

Calcule un trajet entre deux stations.

**Request:**
```json
{
  "fromStationId": "MX",
  "toStationId": "ZW",
  "analyticCode": "ANA-123"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "fromStationId": "MX",
  "toStationId": "ZW",
  "analyticCode": "ANA-123",
  "distanceKm": 63.48,
  "path": ["MX", "CGE", "VUAR", "...", "ZW"],
  "createdAt": "2025-01-15T10:30:00Z"
}
```

**Erreurs:**
- 400: Requête invalide (JSON malformé, champs manquants)
- 401: Non authentifié
- 422: Données invalides (station inconnue, pas de chemin)

### GET /api/v1/stats/distances (BONUS)

**Query params:**
- `from` (date, optional)
- `to` (date, optional)
- `groupBy` (enum: none | day | month | year)

**Response 200:**
```json
{
  "from": "2025-01-01",
  "to": "2025-01-31",
  "groupBy": "month",
  "items": [
    {
      "analyticCode": "FRET-001",
      "totalDistanceKm": 1250.5,
      "periodStart": "2025-01-01",
      "periodEnd": "2025-01-31",
      "group": "2025-01"
    }
  ]
}
```

---

## Modèle de données

### Réseau ferroviaire

**Ligne MOB** (65 segments) : Montreux → Zweisimmen, avec bifurcations vers Lenk et Interlaken Ost

**Ligne MVR-ce** (21 segments) : Vevey → Les Pléiades, avec connexion à MOB via Chamby (CABY)

### Hypothèses de conception

| Hypothèse | Justification |
|-----------|---------------|
| Graphe bidirectionnel | Un train circule dans les deux sens |
| Code analytique libre | Pas de table de référence fournie |
| Stations hors distances.json inaccessibles | Erreur 422 si demandées |
| GET /stations ajouté | Nécessaire pour l'UX (affichage longName, autocomplete), non fourni dans la spec initiale |

### Algorithme Dijkstra

Requis car :
- Le champ `path` exige la liste des stations traversées
- Les lignes sont interconnectées (CABY connecte MOB et MVR-ce)
- Zweisimmen (ZW) est un nœud à 3 directions

---

## Architecture cible
```
train-routing/
├── .claude/
│   └── workflow.md           # Règles de développement
├── CLAUDE.md                 # Ce fichier
├── README.md                 # Documentation utilisateur
├── docker-compose.yml
├── .github/workflows/
│   ├── ci.yml
│   └── release.yml
│
├── backend/
│   ├── Dockerfile
│   ├── app/
│   │   ├── Models/           # Station, Distance, Route, User
│   │   ├── Services/         # GraphService (Dijkstra)
│   │   └── Http/
│   │       ├── Controllers/  # Auth, Station, Route, Stats
│   │       └── Requests/     # Validation
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/          # Import JSON + User démo
│   └── tests/
│
├── frontend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── components/       # LoginForm, RouteForm, StatsChart
│   │   ├── views/            # Login, Home, Stats
│   │   ├── stores/           # Auth (Pinia)
│   │   ├── services/         # API client typé
│   │   └── types/            # Types OpenAPI
│   └── tests/
│
└── data/
    ├── stations.json
    └── distances.json
```

---

## Plan de développement

### Phase 1 : Setup & Infrastructure
**Branche** : `phase/1-setup`

- Initialisation projet et structure
- Docker Compose (PostgreSQL, backend, frontend)
- Laravel 11 + Sanctum + config qualité
- Vue 3 + TypeScript + Vuetify + config qualité
- README initial

**Validation** : `docker compose up -d` démarre tous les services

---

### Phase 2 : Backend Core
**Branche** : `phase/2-backend-core`

- Modèles et migrations (Station, Distance, Route, User)
- Seeders depuis JSON + user démo
- GraphService avec Dijkstra
- Tests unitaires GraphService (coverage ≥ 95%)

**Validation** : `php artisan test --filter=GraphService` passe avec coverage ≥ 95%

---

### Phase 3 : Backend API
**Branche** : `phase/3-backend-api`

- Endpoint authentification Sanctum
- GET /api/v1/stations pour autocomplétion frontend
- POST /api/v1/routes avec validation
- GET /api/v1/stats/distances avec agrégation
- Tests feature API (coverage controllers ≥ 90%)

**Validation** : API conforme OpenAPI, coverage backend ≥ 80%

---

### Phase 4 : Frontend Core
**Branche** : `phase/4-frontend-core`

- Types TypeScript (contrats API)
- Client API Axios avec intercepteurs
- Store auth Pinia avec persistance
- Router avec guards authentification

**Validation** : `npm run type-check && npm run test` passent

---

### Phase 5 : Frontend Features
**Branche** : `phase/5-frontend-features`

- LoginView avec validation
- RouteForm avec autocomplete stations
    - Affiche `longName` à l'utilisateur ("Montreux")
    - Recherche sur `shortName` ET `longName`
    - Envoie `shortName` à l'API ("MX")
- RouteResult avec visualisation chemin (affiche les `longName`)
- StatsView avec filtres et graphique
- Tests composants

**Validation** : Coverage frontend ≥ 80%, build production OK

---

### Phase 6 : DevOps & CI/CD
**Branche** : `phase/6-devops`

- Dockerfiles production (multi-stage)
- Docker Compose finalisé avec healthchecks
- GitHub Actions CI (lint, test, coverage, security)
- GitHub Actions Release (GHCR, changelog)

**Validation** : Pipeline CI passe, images buildées

---

### Phase 7 : Polish & Documentation
**Branche** : `phase/7-polish`

- README complet
- Documentation choix techniques
- Loading states et error handling UI
- CORS, rate limiting, headers sécurité
- Revue finale et cleanup

**Validation** : Merge dans main, tag v1.0.0

---

## Checklist finale

### Fonctionnel
- [ ] Auth Sanctum opérationnelle
- [ ] GET /stations retourne les stations avec longName
- [ ] POST /routes calcule distance et retourne path
- [ ] GET /stats agrège par code analytique
- [ ] Filtres date et groupBy fonctionnels

### Qualité
- [ ] Coverage backend ≥ 80%
- [ ] Coverage frontend ≥ 80%
- [ ] Lint sans erreur (PHPCS, PHPStan, ESLint)
- [ ] Commits conventionnels et atomiques

### DevOps
- [ ] `docker compose up -d` one-command deploy
- [ ] CI complet sur chaque push
- [ ] Images publiées sur GHCR
- [ ] Release avec changelog

### Documentation
- [ ] README avec setup et architecture
- [ ] Choix techniques justifiés
- [ ] Hypothèses documentées

---

## Choix techniques et justifications

### Laravel Sanctum vs JWT

**Choix : Sanctum**

- Application monolithique avec un seul frontend
- Intégration native Laravel, maintenance simplifiée
- Pas de besoin de tokens distribués entre services
- Sécurité suffisante (tokens hashés, révocation simple)

JWT serait pertinent pour une architecture microservices ou multi-consumers.

### PostgreSQL vs SQLite/MySQL

**Choix : PostgreSQL**

- Cohérence avec la stack MOB
- Support natif UUID
- Performances agrégations statistiques
- Production-ready

### Vuetify vs Tailwind

**Choix : Vuetify 3**

- Mentionné dans la stack MOB
- Composants Material Design prêts à l'emploi
- Cohérence UI garantie
- Gain de temps sur le design système

### Assistance IA (Claude Code)

**Choix : Transparent et documenté**

- Reflète les pratiques modernes de développement
- L'expertise reste dans la compréhension et la validation
- Workflow reproductible on-premise pour contextes sensibles
- Démontre l'adaptabilité aux contraintes entreprise