import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { POManager } from '../../page-objects/POManager.js';

// Resolve ECOMMERCE root directory regardless of where Playwright is launched.
const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../');

dotenv.config({ path: path.join(ROOT_DIR, '.env') });

// Validate required environment variables.
for (const key of ['REGULAR_USER', 'PASSWORD', 'WRONG_PASSWORD']) {
    if (!process.env[key]) {
        throw new Error(`Missing environment variable: ${key}`);
    }
}

// Same database the Playwright web server uses (see playwright.config.js).
// DATABASE_PATH in .env is for deployment, so it's ignored here.
const DB_PATH = process.env.E2E_DATABASE_PATH
    ? path.resolve(process.env.E2E_DATABASE_PATH)
    : path.join(ROOT_DIR, 'server/data/shop.db');

test.describe('Login Tests', () => {
    test('should login successfully with correct credentials', { tag: ['@p0', '@smoke', '@regression'] },
        async ({ page }) => {
            const poManager = new POManager(page);
            const authenticationPages = poManager.getAuthenticationPages();
            await page.goto('/');
            await authenticationPages.goToLoginPage();
            await authenticationPages.login(process.env.REGULAR_USER, process.env.PASSWORD);
            await expect(page.getByRole('button', { name: /Hello, Atai/i })).toBeVisible();
        });

    test('should show error for incorrect password', { tag: ['@p0', '@smoke', '@regression'] },
        async ({ page }) => {
            const poManager = new POManager(page);
            const authenticationPages = poManager.getAuthenticationPages();
            await page.goto('/');
            await authenticationPages.goToLoginPage();
            await authenticationPages.login(process.env.REGULAR_USER, process.env.WRONG_PASSWORD);
            await expect(page.locator('.alert')).toHaveText('Incorrect email or password.');
        });

    test('log out works correctly, and nothing in the cookies', { tag: ['@p0', '@smoke', '@regression'] },
        async ({ page }) => {
            const poManager = new POManager(page);
            const authenticationPages = poManager.getAuthenticationPages();
            await page.goto('/');
            await authenticationPages.goToLoginPage();
            await authenticationPages.login(process.env.REGULAR_USER, process.env.PASSWORD);
            await expect(page.getByRole('button', { name: /Hello, Atai/i })).toBeVisible();
            await authenticationPages.signOut();
            await expect(page.locator('a.nav-item[href*="/login"] .nav-line1')).toBeVisible();
            const cookies = await page.context().cookies();
            expect(cookies.length).toBe(0);
        })
})