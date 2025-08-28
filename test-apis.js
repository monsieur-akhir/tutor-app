const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Configuration des tests
const testData = {
  admin: {
    email: 'admin@tutorapp.com',
    password: 'admin123'
  },
  tutor: {
    email: 'tutor1@tutorapp.com',
    password: 'tutor123'
  },
  student: {
    email: 'student1@tutorapp.com',
    password: 'student123'
  }
};

let adminToken = '';
let tutorToken = '';
let studentToken = '';

async function testAuth() {
  console.log('🔐 Test des endpoints d\'authentification...');
  
  try {
    // Test de connexion admin
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: testData.admin.email,
      password: testData.admin.password
    });
    adminToken = adminLogin.data.accessToken;
    console.log('✅ Connexion admin réussie');
    
    // Test de connexion tuteur
    const tutorLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: testData.tutor.email,
      password: testData.tutor.password
    });
    tutorToken = tutorLogin.data.accessToken;
    console.log('✅ Connexion tuteur réussie');
    
    // Test de connexion étudiant
    const studentLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: testData.student.email,
      password: testData.student.password
    });
    studentToken = studentLogin.data.accessToken;
    console.log('✅ Connexion étudiant réussie');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'authentification:', error.response?.data || error.message);
  }
}

async function testProfiles() {
  console.log('\n👤 Test des endpoints de profils...');
  
  try {
    // Test récupération des profils
    const profiles = await axios.get(`${BASE_URL}/profiles`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✅ Récupération des profils: ${profiles.data.length} profils trouvés`);
    
    // Test récupération d'un profil spécifique
    const profile = await axios.get(`${BASE_URL}/profiles/me`, {
      headers: { Authorization: `Bearer ${tutorToken}` }
    });
    console.log(`✅ Profil tuteur récupéré: ${profile.data.firstName} ${profile.data.lastName}`);
    
  } catch (error) {
    console.error('❌ Erreur lors des tests de profils:', error.response?.data || error.message);
  }
}

async function testBookings() {
  console.log('\n📚 Test des endpoints de réservations...');
  
  try {
    // Test récupération des réservations
    const bookings = await axios.get(`${BASE_URL}/booking`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✅ Récupération des réservations: ${bookings.data.length} réservations trouvées`);
    
    // Test récupération des réservations d'un utilisateur
    const userBookings = await axios.get(`${BASE_URL}/booking`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log(`✅ Réservations de l'étudiant: ${userBookings.data.length} réservations`);
    
  } catch (error) {
    console.error('❌ Erreur lors des tests de réservations:', error.response?.data || error.message);
  }
}

async function testPayments() {
  console.log('\n💰 Test des endpoints de paiements...');
  
  try {
    // Test récupération des paiements en attente
    const pendingPayments = await axios.get(`${BASE_URL}/payments/pending/all`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✅ Paiements en attente: ${pendingPayments.data.length} paiements`);
    
    // Test récupération des statistiques
    const stats = await axios.get(`${BASE_URL}/payments/stats/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✅ Statistiques des paiements: ${stats.data.totalPending} en attente, ${stats.data.totalConfirmed} confirmés`);
    
    // Test récupération des paiements d'un utilisateur
    const userPayments = await axios.get(`${BASE_URL}/payments/user/student-001`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✅ Paiements de l'étudiant: ${userPayments.data.length} paiements`);
    
  } catch (error) {
    console.error('❌ Erreur lors des tests de paiements:', error.response?.data || error.message);
  }
}

async function testSearch() {
  console.log('\n🔍 Test des endpoints de recherche...');
  
  try {
    // Test recherche de tuteurs
    const tutors = await axios.get(`${BASE_URL}/search/tutors?subject=Mathématiques`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log(`✅ Recherche de tuteurs: ${tutors.data.length} tuteurs trouvés`);
    
    // Test recherche de coaches
    const coaches = await axios.get(`${BASE_URL}/search/coaches?expertise=Développement personnel`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log(`✅ Recherche de coaches: ${coaches.data.length} coaches trouvés`);
    
  } catch (error) {
    console.error('❌ Erreur lors des tests de recherche:', error.response?.data || error.message);
  }
}

async function testAdmin() {
  console.log('\n👨‍💼 Test des endpoints admin...');
  
  try {
    // Test statistiques système
    const systemStats = await axios.get(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✅ Statistiques système: ${systemStats.data.users.total} utilisateurs, ${systemStats.data.bookings.total} réservations`);
    
    // Test récupération des utilisateurs
    const users = await axios.get(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✅ Utilisateurs récupérés: ${users.data.users.length} utilisateurs`);
    
  } catch (error) {
    console.error('❌ Erreur lors des tests admin:', error.response?.data || error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Démarrage des tests des APIs...\n');
  
  try {
    await testAuth();
    await testProfiles();
    await testBookings();
    await testPayments();
    await testSearch();
    await testAdmin();
    
    console.log('\n🎉 Tous les tests sont terminés !');
    
  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error.message);
  }
}

// Démarrer les tests
runAllTests();

