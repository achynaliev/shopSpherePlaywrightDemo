
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

// Resolve ECOMMERCE root directory regardless of where Playwright is launched.
const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../');

// Load .env from ECOMMERCE root.
dotenv.config({ path: path.join(ROOT_DIR, '.env') });

// Validate required environment variables.
for (const key of ['REGISTRATION_EMAIL', 'PASSWORD', 'WRONG_PASSWORD']) {
    if (!process.env[key]) {
        throw new Error(`Missing environment variable: ${key}`);
    }
}

// Same database the Playwright web server uses (see playwright.config.js).
// DATABASE_PATH in .env is for deployment, so it's ignored here.
const DB_PATH = process.env.E2E_DATABASE_PATH
    ? path.resolve(process.env.E2E_DATABASE_PATH)
    : path.join(ROOT_DIR, 'server/data/shop.db');

test.describe('Registration Tests', () => {

    // These tests depend on the same registration email.
    test.describe.configure({ mode: 'serial' });

    // Remove the account left by a previous run.
    test.beforeAll(() => {
        // Remote app: its database isn't accessible locally.
        if (process.env.E2E_BASE_URL) return;
        const db = new Database(DB_PATH);
        try {
            db.pragma('foreign_keys = ON');
            db.prepare('DELETE FROM users WHERE email = ?').run(process.env.REGISTRATION_EMAIL);
        } finally {
            db.close();
        }
    });

    test('should register a new user successfully', async ({ page }) => {
        await page.goto('/');
        await page.locator('a.nav-item[href*="/login"]').click();
        await page.getByText('Create your ShopSphere account', { exact: true }).click();
        await page.getByPlaceholder('First and last name').fill('John Doe');
        await page.locator('input[type="email"]').fill(process.env.REGISTRATION_EMAIL);
        await page.getByPlaceholder('At least 8 characters').fill(process.env.PASSWORD);
        await page.getByLabel('Re-enter password').fill(process.env.PASSWORD);
        await page.getByRole('button', { name: 'Create your account' }).click();
        await expect(page.getByRole('button', { name: /Hello, John/ })).toBeVisible();
    });

    test('should show server error for duplicate email', async ({ page }) => {
        await page.goto('/');
        await page.locator('a.nav-item[href*="/login"]').click();
        await page.getByText('Create your ShopSphere account', { exact: true }).click();
        await page.getByPlaceholder('First and last name').fill('John Doe');
        await page.locator('input[type="email"]').fill(process.env.REGISTRATION_EMAIL);
        await page.getByPlaceholder('At least 8 characters').fill(process.env.PASSWORD);
        await page.getByLabel('Re-enter password').fill(process.env.PASSWORD);
        await page.getByRole('button', { name: 'Create your account' }).click();
        await expect(page.locator('.alert')).toHaveText('An account with this email already exists.');
    });

    test('should show client error when passwords do not match', async ({ page }) => {
        await page.goto('/');
        await page.locator('a.nav-item[href*="/login"]').click();
        await page.getByText('Create your ShopSphere account', { exact: true }).click();
        await page.getByPlaceholder('First and last name').fill('John Doe');
        await page.locator('input[type="email"]').fill(process.env.REGISTRATION_EMAIL);
        await page.getByPlaceholder('At least 8 characters').fill(process.env.PASSWORD);
        await page.getByLabel('Re-enter password').fill(process.env.WRONG_PASSWORD);

        // Track registration API requests.
        const registerRequests = [];
        page.on('request', (request) => {
            if (
                request.method() === 'POST' &&
                request.url().includes('/api/auth/register')
            ) {
                registerRequests.push(request.url());
            }
        });

        await page.getByRole('button', { name: 'Create your account' }).click();

        await expect(page.locator('.alert')).toHaveText('Passwords must match.');

        // Client-side validation should prevent the API request.
        expect(registerRequests).toHaveLength(0);
    });

});
