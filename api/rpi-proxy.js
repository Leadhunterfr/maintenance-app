// Proxy Vercel pour communiquer avec le backend RPI
// Contourne les restrictions Private Network Access du navigateur

module.exports = (req, res) => {
  // Gestion CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Test simple d'abord
  res.status(200).json({
    message: 'Proxy test OK',
    method: req.method,
    url: req.url
  });
};
