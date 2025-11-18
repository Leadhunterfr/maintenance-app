import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import pool from './db.js';
import { authenticateToken, requireSuperAdmin, requireEtablissementAccess, generateToken } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Route de santé
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API de maintenance opérationnelle' });
});

// ==================== ROUTES D'AUTHENTIFICATION ====================

// Connexion (pour super admin et utilisateurs d'établissement)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Chercher d'abord dans les super admins
    let result = await pool.query(
      'SELECT id, email, password_hash, name, \'super_admin\' as role, NULL as etablissement_id FROM super_admins WHERE email = $1',
      [email]
    );

    // Si pas trouvé, chercher dans les utilisateurs d'établissement
    if (result.rows.length === 0) {
      result = await pool.query(
        'SELECT id, email, password_hash, name, role, etablissement_id FROM etablissement_users WHERE email = $1',
        [email]
      );
    }

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const user = result.rows[0];

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Générer le token
    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        etablissement_id: user.etablissement_id,
      },
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un compte super admin (protégé - nécessite déjà un super admin)
app.post('/api/auth/register-super-admin', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO super_admins (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, passwordHash, name]
    );

    res.status(201).json({ message: 'Super admin créé', user: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Cet email existe déjà' });
    }
    console.error('Erreur création super admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==================== ROUTES ÉTABLISSEMENTS ====================

// Liste des établissements (super admin uniquement)
app.get('/api/etablissements', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM etablissements ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur liste établissements:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Détails d'un établissement
app.get('/api/etablissements/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM etablissements WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Établissement non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur récupération établissement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un établissement (super admin uniquement)
app.post('/api/etablissements', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { nom, adresse, ville, code_postal, pays, telephone, email, notes, modules } = req.body;

    if (!nom) {
      return res.status(400).json({ error: 'Le nom est requis' });
    }

    const result = await pool.query(
      `INSERT INTO etablissements
       (nom, adresse, ville, code_postal, pays, telephone, email, notes, modules)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [nom, adresse, ville, code_postal, pays, telephone, email, notes, JSON.stringify(modules || [])]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur création établissement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier un établissement (super admin uniquement)
app.put('/api/etablissements/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, adresse, ville, code_postal, pays, telephone, email, notes, modules } = req.body;

    const result = await pool.query(
      `UPDATE etablissements
       SET nom = $1, adresse = $2, ville = $3, code_postal = $4,
           pays = $5, telephone = $6, email = $7, notes = $8, modules = $9
       WHERE id = $10
       RETURNING *`,
      [nom, adresse, ville, code_postal, pays, telephone, email, notes, JSON.stringify(modules || []), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Établissement non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur modification établissement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un établissement (super admin uniquement)
app.delete('/api/etablissements/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM etablissements WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Établissement non trouvé' });
    }

    res.json({ message: 'Établissement supprimé' });
  } catch (error) {
    console.error('Erreur suppression établissement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==================== ROUTES FICHES DE MAINTENANCE ====================

// Liste des fiches d'un établissement
app.get('/api/etablissements/:etablissementId/fiches', authenticateToken, requireEtablissementAccess, async (req, res) => {
  try {
    const { etablissementId } = req.params;
    const result = await pool.query(
      `SELECT * FROM fiches_maintenance
       WHERE etablissement_id = $1
       ORDER BY prochain_envoi ASC`,
      [etablissementId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erreur liste fiches:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Détails d'une fiche
app.get('/api/fiches/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM fiches_maintenance WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fiche non trouvée' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur récupération fiche:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une fiche
app.post('/api/fiches', authenticateToken, async (req, res) => {
  try {
    const {
      etablissement_id,
      nom_tache,
      url_pdf,
      frequence_mois,
      prochain_envoi,
      responsable_nom,
      responsable_email,
      responsable_adjoint_nom,
      responsable_adjoint_email,
      contact_ids,
      commentaire
    } = req.body;

    if (!nom_tache || !etablissement_id) {
      return res.status(400).json({ error: 'Nom de tâche et établissement requis' });
    }

    const result = await pool.query(
      `INSERT INTO fiches_maintenance
       (etablissement_id, nom_tache, url_pdf, frequence_mois, prochain_envoi,
        responsable_nom, responsable_email, responsable_adjoint_nom, responsable_adjoint_email,
        contact_ids, commentaire, statut)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [etablissement_id, nom_tache, url_pdf, frequence_mois || 6, prochain_envoi,
       responsable_nom, responsable_email, responsable_adjoint_nom, responsable_adjoint_email,
       JSON.stringify(contact_ids || []), commentaire, 'en_attente']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur création fiche:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier une fiche
app.put('/api/fiches/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nom_tache,
      url_pdf,
      frequence_mois,
      prochain_envoi,
      dernier_envoi,
      responsable_nom,
      responsable_email,
      responsable_adjoint_nom,
      responsable_adjoint_email,
      contact_ids,
      commentaire,
      statut
    } = req.body;

    const result = await pool.query(
      `UPDATE fiches_maintenance
       SET nom_tache = $1, url_pdf = $2, frequence_mois = $3, prochain_envoi = $4,
           dernier_envoi = $5, responsable_nom = $6, responsable_email = $7,
           responsable_adjoint_nom = $8, responsable_adjoint_email = $9,
           contact_ids = $10, commentaire = $11, statut = $12
       WHERE id = $13
       RETURNING *`,
      [nom_tache, url_pdf, frequence_mois, prochain_envoi, dernier_envoi,
       responsable_nom, responsable_email, responsable_adjoint_nom, responsable_adjoint_email,
       JSON.stringify(contact_ids || []), commentaire, statut, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fiche non trouvée' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur modification fiche:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer une fiche
app.delete('/api/fiches/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM fiches_maintenance WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fiche non trouvée' });
    }

    res.json({ message: 'Fiche supprimée' });
  } catch (error) {
    console.error('Erreur suppression fiche:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==================== ROUTES CONTACTS ====================

// Liste des contacts d'un établissement
app.get('/api/etablissements/:etablissementId/contacts', authenticateToken, requireEtablissementAccess, async (req, res) => {
  try {
    const { etablissementId } = req.params;
    const result = await pool.query(
      'SELECT * FROM contacts WHERE etablissement_id = $1 ORDER BY nom, prenom',
      [etablissementId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erreur liste contacts:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un contact
app.post('/api/contacts', authenticateToken, async (req, res) => {
  try {
    const { etablissement_id, nom, prenom, fonction, email, telephone, mobile, notes } = req.body;

    if (!nom || !etablissement_id) {
      return res.status(400).json({ error: 'Nom et établissement requis' });
    }

    const result = await pool.query(
      `INSERT INTO contacts
       (etablissement_id, nom, prenom, fonction, email, telephone, mobile, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [etablissement_id, nom, prenom, fonction, email, telephone, mobile, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur création contact:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier un contact
app.put('/api/contacts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, fonction, email, telephone, mobile, notes } = req.body;

    const result = await pool.query(
      `UPDATE contacts
       SET nom = $1, prenom = $2, fonction = $3, email = $4,
           telephone = $5, mobile = $6, notes = $7
       WHERE id = $8
       RETURNING *`,
      [nom, prenom, fonction, email, telephone, mobile, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur modification contact:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un contact
app.delete('/api/contacts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM contacts WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact non trouvé' });
    }

    res.json({ message: 'Contact supprimé' });
  } catch (error) {
    console.error('Erreur suppression contact:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
