// Script pour créer le compte Super Admin sur Zone 2
// Exécute avec : node create-admin-zone2.mjs

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Configuration Firebase Zone 2 (Super Admin)
const firebaseConfig = {
  apiKey: "AIzaSyAfNvT_MWqboE0vD07BiCc7PdUq--saoXk",
  authDomain: "maintenance-zone2.firebaseapp.com",
  projectId: "maintenance-zone2",
  storageBucket: "maintenance-zone2.firebasestorage.app",
  messagingSenderId: "380419772825",
  appId: "1:380419772825:web:f822e1ef90384c8dcf0308"
};

// Informations du Super Admin
const ADMIN_NAME = "Brian Skuratko";
const ADMIN_EMAIL = "brianskuratko@gmail.com";
const ADMIN_PASSWORD = "Ingodwetrust";

async function createSuperAdmin() {
  try {
    console.log('🚀 Initialisation de Firebase Zone 2...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log('👤 Création du compte Super Admin...');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Nom: ${ADMIN_NAME}`);

    // Crée le compte dans Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    const uid = userCredential.user.uid;

    console.log(`✅ Compte créé dans Firebase Auth (Zone 2)`);
    console.log(`   UID: ${uid}`);

    // Ajoute le document dans Firestore
    await setDoc(doc(db, 'superAdmins', uid), {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      createdAt: new Date(),
    });

    console.log('✅ Document créé dans Firestore');
    console.log('');
    console.log('🎉 Super Admin créé avec succès sur Zone 2 !');
    console.log('');
    console.log('📋 Tes identifiants :');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Mot de passe: ${ADMIN_PASSWORD}`);
    console.log('');
    console.log('🌐 Tu peux maintenant te connecter sur https://maintenance-app-alpha.vercel.app/');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Code:', error.code);

    if (error.code === 'auth/email-already-in-use') {
      console.log('');
      console.log('ℹ️  Ce compte existe déjà. Tu peux te connecter directement :');
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Mot de passe: ${ADMIN_PASSWORD}`);
      console.log('   URL: https://maintenance-app-alpha.vercel.app/');
    }

    process.exit(1);
  }
}

createSuperAdmin();
