const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({ 
          error: 'Backend service unavailable',
          message: 'Please ensure the backend server is running on port 3001'
        });
      }
    })
  );
};
