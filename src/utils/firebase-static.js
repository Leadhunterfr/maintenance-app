import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

/**
 * Configuration Firebase statique - Version simplifiée
 * Les 4 zones sont configurées directement dans le code
 */

const FIREBASE_CONFIGS = {
  zone1: {
    apiKey: "AIzaSyDjBnGtyG-s6go-htxQhjUoHTm-qor7byw",
    authDomain: "maintenance-zone1.firebaseapp.com",
    projectId: "maintenance-zone1",
    storageBucket: "maintenance-zone1.firebasestorage.app",
    messagingSenderId: "705088600833",
    appId: "1:705088600833:web:a00966180d42bce4fd3900"
  },
  zone2: {
    apiKey: "AIzaSyAfNvT_MWqboE0vD07BiCc7PdUq--saoXk",
    authDomain: "maintenance-zone2.firebaseapp.com",
    projectId: "maintenance-zone2",
    storageBucket: "maintenance-zone2.firebasestorage.app",
    messagingSenderId: "380419772825",
    appId: "1:380419772825:web:f822e1ef90384c8dcf0308"
  },
  zone3: {
    apiKey: "AIzaSyAyt3NOJ8Is66cEjiM-aLeOI0BhHiXVYho",
    authDomain: "maintenance-zone3.firebaseapp.com",
    projectId: "maintenance-zone3",
    storageBucket: "maintenance-zone3.firebasestorage.app",
    messagingSenderId: "662402186163",
    appId: "1:662402186163:web:0e77b72393e8bc289469c6"
  },
  zone4: {
    apiKey: "AIzaSyDI8otKp5tZJcLYcZY3-crPEfcdPy33I0c",
    authDomain: "maintenance-zone4.firebaseapp.com",
    projectId: "maintenance-zone4",
    storageBucket: "maintenance-zone4.firebasestorage.app",
    messagingSenderId: "401587012447",
    appId: "1:401587012447:web:f119d416d0212c38a92cea"
  },
  zone5: {
    apiKey: "AIzaSyA73EbNdEMRj4zh51NCQK51_VMaLMm9aX0",
    authDomain: "maintenance-zone5.firebaseapp.com",
    projectId: "maintenance-zone5",
    storageBucket: "maintenance-zone5.firebasestorage.app",
    messagingSenderId: "225294916768",
    appId: "1:225294916768:web:3ebb0bbc95b6ce1ea53dc5"
  },
  zone6: {
    apiKey: "AIzaSyB5Mph1-EibTLDLBJnOOM6ngJ46zaK8pEA",
    authDomain: "maintenance-zone6.firebaseapp.com",
    projectId: "maintenance-zone6",
    storageBucket: "maintenance-zone6.firebasestorage.app",
    messagingSenderId: "760193868266",
    appId: "1:760193868266:web:8cb0ed9c0aacdcfb69d293"
  }
};

// Mapping des départements vers les zones
const ZONE_MAPPING = {
  zone1: ['01', '02', '03', '15', '25', '26', '38', '39', '42', '43', '63', '69', '70', '71', '73', '74', '90'],
  zone2: ['04', '05', '06', '13', '83', '84'],
  zone3: ['07', '12', '30', '34', '48', '66'],
  zone4: ['08', '09', '10', '11', '14', '16', '17', '18', '19', '21', '22', '23', '24', '27', '28', '29', '31', '32', '33', '35', '36', '37', '40', '41', '44', '45', '46', '47', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '64', '65', '67', '68', '72', '75', '76', '77', '78', '79', '80', '81', '82', '85', '86', '87', '88', '89', '91', '92', '93', '94', '95']
};

// Instances Firebase
let apps = {};
let authInstances = {};
let firestoreInstances = {};
let functionsInstances = {};
let isInitialized = false;

/**
 * Initialise les apps Firebase pour toutes les zones
 */
export function initializeFirebaseApps() {
  // Évite la double initialisation (React StrictMode)
  if (isInitialized && Object.keys(apps).length > 0) {
    console.log('✅ Firebase déjà initialisé, réutilisation des instances');
    return { apps, authInstances, firestoreInstances, functionsInstances };
  }

  console.log('🔄 Initialisation de Firebase...');

  // Initialise chaque zone
  Object.entries(FIREBASE_CONFIGS).forEach(([zoneKey, config]) => {
    try {
      // Vérifie si l'app existe déjà
      if (!apps[zoneKey]) {
        apps[zoneKey] = initializeApp(config, zoneKey);
        authInstances[zoneKey] = getAuth(apps[zoneKey]);
        firestoreInstances[zoneKey] = getFirestore(apps[zoneKey]);
        functionsInstances[zoneKey] = getFunctions(apps[zoneKey], 'europe-west1');

        console.log(`✅ Firebase ${zoneKey} initialisé:`, config.projectId);
      }
    } catch (error) {
      console.error(`❌ Erreur initialisation ${zoneKey}:`, error);
    }
  });

  isInitialized = true;
  console.log('✅ Toutes les zones Firebase initialisées');

  return { apps, authInstances, firestoreInstances, functionsInstances };
}

/**
 * Détermine la zone Firebase en fonction du code postal
 */
export function getZoneFromCodePostal(codePostal) {
  const departement = codePostal.substring(0, 2);

  for (const [zone, departements] of Object.entries(ZONE_MAPPING)) {
    if (departements.includes(departement)) {
      return zone;
    }
  }

  // Par défaut, retourne zone1
  return 'zone1';
}

/**
 * Récupère l'instance Auth pour une zone spécifique
 */
export function getAuthForZone(zone = 'zone1') {
  if (!isInitialized) {
    initializeFirebaseApps();
  }

  return authInstances[zone] || authInstances['zone1'];
}

/**
 * Récupère l'instance Firestore pour une zone spécifique
 */
export function getFirestoreForZone(zone = 'zone1') {
  if (!isInitialized) {
    initializeFirebaseApps();
  }

  return firestoreInstances[zone] || firestoreInstances['zone1'];
}

/**
 * Récupère l'instance Functions pour une zone spécifique
 */
export function getFunctionsForZone(zone = 'zone1') {
  if (!isInitialized) {
    initializeFirebaseApps();
  }

  return functionsInstances[zone] || functionsInstances['zone1'];
}

/**
 * Pour le super admin : récupère toutes les instances Firestore
 */
export function getAllFirestoreInstances() {
  if (!isInitialized) {
    initializeFirebaseApps();
  }

  return firestoreInstances;
}

/**
 * Récupère la liste des zones configurées
 */
export function getConfiguredZones() {
  if (!isInitialized) {
    initializeFirebaseApps();
  }

  return Object.keys(firestoreInstances);
}

/**
 * Vérifie si l'app est configurée
 */
export function isConfigured() {
  return true; // Toujours configuré en mode statique
}

export default {
  isConfigured,
  initializeFirebaseApps,
  getZoneFromCodePostal,
  getAuthForZone,
  getFirestoreForZone,
  getFunctionsForZone,
  getAllFirestoreInstances,
  getConfiguredZones,
};
