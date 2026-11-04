import { test as base, expect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../'
);

dotenv.config({ path: path.join(ROOT_DIR, '.env') });

// Accounts whose cart/orders the specs change. Each worker gets its own copy (see workerUsers).
const STATEFUL_USERS = ['REGULAR_USER3', 'REGULAR_USER4', 'REGULAR_USER6'];

for (const key of [
    ...STATEFUL_USERS,
    'PASSWORD',
    'REGISTRATION_EMAIL',
    'WRONG_PASSWORD'
]) {
    if (!process.env[key]) {
        throw new Error(`Missing environment variable: ${key}`);
    }
}

// The email a worker uses for one of the stateful accounts: name@x.com -> name+w3@x.com.
// parallelIndex is stable (0..workers-1), so reruns reuse the same accounts instead of piling up new ones.
export function workerEmail(key, parallelIndex) {
    const [local, domain] = process.env[key].split('@');
    return `${local}+w${parallelIndex}@${domain}`;
}

// Opens a page already signed in with a session saved by workerSessions.
async function createAuthenticatedPage(browser, use, storageState) {
    const context = await browser.newContext({ storageState });
    const page = await context.newPage();

    try {
        await page.goto('/');
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
    // Registers this worker's own copies of the stateful accounts, so workers running in
    // parallel never share a cart or order history. Maps env key -> email for this worker.
    workerUsers: [async ({ playwright }, use, workerInfo) => {
        const api = await playwright.request.newContext({ baseURL: workerInfo.project.use.baseURL });
        const users = {};
        try {
            for (const key of STATEFUL_USERS) {
                const email = workerEmail(key, workerInfo.parallelIndex);
                const res = await api.post('/api/auth/register', {
                    data: { name: 'Atai Chynaliev', email, password: process.env.PASSWORD },
                });
                // 409: the account already exists from an earlier run.
                if (!res.ok() && res.status() !== 409) {
                    throw new Error(`Could not register ${email}: ${res.status()} ${await res.text()}`);
                }
                users[key] = email;
            }
        } finally {
            await api.dispose();
        }
        await use(users);
    }, { scope: 'worker' }],

    // Signs each worker account in once and keeps its session cookie. Password hashing is slow
    // on the server, so logging in through the UI before every test throttles parallel runs.
    // Logout only clears the browser's cookie, so a test that signs out doesn't break the saved session.
    workerSessions: [async ({ playwright, workerUsers }, use, workerInfo) => {
        const sessions = {};
        for (const [key, email] of Object.entries(workerUsers)) {
            const api = await playwright.request.newContext({ baseURL: workerInfo.project.use.baseURL });
            try {
                const res = await api.post('/api/auth/login', {
                    data: { email, password: process.env.PASSWORD },
                });
                if (!res.ok()) {
                    throw new Error(`Could not sign in ${email}: ${res.status()} ${await res.text()}`);
                }
                sessions[key] = await api.storageState();
            } finally {
                await api.dispose();
            }
        }
        await use(sessions);
    }, { scope: 'worker' }],

    // Account 1
    authenticatedPage: async ({ browser, workerSessions }, use) => {
        await createAuthenticatedPage(browser, use, workerSessions.REGULAR_USER3);
    },
    // Account 2
    authenticatedPage2: async ({ browser, workerSessions }, use) => {
        await createAuthenticatedPage(browser, use, workerSessions.REGULAR_USER4);
    },
    // Account 3
    authenticatedPage3: async ({ browser, workerSessions }, use) => {
        await createAuthenticatedPage(browser, use, workerSessions.REGULAR_USER6);
    }
});

export { expect };
