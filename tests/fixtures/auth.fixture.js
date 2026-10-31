import { test as base, expect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../');

// Load .env from ECOMMERCE root.
dotenv.config({ path: path.join(ROOT_DIR, '.env') });

// Validate required environment variables.
for (const key of ['REGISTRATION_EMAIL', 'PASSWORD', 'WRONG_PASSWORD']) {
    if (!process.env[key]) {
        throw new Error(`Missing environment variable: ${key}`);
    }
}

dotenv.config();

export const authenticatedTest = base.extend({

    authenticatedPage: async ({ browser }, use) => {
        const context = await browser.newContext();
        const page = await context.newPage();

        try {
            await page.goto('/login');
            await page.locator('input[type="email"]').fill(process.env.REGULAR_USER3);
            await page.locator('input[type="password"]').fill(process.env.PASSWORD);
            await page.getByRole('button', { name: 'Sign in' }).click();
            await expect(page.getByRole('button', { name: /Hello, Atai/ })).toBeVisible();
            await page.waitForLoadState('networkidle');
            await use(page);
        } finally {
            await context.close();
        }
    },
});

export { expect };