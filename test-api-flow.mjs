// Script de test du flow complet de l'API
const API_URL = 'http://100.80.237.57:3001/api';

async function testCompleteFlow() {
  console.log('🧪 Test du flow complet de l\'API\n');

  try {
    // 1. Test de connexion
    console.log('1️⃣  Test de connexion...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'brianskuratko@gmail.com',
        password: 'Ingodwetrust'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${await loginResponse.text()}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Connexion réussie!');
    console.log('   Token:', loginData.token.substring(0, 20) + '...');
    console.log('   User:', loginData.user.name, `(${loginData.user.role})`);
    console.log('');

    const token = loginData.token;

    // 2. Test récupération des établissements
    console.log('2️⃣  Test récupération des établissements...');
    const etablissementsResponse = await fetch(`${API_URL}/etablissements`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!etablissementsResponse.ok) {
      throw new Error(`Fetch établissements failed: ${await etablissementsResponse.text()}`);
    }

    const etablissements = await etablissementsResponse.json();
    console.log(`✅ ${etablissements.length} établissement(s) récupéré(s)`);
    etablissements.forEach((etab, i) => {
      console.log(`   ${i + 1}. ${etab.nom} - ${etab.ville}`);
    });
    console.log('');

    // 3. Test création d'un établissement
    console.log('3️⃣  Test création d\'un établissement...');
    const createResponse = await fetch(`${API_URL}/etablissements`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nom: 'Test Établissement',
        adresse: '123 rue de Test',
        code_postal: '75001',
        ville: 'Paris',
        pays: 'France',
        telephone: '0123456789',
        email: 'test@example.com',
        notes: 'Établissement de test',
        modules: ['maintenance']
      })
    });

    if (!createResponse.ok) {
      throw new Error(`Create établissement failed: ${await createResponse.text()}`);
    }

    const newEtab = await createResponse.json();
    console.log('✅ Établissement créé avec succès!');
    console.log(`   ID: ${newEtab.id}`);
    console.log(`   Nom: ${newEtab.nom}`);
    console.log('');

    // 4. Test suppression de l'établissement
    console.log('4️⃣  Test suppression de l\'établissement...');
    const deleteResponse = await fetch(`${API_URL}/etablissements/${newEtab.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!deleteResponse.ok) {
      throw new Error(`Delete établissement failed: ${await deleteResponse.text()}`);
    }

    console.log('✅ Établissement supprimé avec succès!');
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Tous les tests sont passés avec succès!');
    console.log('');
    console.log('✨ L\'API RPI fonctionne parfaitement!');
    console.log('   URL: http://100.80.237.57:3001');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Erreur lors du test:', error.message);
    console.error('');
    process.exit(1);
  }
}

testCompleteFlow();
