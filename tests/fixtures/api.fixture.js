import { test as base, expect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../');
dotenv.config({ path: path.join(ROOT_DIR, '.env') });

// Base URL for API specs. The 'api' project in playwright.config.js sets it from
// API_BASE_URL, falling back to the local app (E2E_BASE_URL or http://localhost:4173).
const baseURLOf = (workerInfo) => workerInfo.project.use.baseURL;
const headersOf = (workerInfo) => workerInfo.project.use.extraHTTPHeaders;

// Each worker gets its own API account (name+api-w0@x.com, ...), so parallel specs that
// change a cart or place orders never step on each other or on the UI specs' accounts.
function apiUserEmail(parallelIndex) {
    if (!process.env.REGULAR_USER) throw new Error('Missing environment variable: REGULAR_USER');
    const [local, domain] = process.env.REGULAR_USER.split('@');
    return `${local}+api-w${parallelIndex}@${domain}`;
}

// Registers the account if needed, signs in, and returns its session cookie.
async function createSession(playwright, workerInfo, email) {
    if (!process.env.PASSWORD) throw new Error('Missing environment variable: PASSWORD');
    const user = {
        name: 'Atai Chynaliev',
        email,
        password: process.env.PASSWORD,
    };
    const api = await playwright.request.newContext({ baseURL: baseURLOf(workerInfo) });
    try {
        const registered = await api.post('/api/auth/register', { data: user });
        // 409: the account already exists from an earlier run.
        if (!registered.ok() && registered.status() !== 409) {
            throw new Error(`Could not register ${user.email}: ${registered.status()} ${await registered.text()}`);
        }
        const res = await api.post('/api/auth/login', {
            data: { email: user.email, password: user.password },
        });
        if (!res.ok()) {
            throw new Error(`Could not sign in ${user.email}: ${res.status()} ${await res.text()}`);
        }
        return await api.storageState();
    } finally {
        await api.dispose();
    }
}

// Gives a test a client signed in with the given session, then cleans it up.
async function provideClient(playwright, testInfo, storageState, use) {
    const api = await playwright.request.newContext({
        baseURL: baseURLOf(testInfo),
        extraHTTPHeaders: headersOf(testInfo),
        storageState,
    });
    await use(api);
    await api.dispose();
}

export const test = base.extend({
    // Guest client: no session cookie. Use for public endpoints and 401 checks.
    api: async ({ playwright }, use, testInfo) => {
        await provideClient(playwright, testInfo, undefined, use);
    },

    // Sessions are created once per worker because password hashing is slow.
    apiSession: [async ({ playwright }, use, workerInfo) => {
        await use(await createSession(playwright, workerInfo, apiUserEmail(workerInfo.parallelIndex)));
    }, { scope: 'worker' }],

    // The real REGULAR_USER3 account, which has order history. All workers share it,
    // so use it for reading only: don't change its cart or place orders with it.
    otherApiSession: [async ({ playwright }, use, workerInfo) => {
        if (!process.env.REGULAR_USER3) throw new Error('Missing environment variable: REGULAR_USER3');
        await use(await createSession(playwright, workerInfo, process.env.REGULAR_USER3));
    }, { scope: 'worker' }],

    otherApiSession2: [async ({ playwright }, use, workerInfo) => {
        if (!process.env.REGULAR_USER4) throw new Error('Missing environment variable: REGULAR_USER4');
        await use(await createSession(playwright, workerInfo, process.env.REGULAR_USER4));
    }, { scope: 'worker' }],

    otherApiSession3: [async ({ playwright }, use, workerInfo) => {
        if (!process.env.REGULAR_USER6) throw new Error('Missing environment variable: REGULAR_USER6');
        await use(await createSession(playwright, workerInfo, process.env.REGULAR_USER6));
    }, { scope: 'worker' }],

    // Signed-in clients for endpoints behind requireAuth (cart, orders, reviews, /me).
    authApi: async ({ playwright, apiSession }, use, testInfo) => {
        await provideClient(playwright, testInfo, apiSession, use);
    },

    // Signed in as REGULAR_USER3, for checking that users can't reach each other's data.
    authApi2: async ({ playwright, otherApiSession }, use, testInfo) => {
        await provideClient(playwright, testInfo, otherApiSession, use);
    },

    authApi3: async ({ playwright, otherApiSession2 }, use, testInfo) => {
        await provideClient(playwright, testInfo, otherApiSession2, use);
    },

    authApi4: async ({ playwright, otherApiSession3 }, use, testInfo) => {
        await provideClient(playwright, testInfo, otherApiSession3, use);
    },
});

export { expect };
