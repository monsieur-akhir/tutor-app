const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_PREFIX = '/api/v1';

// Fonction de test simple
function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: API_PREFIX + path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsed,
            headers: res.headers,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Tests des endpoints
async function runTests() {
  console.log('🧪 Test des API Tutor Platform\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Test du Health Check...');
    try {
      const healthResponse = await testEndpoint('/health');
      console.log(`✅ Health Check: ${healthResponse.status} - ${JSON.stringify(healthResponse.data)}`);
    } catch (error) {
      console.log(`❌ Health Check échoué: ${error.message}`);
    }

    // Test 2: Recherche des profils (public)
    console.log('\n2️⃣ Test de la recherche des profils...');
    try {
      const profilesResponse = await testEndpoint('/profiles');
      console.log(`✅ Recherche profils: ${profilesResponse.status} - ${JSON.stringify(profilesResponse.data)}`);
    } catch (error) {
      console.log(`❌ Recherche profils échouée: ${error.message}`);
    }

    // Test 3: Profils par rôle
    console.log('\n3️⃣ Test des profils par rôle...');
    try {
      const roleResponse = await testEndpoint('/profiles/role/tutor');
      console.log(`✅ Profils par rôle: ${roleResponse.status} - ${JSON.stringify(roleResponse.data)}`);
    } catch (error) {
      console.log(`❌ Profils par rôle échoué: ${error.message}`);
    }

    // Test 4: Top profils
    console.log('\n4️⃣ Test des top profils...');
    try {
      const topResponse = await testEndpoint('/profiles/top/tutor?limit=3');
      console.log(`✅ Top profils: ${topResponse.status} - ${JSON.stringify(topResponse.data)}`);
    } catch (error) {
      console.log(`❌ Top profils échoué: ${error.message}`);
    }

    // Test 5: Documentation Swagger
    console.log('\n5️⃣ Test de la documentation Swagger...');
    try {
      const docsResponse = await testEndpoint('/docs');
      console.log(`✅ Documentation: ${docsResponse.status} - ${docsResponse.data ? 'Contenu reçu' : 'Redirection'}`);
    } catch (error) {
      console.log(`❌ Documentation échouée: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }

  console.log('\n🏁 Tests terminés');
}

// Exécuter les tests
runTests();

