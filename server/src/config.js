import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function loadConfig(overrides = {}) {
  const isProd = process.env.NODE_ENV === 'production';
  const jwtSecret = process.env.JWT_SECRET || (isProd ? null : 'dev-only-insecure-secret');
  if (!jwtSecret) {
    throw new Error('JWT_SECRET must be set when NODE_ENV=production');
  }

  return {
    isProd,
    port: Number(process.env.PORT) || 4000,
    databasePath: process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'shop.db'),
    clientDist: process.env.CLIENT_DIST || path.join(__dirname, '..', '..', 'client', 'dist'),
    jwtSecret,
    // Secure cookies need HTTPS. Override with COOKIE_SECURE=false to run a production build over plain HTTP.
    cookieSecure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : isProd,
    // A known demo login is handy locally but should be opt-in on a public deployment.
    seedDemoUser: process.env.SEED_DEMO_USER ? process.env.SEED_DEMO_USER === 'true' : !isProd,
    // Sign-in/register attempts per IP per 15 minutes. E2E runs raise it since every spec signs in from localhost.
    authRateLimit: Number(process.env.AUTH_RATE_LIMIT) || (isProd ? 20 : 1000),
    logRequests: process.env.NODE_ENV !== 'test',
    ...overrides,
  };
}
