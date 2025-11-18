// Script d'initialisation de la base de données
import pg from 'pg';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || '100.80.237.57',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'maintenance_db',
  user: process.env.DB_USER || 'maintenance_user',
  password: process.env.DB_PASSWORD || 'maintenance_password_2025',
});

async function initializeDatabase() {
  try {
    console.log('🔧 Initialisation de la base de données...\n');

    // 1. Charger et exécuter le schéma
    console.log('📊 Création des tables...');
    const schema = fs.readFileSync('./schema.sql', 'utf8');
    await pool.query(schema);
    console.log('✅ Tables créées\n');

    // 2. Créer le compte super admin
    console.log('👤 Création du Super Admin...');
    const ADMIN_EMAIL = 'brianskuratko@gmail.com';
    const ADMIN_PASSWORD = 'Ingodwetrust';
    const ADMIN_NAME = 'Brian Skuratko';

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await pool.query(
      'INSERT INTO super_admins (email, password_hash, name) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING',
      [ADMIN_EMAIL, passwordHash, ADMIN_NAME]
    );

    console.log('✅ Super Admin créé\n');

    console.log('🎉 Initialisation terminée!\n');
    console.log('📋 Identifiants Super Admin:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Mot de passe: ${ADMIN_PASSWORD}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error.message);
    console.error(error);
    process.exit(1);
  }
}

initializeDatabase();
