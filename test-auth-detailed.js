const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testAuthDetailed() {
  try {
    console.log('🔍 Test détaillé de l\'authentification...\n');
    
    // Test 1: Endpoint de santé
    console.log('1. Test endpoint de santé...');
    try {
      const health = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Santé:', health.data);
    } catch (error) {
      console.log('❌ Erreur de santé:', error.response?.data || error.message);
    }
    
    // Test 2: Test d'authentification avec plus de détails
    console.log('\n2. Test d\'authentification détaillé...');
    try {
      const login = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'admin@tutorapp.com',
        password: 'admin123'
      });
      console.log('✅ Login réussi:', login.data);
    } catch (error) {
      console.log('❌ Erreur de login:');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message);
      console.log('   Error:', error.response?.data?.error);
      console.log('   Headers:', error.response?.headers);
      
      // Test avec des données différentes
      console.log('\n   Test avec données différentes...');
      try {
        const login2 = await axios.post(`${BASE_URL}/auth/login`, {
          email: 'test@test.com',
          password: 'test123'
        });
        console.log('   ✅ Login avec données invalides:', login2.data);
      } catch (error2) {
        console.log('   ❌ Erreur attendue avec données invalides:', error2.response?.data?.message);
      }
    }
    
    // Test 3: Test des profils
    console.log('\n3. Test des profils...');
    try {
      const profiles = await axios.get(`${BASE_URL}/profiles`);
      console.log('✅ Profils récupérés:', profiles.data);
    } catch (error) {
      console.log('❌ Erreur des profils:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        error: error.response?.data?.error
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
        message: error.response?.data?.message,
        error: error.response?.data?.error
      });
    }
    
    // Test 5: Test des réservations
    console.log('\n5. Test des réservations...');
    try {
      const bookings = await axios.get(`${BASE_URL}/bookings`);
      console.log('✅ Réservations récupérées:', bookings.data);
    } catch (error) {
      console.log('❌ Erreur des réservations:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        error: error.response?.data?.error
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

testAuthDetailed();
