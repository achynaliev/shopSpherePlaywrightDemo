import { test, expect } from '@playwright/test';
import { submitAndWaitForAuth } from '../../page-objects/Authentication.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Resolve ECOMMERCE root directory regardless of where Playwright is launched.
const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../');

dotenv.config({ path: path.join(ROOT_DIR, '.env') });

// Validate required environment variables.
for (const key of ['REGULAR_USER2', 'PASSWORD', 'WRONG_PASSWORD']) {
    if (!process.env[key]) {
        throw new Error(`Missing environment variable: ${key}`);
    }
}

// Same database the Playwright web server uses (see playwright.config.js).
// DATABASE_PATH in .env is for deployment, so it's ignored here.
const DB_PATH = process.env.E2E_DATABASE_PATH
    ? path.resolve(process.env.E2E_DATABASE_PATH)
    : path.join(ROOT_DIR, 'server/data/shop.db');

test.describe('Session tests for logged in user and not logged in user', () => {
    test('logged in user should be redirected from login/sign up pages', { tag: ['@p1', '@regression'] },
        async ({ page }) => {
            await page.goto('/');
            await page.locator('a.nav-item[href*="/login"]').click();
            await page.locator('input[type="email"]').fill(process.env.REGULAR_USER2);
            await page.locator('input[type="password"]').fill(process.env.PASSWORD);
            await submitAndWaitForAuth(page, page.getByRole('button', { name: 'Sign in' }));
            await expect(page.getByRole('button', { name: /Hello, atai/ })).toBeVisible();
            await page.goto('/login');
            await expect(page).toHaveURL('/');
            await page.goto('/register');
            await expect(page).toHaveURL('/');
        });

    test('Session persists across reload and new tab | Still signed in (cookie)', { tag: ['@p1', '@regression'] },
        async ({ page }) => {
            await page.goto('/');
            await page.locator('a.nav-item[href*="/login"]').click();
            await page.locator('input[type="email"]').fill(process.env.REGULAR_USER2);
            await page.locator('input[type="password"]').fill(process.env.PASSWORD);
            await submitAndWaitForAuth(page, page.getByRole('button', { name: 'Sign in' }));
            await expect(page.getByRole('button', { name: /Hello, atai/ })).toBeVisible();
            await page.reload();
            await expect(page.getByRole('button', { name: /Hello, atai/ })).toBeVisible();
            const newTab = await page.context().newPage();
            await newTab.goto('/');
            await expect(newTab.getByRole('button', { name: /Hello, atai/ })).toBeVisible();
        });

    test('Protected routes (`/checkout`, `/orders`, `/orders/:id`, `/account`) when signed out', { tag: ['@p0', '@smoke', '@regression'] },
        async ({ page }) => {
            await page.goto('/');
            await expect(page.locator('a.nav-item[href*="/login"] .nav-line1')).toBeVisible();
            await page.goto('/orders')
            await expect(page).toHaveURL(/login/);

            await page.goto('/orders/1')
            await expect(page).toHaveURL(/login/);

            await page.goto('/account')
            await expect(page).toHaveURL(/login/);

            await page.goto('/checkout')
            await expect(page).toHaveURL(/login/);
        });

    test('Session cookie deleted/expired mid-session | Next protected action → 401 handled', { tag: ['@p0', '@smoke', '@regression'] },
        async ({ page, context }) => {
            await page.goto('/');
            await page.locator('a.nav-item[href*="/login"]').click();
            await page.locator('input[type="email"]').fill(process.env.REGULAR_USER2);
            await page.locator('input[type="password"]').fill(process.env.PASSWORD);
            await submitAndWaitForAuth(page, page.getByRole('button', { name: 'Sign in' }));
            await expect(page.getByRole('button', { name: /Hello, atai/ })).toBeVisible();
            await page.goto('/account')

            let ordersResponse;
            page.on('response', response => {
                if (
                    response.url().includes('/api/orders') &&
                    response.request().method() === 'GET'
                ) {
                    ordersResponse = response;
                }
            });

            // Simulate session expiration
            await context.clearCookies();

            await page.locator('a.nav-item[href*="/orders"]').click()

            // Wait until the response has been captured
            await expect.poll(() => ordersResponse?.status()).toBe(401);

            await expect(page.locator('.alert')).toHaveText('Please sign in to continue.')

            // Verify redirect
            await page.goto('/orders')
            await expect(page).toHaveURL(/login/);
        })
});