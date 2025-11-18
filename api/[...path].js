// Proxy API Vercel Serverless pour contourner les restrictions Private Network Access
// Redirige toutes les requêtes vers l'API RPI

const RPI_API_URL = 'https://rpi011.taild92b43.ts.net';

module.exports = async function handler(req, res) {
  // Permet toutes les méthodes HTTP
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Gestion des preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { path } = req.query;
  const apiPath = Array.isArray(path) ? path.join('/') : path;
  const targetUrl = `${RPI_API_URL}/api/${apiPath}`;

  try {
    // Prépare le body pour les requêtes POST/PUT
    let body;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = JSON.stringify(req.body);
    }

    // Forward la requête vers le RPI
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
      },
      ...(body && { body }),
    });

    // Récupère la réponse
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      const text = await response.text();
      res.status(response.status).send(text);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Erreur de connexion au serveur', details: error.message });
  }
}

module.exports.config = {
  api: {
    bodyParser: true,
  },
};
