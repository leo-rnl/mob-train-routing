# CLAUDE.md - Train Routing & Analytics

> **Note** : Ce fichier a servi de contexte de travail pour Claude Code tout au long du projet. Il documente les spécifications initiales, le plan de développement suivi, et les règles de cadrage de l'IA. Pour la documentation utilisateur, voir le [README.md](README.md).

---

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

Le workflow adopté est **reproductible en environnement local** via :
```
Claude Code + Claude Code Router → LLM local (Ollama, LM Studio, vLLM...)
```

Cette configuration permet :
- **Confidentialité totale** : aucune donnée ne quitte l'infrastructure
- **Compliance** : compatible avec les exigences réglementaires strictes (données sensibles, secteur bancaire, santé, défense)
- **Souveraineté** : modèles hébergés on-premise ou cloud privé

Ce workflow n'est donc pas limité aux environnements cloud et reste applicable dans des contextes à forte contrainte de confidentialité.

---

## Workflow de développement

Les règles de développement (conventions de commit, stratégie de branches, checklist avant commit, seuils de coverage) sont définies dans :

**[.claude/workflow.md](.claude/workflow.md)**

Ce document est indépendant du plan de développement et s'applique à toutes les phases.

---

## Stack technique

### Backend
- PHP 8.4 (obligatoire)
- Laravel 12
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

> **Extension** : Endpoint ajouté car nécessaire à l'UX, absent de la spec OpenAPI initiale.

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

### GET /api/v1/routes

Historique des trajets de l'utilisateur connecté.

> **Extension** : Endpoint ajouté pour l'historique utilisateur.

**Query params optionnels:**
- `per_page` (int, default: 10): Nombre de résultats par page

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "fromStationId": "MX",
      "toStationId": "ZW",
      "fromStation": { "shortName": "MX", "longName": "Montreux" },
      "toStation": { "shortName": "ZW", "longName": "Zweisimmen" },
      "analyticCode": "ANA-123",
      "distanceKm": 62.43,
      "path": ["MX", "...", "ZW"],
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "meta": { "current_page": 1, "last_page": 1, "per_page": 10, "total": 1 }
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
  "distanceKm": 62.43,
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
| GET /routes (historique) ajouté | Nécessaire pour l'UX (historique, bouton "Réutiliser") |

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
├── CLAUDE.md                 # Ce fichier (contexte IA)
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
│   │   ├── data/             # stations.json, distances.json
│   │   ├── migrations/
│   │   └── seeders/          # Import JSON + User démo
│   └── tests/
│
├── frontend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── components/       # LoginForm, RouteForm, RouteCard, PathTimeline, StatsChart...
│   │   ├── views/            # Login, Home, Stats
│   │   ├── stores/           # Auth, Stations (Pinia)
│   │   ├── services/         # API client typé
│   │   ├── utils/            # Formatters, error handling
│   │   └── types/            # Types OpenAPI
│   └── tests/
│
└── docs/
    └── screenshots/          # Captures d'écran pour le README
```

---

## Plan de développement

> Ce plan reflète les phases telles qu'elles ont été définies au démarrage du projet. Chaque phase a été implémentée sur sa branche dédiée puis mergée.

### Phase 1 : Setup & Infrastructure
**Branche** : `phase/1-setup`

- Initialisation projet et structure
- Docker Compose (PostgreSQL, backend, frontend)
- Laravel 12 + Sanctum + config qualité
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
- RouteResult avec visualisation chemin
- StatsView avec filtres et graphique
- Tests composants

**Validation** : Coverage frontend ≥ 80%, build production OK

---

### Phase 5.5 : Enhancements
**Branche** : `phase/5.5-enhancements`

> Phase intermédiaire ajoutée pour améliorer l'UX au-delà des specs initiales.

#### Backend
- GET /api/v1/routes : historique des trajets utilisateur (paginé)
- Tests feature pour le nouvel endpoint

#### Frontend
- Store Pinia `stations` avec persistance localStorage
- Composant `PathTimeline` (timeline verticale du trajet)
- Composant `RouteCard` avec expand/collapse et highlight
- Intégration historique dans `HomeView`
- Améliorations `RouteForm` (pré-remplissage, persistance code analytique)
- Tests composants

**Validation** : Historique intégré fonctionnel, tests passent, coverage maintenu ≥ 80%

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

- README complet avec screenshots
- Documentation choix techniques
- Composants réutilisables (AppNavbar, EmptyState, ErrorAlert)
- Refactoring DRY (utils/formatters, utils/errorUtils)
- Loading states et error handling UI
- Accessibilité WCAG 2.1 AA
- Scène 3D sur la page de login

**Validation** : Merge dans main, tag v1.0.0

---

## Checklist finale

### Fonctionnel
- [x] Auth Sanctum opérationnelle
- [x] GET /stations retourne les stations avec longName
- [x] POST /routes calcule distance et retourne path
- [x] GET /routes retourne l'historique utilisateur
- [x] GET /stats agrège par code analytique
- [x] Filtres date et groupBy fonctionnels

### Qualité
- [x] Coverage backend ≥ 80%
- [x] Coverage frontend ≥ 80%
- [x] Lint sans erreur (PHPCS, PHPStan, ESLint)
- [x] Commits conventionnels et atomiques

### DevOps
- [x] `docker compose up -d` one-command deploy
- [x] CI complet sur chaque push
- [x] Images publiées sur GHCR
- [x] Release avec changelog

### Documentation
- [x] README avec setup et architecture
- [x] Choix techniques justifiés
- [x] Hypothèses documentées

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
