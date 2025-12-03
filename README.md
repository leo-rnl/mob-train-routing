# MOB Train Routing

Application de calcul d'itinéraires ferroviaires pour MOB (Montreux Oberland Bernois).

## Stack technique

### Backend
- PHP 8.4
- Laravel 12
- Laravel Sanctum (authentification API)
- PostgreSQL 16

### Frontend
- TypeScript 5
- Vue 3
- Vuetify 3
- Pinia

### Infrastructure
- Docker & Docker Compose
- GitHub Actions (CI/CD)

## Prérequis

- Docker Desktop
- Docker Compose v2+

## Installation

```bash
# Cloner le repository
git clone <repository-url>
cd mob-train-routing

# Démarrer l'application
docker compose up -d
```

## Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Application Vue.js |
| Backend | http://localhost:8000 | API Laravel |
| PostgreSQL | localhost:5432 | Base de données |

## Développement

### Backend

```bash
cd backend

# Lint PSR-12
composer phpcs

# Auto-fix PSR-12
composer phpcs:fix

# Analyse statique
composer phpstan

# Tests
php artisan test

# Tests avec coverage
php artisan test --coverage
```

### Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Serveur de développement
npm run dev

# Lint
npm run lint

# Type check
npm run type-check

# Tests
npm run test

# Tests avec coverage
npm run test:coverage
```

## Structure du projet

```
mob-train-routing/
├── .github/workflows/    # CI/CD pipelines
├── backend/              # API Laravel
│   ├── app/
│   ├── database/
│   │   └── data/         # JSON stations et distances
│   ├── routes/
│   └── tests/
├── frontend/             # Application Vue.js
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── stores/
│   │   ├── services/
│   │   └── types/
│   └── tests/
├── docker-compose.yml
└── README.md
```

## API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/v1/auth/token` | Authentification |
| GET | `/api/v1/stations` | Liste des stations |
| POST | `/api/v1/routes` | Calcul d'itinéraire |
| GET | `/api/v1/stats/distances` | Statistiques |

## Réseau ferroviaire

- **Ligne MOB** : Montreux → Zweisimmen (+ branches Lenk, Interlaken)
- **Ligne MVR-ce** : Vevey → Les Pléiades
- Connexion via Chamby (CABY)

## Documentation

- [CLAUDE.md](claude.md) - Spécifications projet
- [Workflow](.claude/workflow.md) - Règles de développement
