import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import { loadUser } from './middleware/auth.js';
import { authRouter } from './routes/auth.js';
import { productsRouter } from './routes/products.js';
import { cartRouter } from './routes/cart.js';
import { ordersRouter } from './routes/orders.js';
import { errorHandler } from './util.js';

export function createApp(db, config) {
  const app = express();

  app.set('trust proxy', 1); // Correct client IPs and HTTPS detection behind Render/Railway/Heroku proxies.
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(compression());
  if (config.logRequests) app.use(morgan(config.isProd ? 'combined' : 'dev'));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(loadUser(db, config));

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRouter(db, config));
  app.use('/api/products', productsRouter(db));
  app.use('/api/cart', cartRouter(db));
  app.use('/api/orders', ordersRouter(db));
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

  // Serve the built React app and let client-side routing handle unknown paths.
  const indexHtml = path.join(config.clientDist, 'index.html');
  if (fs.existsSync(indexHtml)) {
    app.use(express.static(config.clientDist, { index: false, maxAge: '1y', immutable: true }));
    app.get('*', (req, res) => {
      res.set('Cache-Control', 'no-cache');
      res.sendFile(indexHtml);
    });
  }

  app.use(errorHandler);
  return app;
}
