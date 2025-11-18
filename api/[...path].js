// Proxy API Vercel Serverless pour contourner les restrictions Private Network Access
// Redirige toutes les requêtes vers l'API RPI

const RPI_API_URL = 'https://rpi011.taild92b43.ts.net';

export default async function handler(req, res) {
  const { path } = req.query;
  const apiPath = Array.isArray(path) ? path.join('/') : path;
  const targetUrl = `${RPI_API_URL}/api/${apiPath}`;

  try {
    // Forward la requête vers le RPI
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
      },
      ...(req.method !== 'GET' && req.method !== 'HEAD' && { body: JSON.stringify(req.body) }),
    });

    // Récupère la réponse
    const data = await response.json();

    // Envoie la réponse au client avec le bon status
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Erreur de connexion au serveur' });
  }
}
