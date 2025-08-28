-- Initialisation de la base de données tutor_platform
-- Ce fichier est exécuté automatiquement au premier démarrage

-- Créer la base de données si elle n'existe pas
SELECT 'CREATE DATABASE tutor_platform'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'tutor_platform')\gexec

-- Se connecter à la base de données
\c tutor_platform;

-- Créer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Message de confirmation
SELECT 'Base de données tutor_platform initialisée avec succès!' as message;

