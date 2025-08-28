# Plateforme Tuteurs/Coachs/Mentors

Plateforme unifiée pour la mise en relation entre tuteurs, coachs, mentors et étudiants avec réservation, paiements, classes virtuelles et évaluations.

## 🚀 Technologies

- **Backend**: NestJS + Fastify, TypeScript
- **Base de données**: PostgreSQL + TypeORM
- **Cache & Queues**: Redis + BullMQ
- **Stockage**: MinIO (S3 compatible)
- **Visioconférence**: LiveKit
- **Paiements**: Stripe + Mobile Money
- **Documentation**: OpenAPI/Swagger

## 📋 Prérequis

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

## 🛠️ Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd tutor-app
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration de l'environnement**
```bash
cp env.example .env
# Éditer .env avec vos valeurs
```

4. **Démarrer les services avec Docker**
```bash
docker-compose up -d postgres redis minio
```

5. **Générer et exécuter les migrations**
```bash
npm run migration:generate
npm run migration:run
```

6. **Démarrer l'application**
```bash
npm run start:dev
```

## 🏗️ Structure du Projet

```
src/
├── auth/           # Authentification & autorisation
├── profiles/       # Gestion des profils utilisateurs
├── search/         # Recherche de tuteurs/coachs
├── availability/   # Gestion des disponibilités
├── booking/        # Système de réservation
├── sessions/       # Classes virtuelles (LiveKit)
├── evaluations/    # Évaluations & feedback
├── payments/       # Paiements (Stripe + Mobile Money)
├── notifications/  # Notifications (email/SMS/push)
├── admin/          # Interface d'administration
├── common/         # Entités & utilitaires partagés
└── database/       # Configuration de la base de données
```

## 🔧 Commandes Utiles

```bash
# Développement
npm run start:dev          # Démarrer en mode développement
npm run start:debug        # Démarrer avec debug

# Build & Production
npm run build              # Compiler le projet
npm run start:prod         # Démarrer en production

# Tests
npm run test               # Exécuter les tests unitaires
npm run test:watch         # Tests en mode watch
npm run test:e2e           # Tests end-to-end
npm run test:cov           # Tests avec couverture

# Base de données
npm run migration:generate # Générer une migration
npm run migration:run      # Exécuter les migrations
npm run migration:revert   # Annuler la dernière migration

# Qualité du code
npm run lint               # Vérifier le code
npm run format             # Formater le code
```

## 🌐 API Endpoints

L'API est documentée avec Swagger et accessible à `/docs` une fois l'application démarrée.

### Endpoints principaux

- **Auth**: `/api/v1/auth/*` - Inscription, connexion, 2FA
- **Profiles**: `/api/v1/profiles/*` - Gestion des profils
- **Search**: `/api/v1/search/*` - Recherche de tuteurs/coachs
- **Booking**: `/api/v1/booking/*` - Réservations
- **Payments**: `/api/v1/payments/*` - Paiements
- **Sessions**: `/api/v1/sessions/*` - Classes virtuelles

## 🔐 Variables d'Environnement

Copiez `env.example` vers `.env` et configurez :

```bash
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=tutor_platform

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# LiveKit
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

## 🐳 Docker

### Services disponibles

- **PostgreSQL**: Base de données principale
- **Redis**: Cache et queues
- **MinIO**: Stockage de fichiers (S3 compatible)
- **API**: Application NestJS

### Commandes Docker

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down

# Redémarrer un service spécifique
docker-compose restart postgres
```

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests avec couverture
npm run test:cov

# Tests end-to-end
npm run test:e2e

# Tests en mode watch
npm run test:watch
```

## 📊 Monitoring & Logs

- **Logs**: Pino avec format JSON
- **Health Check**: `/health` endpoint
- **Métriques**: Prometheus (à implémenter)
- **Tracing**: OpenTelemetry (à implémenter)

## 🚀 Déploiement

### Production

```bash
# Build de production
npm run build

# Variables d'environnement de production
NODE_ENV=production
PORT=3000

# Démarrer
npm run start:prod
```

### Kubernetes

Des manifests Kubernetes seront fournis pour le déploiement en production.

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :

- Ouvrir une issue sur GitHub
- Consulter la documentation API à `/docs`
- Vérifier les logs de l'application

## 🔄 Roadmap

- [x] Architecture de base
- [x] Module d'authentification
- [x] Entités de base de données
- [ ] Module de réservation
- [ ] Module de paiements
- [ ] Intégration LiveKit
- [ ] Système de notifications
- [ ] Interface d'administration
- [ ] Tests complets
- [ ] Déploiement production

