import { test as base, expect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../'
);

dotenv.config({ path: path.join(ROOT_DIR, '.env') });

for (const key of [
    'REGULAR_USER3',
    'REGULAR_USER4',
    'REGULAR_USER6',
    'PASSWORD',
    'REGISTRATION_EMAIL',
    'WRONG_PASSWORD'
]) {
    if (!process.env[key]) {
        throw new Error(`Missing environment variable: ${key}`);
    }
}

// Reusable login helper
async function createAuthenticatedPage(browser, use, email) {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        await page.goto('/login');
        await page.locator('input[type="email"]').fill(email);
        await page.locator('input[type="password"]').fill(process.env.PASSWORD);
        await page.getByRole('button', { name: 'Sign in' }).click();
        await expect(
            page.getByRole('button', { name: /Hello, Atai/i })
        ).toBeVisible();
        await page.waitForLoadState('networkidle');
        await use(page);
    } finally {
        await context.close();
    }
}

export const authenticatedTest = base.extend({
    // Account 1
    authenticatedPage: async ({ browser }, use) => {
        await createAuthenticatedPage(
            browser,
            use,
            process.env.REGULAR_USER3
        );
    },
    // Account 2
    authenticatedPage2: async ({ browser }, use) => {
        await createAuthenticatedPage(
            browser,
            use,
            process.env.REGULAR_USER4
        );
    },
    // Account 3
    authenticatedPage3: async ({ browser }, use) => {
        await createAuthenticatedPage(
            browser,
            use,
            process.env.REGULAR_USER6
        );
    }
});

export { expect };