// Proxy Vercel pour communiquer avec le backend RPI
// Contourne les restrictions Private Network Access du navigateur

const RPI_API_URL = 'https://rpi011.taild92b43.ts.net/api';

module.exports = async (req, res) => {
  // Gestion CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Extraire le chemin de l'API depuis l'URL
    // Ex: /api/auth/login -> /auth/login
    const path = req.url.replace(/^\/api/, '');
    const targetUrl = `${RPI_API_URL}${path}`;

    console.log(`[Proxy] ${req.method} ${targetUrl}`);

    // Préparer les headers
    const headers = {
      'Content-Type': 'application/json',
    };

    // Copier l'en-tête Authorization s'il existe
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    // Faire la requête vers le RPI
    const fetchOptions = {
      method: req.method,
      headers,
    };

    // Ajouter le body pour les requêtes POST/PUT
    if (req.method === 'POST' || req.method === 'PUT') {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();

    // Renvoyer la réponse du RPI
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('[Proxy] Erreur:', error);
    return res.status(500).json({
      error: 'Erreur de communication avec le serveur',
      details: error.message
    });
  }
};
