import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.E2E_PORT) || 4173;
const BASE_URL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;
// API specs hit the same app by default; set API_BASE_URL to aim them at another host (e.g. staging).
const API_BASE_URL = process.env.API_BASE_URL || BASE_URL;

export default defineConfig({
  testDir: '.',
  globalSetup: './global-setup.js',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'html',

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Keep chromium first: global-setup.js reads projects[0].use.baseURL.
    { name: 'chromium', testDir: './e2e', use: { ...devices['Desktop Chrome'], headless: !!process.env.CI } },
    // Browserless API specs. Run alone with `npm run test:api`.
    {
      name: 'api',
      testDir: './api',
      use: { baseURL: API_BASE_URL, extraHTTPHeaders: { Accept: 'application/json' } },
    },
    // Uncomment after `npx playwright install firefox webkit`:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    // { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],

  // Builds the client and runs the production server from the project root,
  // unless E2E_BASE_URL points at an already running app. It uses the app's normal
  // persistent database (server/data/shop.db), seeded only the first time it's created.
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: 'npm run build && node server/src/index.js',
    cwd: ROOT,
    url: `${BASE_URL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NODE_ENV: 'production',
      PORT: String(PORT),
      JWT_SECRET: 'e2e-only-secret-not-for-production',
      COOKIE_SECURE: 'false',
      SEED_DEMO_USER: 'true',
      AUTH_RATE_LIMIT: '1000',
      // Override any deployment DATABASE_PATH loaded from .env; the specs clean up this file.
      DATABASE_PATH: process.env.E2E_DATABASE_PATH || path.join(ROOT, 'server/data/shop.db'),
    },
  },
});
