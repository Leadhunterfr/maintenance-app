-- Schema pour l'application de maintenance

-- Table des super admins
CREATE TABLE IF NOT EXISTS super_admins (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des établissements
CREATE TABLE IF NOT EXISTS etablissements (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  adresse TEXT,
  ville VARCHAR(255),
  code_postal VARCHAR(10),
  pays VARCHAR(100),
  telephone VARCHAR(50),
  email VARCHAR(255),
  notes TEXT,
  modules JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des utilisateurs d'établissement (responsables)
CREATE TABLE IF NOT EXISTS etablissement_users (
  id SERIAL PRIMARY KEY,
  etablissement_id INTEGER REFERENCES etablissements(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'responsable',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des fiches de maintenance
CREATE TABLE IF NOT EXISTS fiches_maintenance (
  id SERIAL PRIMARY KEY,
  etablissement_id INTEGER REFERENCES etablissements(id) ON DELETE CASCADE,
  nom_tache VARCHAR(255) NOT NULL,
  url_pdf TEXT,
  frequence_mois INTEGER DEFAULT 6,
  prochain_envoi TIMESTAMP,
  dernier_envoi TIMESTAMP,
  responsable_nom VARCHAR(255),
  responsable_email VARCHAR(255),
  responsable_adjoint_nom VARCHAR(255),
  responsable_adjoint_email VARCHAR(255),
  contact_ids JSONB DEFAULT '[]'::jsonb,
  commentaire TEXT,
  statut VARCHAR(50) DEFAULT 'en_attente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des contacts
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  etablissement_id INTEGER REFERENCES etablissements(id) ON DELETE CASCADE,
  nom VARCHAR(255) NOT NULL,
  prenom VARCHAR(255),
  fonction VARCHAR(255),
  email VARCHAR(255),
  telephone VARCHAR(50),
  mobile VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_etablissements_email ON etablissements(email);
CREATE INDEX IF NOT EXISTS idx_etablissement_users_etablissement ON etablissement_users(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_etablissement_users_email ON etablissement_users(email);
CREATE INDEX IF NOT EXISTS idx_fiches_etablissement ON fiches_maintenance(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_fiches_statut ON fiches_maintenance(statut);
CREATE INDEX IF NOT EXISTS idx_contacts_etablissement ON contacts(etablissement_id);

-- Trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_etablissements_updated_at BEFORE UPDATE ON etablissements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fiches_updated_at BEFORE UPDATE ON fiches_maintenance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
