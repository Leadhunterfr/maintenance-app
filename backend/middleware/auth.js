import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Middleware pour vérifier le token JWT
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Middleware pour vérifier que l'utilisateur est un super admin
export const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Accès réservé aux super admins' });
  }
  next();
};

// Middleware pour vérifier que l'utilisateur appartient à l'établissement
export const requireEtablissementAccess = (req, res, next) => {
  const etablissementId = parseInt(req.params.etablissementId || req.body.etablissement_id);

  if (req.user.role === 'super_admin') {
    // Super admin a accès à tout
    next();
    return;
  }

  if (req.user.etablissement_id !== etablissementId) {
    return res.status(403).json({ error: 'Accès non autorisé à cet établissement' });
  }

  next();
};

// Fonction pour générer un token JWT
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      etablissement_id: user.etablissement_id || null,
    },
    JWT_SECRET,
    { expiresIn: '7d' } // Le token expire après 7 jours
  );
};
