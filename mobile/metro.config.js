// Metro config: Expo defaults plus a small reverse proxy that forwards the
// backend routes (/api/*, /health) to the FastAPI server.
//
// Why: in development the app is loaded from the Expo dev server — over the LAN
// or through Expo's tunnel (https://<id>.exp.direct). When EXPO_PUBLIC_API_URL is
// not set, the app sends its API calls to that same address (see
// src/services/api.ts), and this proxy hands them to the backend running on the
// same machine. One URL works from anywhere: no second tunnel, no open backend port.
//
// DIGGER_BACKEND_URL (env or mobile/.env) sets where the backend listens;
// default http://127.0.0.1:8000.
const http = require('http');
const https = require('https');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const BACKEND_URL = new URL(process.env.DIGGER_BACKEND_URL || 'http://127.0.0.1:8000');
const PROXIED = /^\/(api\/|health(\/|\?|$))/;

function proxyToBackend(req, res) {
  const client = BACKEND_URL.protocol === 'https:' ? https : http;
  const headers = { ...req.headers, host: BACKEND_URL.host };
  const upstream = client.request(
    {
      protocol: BACKEND_URL.protocol,
      hostname: BACKEND_URL.hostname,
      port: BACKEND_URL.port,
      method: req.method,
      path: req.url,
      headers,
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    },
  );
  upstream.on('error', (err) => {
    if (res.headersSent) {
      res.destroy(err);
      return;
    }
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        detail: `Backend unreachable at ${BACKEND_URL.origin} (${err.code || err.message}). Is it running?`,
      }),
    );
  });
  req.pipe(upstream);
}

const previousEnhance = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (metroMiddleware, server) => {
  const inner = previousEnhance ? previousEnhance(metroMiddleware, server) : metroMiddleware;
  return (req, res, next) => {
    if (req.url && PROXIED.test(req.url)) {
      proxyToBackend(req, res);
      return;
    }
    return inner(req, res, next);
  };
};

module.exports = config;
