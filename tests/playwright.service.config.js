import { defineConfig } from '@playwright/test';
import { createAzurePlaywrightConfig, ServiceOS } from '@azure/playwright';
import { DefaultAzureCredential } from '@azure/identity';
import config from './playwright.config.js';

// Runs the same suite on Azure Playwright Workspaces cloud browsers.
// Needs PLAYWRIGHT_SERVICE_URL and an Azure sign-in (az login locally, OIDC in GitHub Actions).
// The app still runs on this machine; '<loopback>' lets the cloud browsers reach localhost.
export default defineConfig(
  config,
  createAzurePlaywrightConfig(config, {
    exposeNetwork: '<loopback>',
    connectTimeout: 3 * 60 * 1000,
    os: ServiceOS.LINUX,
    credential: new DefaultAzureCredential(),
  }),
  {
    reporter: [
      ['list'],
      ['html', { open: 'never' }], // must come before the Azure reporter, which uploads it
      ['@azure/playwright/reporter'],
    ],
  },
);
