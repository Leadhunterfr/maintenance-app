-- Migration: Permettre plusieurs exécutants par fiche
-- Date: 2025-11-19

-- 1. Créer la table de jointure fiche_executants
CREATE TABLE IF NOT EXISTS fiche_executants (
  id SERIAL PRIMARY KEY,
  fiche_id INTEGER NOT NULL REFERENCES fiches_maintenance(id) ON DELETE CASCADE,
  contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(fiche_id, contact_id)
);

-- 2. Migrer les données existantes (si executant_email existe, trouver le contact correspondant)
INSERT INTO fiche_executants (fiche_id, contact_id)
SELECT
  fm.id as fiche_id,
  c.id as contact_id
FROM fiches_maintenance fm
JOIN contacts c ON c.email = fm.executant_email
WHERE fm.executant_email IS NOT NULL
  AND fm.executant_email != ''
ON CONFLICT (fiche_id, contact_id) DO NOTHING;

-- 3. Supprimer les anciennes colonnes executant
ALTER TABLE fiches_maintenance
DROP COLUMN IF EXISTS executant_nom,
DROP COLUMN IF EXISTS executant_email;

-- Commentaire pour documentation
COMMENT ON TABLE fiche_executants IS 'Table de jointure permettant d''assigner plusieurs exécutants à une fiche de maintenance';
