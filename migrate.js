const { DataSource } = require('typeorm');
const path = require('path');
require('dotenv').config();

// Configuration de base de données
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'tutor_platform',
  entities: [path.join(__dirname, 'apps/tutor-platform/src/**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, 'apps/tutor-platform/src/database/migrations/*{.ts,.js}')],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigrations() {
  try {
    console.log('🔌 Connexion à la base de données...');
    await dataSource.initialize();
    
    console.log('📊 Exécution des migrations...');
    const migrations = await dataSource.runMigrations();
    
    if (migrations.length > 0) {
      console.log(`✅ ${migrations.length} migration(s) exécutée(s) avec succès:`);
      migrations.forEach(migration => {
        console.log(`   - ${migration.name}`);
      });
    } else {
      console.log('ℹ️  Aucune nouvelle migration à exécuter.');
    }
    
    console.log('🎉 Migrations terminées avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des migrations:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Solution: Assurez-vous que PostgreSQL est démarré et accessible.');
      console.log('   - Docker: docker-compose up -d postgres');
      console.log('   - Local: service postgresql start');
    }
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// Exécuter les migrations
runMigrations();
