-- Migration: Ajouter role aux contacts et executant aux fiches
-- Date: 2025-11-19

-- Ajouter le champ role à la table contacts
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- Ajouter les champs executant à la table fiches_maintenance
ALTER TABLE fiches_maintenance
ADD COLUMN IF NOT EXISTS executant_nom VARCHAR(255),
ADD COLUMN IF NOT EXISTS executant_email VARCHAR(255);

-- Commentaires pour documentation
COMMENT ON COLUMN contacts.role IS 'Rôle du contact: user, responsable, admin_etablissement';
COMMENT ON COLUMN fiches_maintenance.executant_nom IS 'Nom de la personne qui exécute la tâche';
COMMENT ON COLUMN fiches_maintenance.executant_email IS 'Email de la personne qui exécute la tâche';
