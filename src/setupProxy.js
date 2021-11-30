/*
When running a local development server, this file is used to
 help configure a proxy requests.

https://create-react-app.dev/docs/proxying-api-requests-in-development
 */
const { createProxyMiddleware } = require('http-proxy-middleware');
const proxyPort = process.env.PROXY_PORT || 3001;

module.exports = function(app) {
  // handle genesis round JSON fetches
  app.use(
    '/rounds/*.json',
    createProxyMiddleware({
      target: `http://localhost:${proxyPort}`,
    })
  );
};
