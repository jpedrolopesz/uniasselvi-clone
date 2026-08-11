import express from 'express';
import http from 'node:http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { config } from './config.js';
import { handleWebSocketClient } from './routes/webRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/health', (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);

const webWss = new WebSocketServer({ noServer: true });

webWss.on('connection', handleWebSocketClient);

server.on('upgrade', (req, socket, head) => {
  if (req.url === '/ws') {
    webWss.handleUpgrade(req, socket, head, (ws) => webWss.emit('connection', ws));
  } else {
    socket.destroy();
  }
});

server.listen(config.port, () => {
  console.log(`Voice AI MVP rodando em http://localhost:${config.port}`);
  console.log(`Cliente web: http://localhost:${config.port}`);
});
