import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.E2E_PORT) || 4173;
const BASE_URL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
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
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
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
    },
  },
});
