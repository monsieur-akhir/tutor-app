const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'tutor_platform',
});

async function testDatabaseConnection() {
  try {
    console.log('🔌 Test de connexion à la base de données...');
    console.log('Configuration:', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USERNAME || 'postgres',
      database: process.env.DB_DATABASE || 'tutor_platform'
    });
    
    await client.connect();
    console.log('✅ Connexion réussie !');
    
    // Test 1: Vérifier les tables
    console.log('\n📋 Vérification des tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('Tables disponibles:', tablesResult.rows.map(r => r.table_name));
    
    // Test 2: Vérifier les utilisateurs
    console.log('\n👥 Vérification des utilisateurs...');
    const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
    console.log('Nombre d\'utilisateurs:', usersResult.rows[0].count);
    
    // Test 3: Vérifier un utilisateur spécifique
    console.log('\n🔍 Vérification d\'un utilisateur admin...');
    const adminResult = await client.query('SELECT id, email, role FROM users WHERE email = $1', ['admin@tutorapp.com']);
    if (adminResult.rows.length > 0) {
      console.log('Admin trouvé:', adminResult.rows[0]);
    } else {
      console.log('❌ Aucun admin trouvé');
    }
    
    // Test 4: Vérifier la structure de la table users
    console.log('\n🏗️ Structure de la table users...');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    console.log('Colonnes:', columnsResult.rows.map(r => `${r.column_name} (${r.data_type}, nullable: ${r.is_nullable})`));
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
  } finally {
    await client.end();
  }
}

testDatabaseConnection();
