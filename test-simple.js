const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testSimple() {
  try {
    console.log('🔍 Test simple des APIs...\n');
    
    // Test 1: Endpoint de santé
    console.log('1. Test endpoint de santé...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Santé:', health.data);
    
    // Test 2: Test d'authentification avec gestion d'erreur
    console.log('\n2. Test d\'authentification...');
    try {
      const login = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'admin@tutorapp.com',
        password: 'admin123'
      });
      console.log('✅ Login réussi:', login.data);
    } catch (error) {
      console.log('❌ Erreur de login:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        error: error.response?.data?.error
      });
    }
    
    // Test 3: Test des profils
    console.log('\n3. Test des profils...');
    try {
      const profiles = await axios.get(`${BASE_URL}/profiles`);
      console.log('✅ Profils récupérés:', profiles.data);
    } catch (error) {
      console.log('❌ Erreur des profils:', {
        status: error.response?.status,
        message: error.response?.data?.message
      });
    }
    
    // Test 4: Test des paiements
    console.log('\n4. Test des paiements...');
    try {
      const payments = await axios.get(`${BASE_URL}/payments/pending/all`);
      console.log('✅ Paiements récupérés:', payments.data);
    } catch (error) {
      console.log('❌ Erreur des paiements:', {
        status: error.response?.status,
        message: error.response?.data?.message
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

testSimple();

