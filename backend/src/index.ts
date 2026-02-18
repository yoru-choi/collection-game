import http from 'http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { WebSocketServer } from 'ws';
import { createApiRouter } from './routes';
import { env } from './config/env';
import { errorMiddleware, notFoundMiddleware } from './middleware/error';
import { ok } from './utils/response';

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || env.allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('CORS not allowed'));
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use(rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'rate limit exceeded',
    timestamp: new Date().toISOString(),
  },
}));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/openapi.json', (_req, res) => {
  ok(res, {
    openapi: '3.0.0',
    info: { title: 'Collection Game API', version: '1.0.0' },
    servers: [{ url: '/api/v1' }],
    paths: {},
  });
});

app.get('/asyncapi.yaml', (_req, res) => {
  res.type('text/yaml').send('asyncapi: 2.6.0\ninfo:\n  title: Collection Game WS\n  version: 1.0.0\n');
});

app.get('/docs', (_req, res) => {
  res.type('text/html').send('<html><body><h1>Collection Game API Docs</h1><p>See /openapi.json</p></body></html>');
});

app.get('/swagger/index.html', (_req, res) => {
  res.redirect('/docs');
});

app.use('/api/v1', createApiRouter());

app.use(notFoundMiddleware);
app.use(errorMiddleware);

const server = http.createServer(app);
const wsServer = new WebSocketServer({ noServer: true });

wsServer.on('connection', (socket) => {
  socket.send(JSON.stringify({ event: 'connected', data: { message: 'welcome' }, timestamp: new Date().toISOString() }));

  socket.on('message', (raw) => {
    let payload: { event?: string; data?: unknown } = {};
    try {
      payload = JSON.parse(raw.toString()) as { event?: string; data?: unknown };
    } catch {
      payload = { event: 'invalid', data: raw.toString() };
    }

    if (payload.event === 'ping') {
      socket.send(JSON.stringify({ event: 'pong', data: payload.data, timestamp: new Date().toISOString() }));
      return;
    }

    socket.send(JSON.stringify({ event: 'echo', data: payload.data || null, timestamp: new Date().toISOString() }));
  });
});

server.on('upgrade', (request, socket, head) => {
  if (request.url !== '/ws') {
    socket.destroy();
    return;
  }

  wsServer.handleUpgrade(request, socket, head, (websocket) => {
    wsServer.emit('connection', websocket, request);
  });
});

server.listen(env.port, env.host, () => {
  console.log(`Collection Game backend listening on http://${env.host}:${env.port}`);
});
