// Proxy endpoint pour /api/auth/login -> RPI
const RPI_API_URL = 'https://rpi011.taild92b43.ts.net';

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Gestion des preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Seulement POST autorisé
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const targetUrl = `${RPI_API_URL}/api/auth/login`;

  try {
    // Forward la requête vers le RPI
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    // Récupère la réponse
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Erreur de connexion au serveur', details: error.message });
  }
};

module.exports.config = {
  api: {
    bodyParser: true,
  },
};
