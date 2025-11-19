// Proxy Vercel pour communiquer avec le backend RPI
// Contourne les restrictions Private Network Access du navigateur
// Force rebuild 2025-11-19

const https = require('https');

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
    // Extraire le chemin depuis req.query.path (fourni par le rewrite Vercel)
    // Le rewrite /api/:path* -> /api/proxy transmet le chemin dans query
    const pathParam = req.query.path;
    const path = Array.isArray(pathParam) ? pathParam.join('/') : (pathParam || '');
    const targetUrl = `${RPI_API_URL}/${path}`;

    console.log(`[Proxy] ${req.method} /api/${path} -> ${targetUrl}`);

    // Lire le body pour POST/PUT
    let bodyData = '';
    if (req.method === 'POST' || req.method === 'PUT') {
      bodyData = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => {
          data += chunk.toString();
        });
        req.on('end', () => {
          resolve(data);
        });
        req.on('error', reject);
      });
      console.log('[Proxy] Request body:', bodyData);
    }

    // Faire la requête HTTPS vers le RPI
    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'rpi011.taild92b43.ts.net',
        port: 443,
        path: `/api/${path}`,
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
        },
        rejectUnauthorized: false
      };

      if (bodyData) {
        options.headers['Content-Length'] = Buffer.byteLength(bodyData);
      }

      if (req.headers.authorization) {
        options.headers['Authorization'] = req.headers.authorization;
      }

      const request = https.request(options, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          console.log('[Proxy] Response status:', response.statusCode);
          console.log('[Proxy] Response data:', data);

          try {
            const jsonData = JSON.parse(data);
            resolve({ status: response.statusCode, data: jsonData });
          } catch (e) {
            console.log('[Proxy] Non-JSON response:', data);
            resolve({
              status: response.statusCode,
              data: { error: 'Réponse non-JSON du serveur', details: data }
            });
          }
        });
      });

      request.on('error', (error) => {
        console.error('[Proxy] Request error:', error);
        reject(error);
      });

      request.setTimeout(8000, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });

      if (bodyData) {
        request.write(bodyData);
      }

      request.end();
    });

    return res.status(result.status).json(result.data);
  } catch (error) {
    console.error('[Proxy] Erreur complète:', error);
    console.error('[Proxy] Stack:', error.stack);
    return res.status(500).json({
      error: 'Erreur de communication avec le serveur',
      details: error.message,
      stack: error.stack
    });
  }
};
