const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testAPIs() {
  try {
    console.log('🔍 Test des APIs...\n');
    
    // Test 1: Endpoint de santé
    console.log('1. Test endpoint de santé...');
    try {
      const health = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Santé:', health.data);
    } catch (error) {
      console.log('❌ Erreur de santé:', error.response?.data || error.message);
    }
    
    // Test 2: Test d'authentification
    console.log('\n2. Test d\'authentification...');
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
      
      // Test avec des données invalides pour voir si la validation fonctionne
      try {
        const login2 = await axios.post(`${BASE_URL}/auth/login`, {
          email: 'test@test.com',
          password: 'test'
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
        message: error.response?.data?.message
      });
    }
    
    // Test 4: Test des réservations
    console.log('\n4. Test des réservations...');
    try {
      const bookings = await axios.get(`${BASE_URL}/bookings`);
      console.log('✅ Réservations récupérées:', bookings.data);
    } catch (error) {
      console.log('❌ Erreur des réservations:', {
        status: error.response?.status,
        message: error.response?.data?.message
      });
    }
    
    // Test 5: Test des paiements
    console.log('\n5. Test des paiements...');
    try {
      const payments = await axios.get(`${BASE_URL}/payments`);
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

testAPIs();
