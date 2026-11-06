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

export const test = base.extend({
    // Guest client: no session cookie. Use for public endpoints and 401 checks.
    api: async ({ playwright }, use, testInfo) => {
        const api = await playwright.request.newContext({
            baseURL: baseURLOf(testInfo),
            extraHTTPHeaders: headersOf(testInfo),
        });
        await use(api);
        await api.dispose();
    },

    // This worker's API account: { email, password, name }. Registered once per worker.
    apiUser: [async ({ playwright }, use, workerInfo) => {
        if (!process.env.PASSWORD) throw new Error('Missing environment variable: PASSWORD');
        const user = {
            name: 'Atai Chynaliev',
            email: apiUserEmail(workerInfo.parallelIndex),
            password: process.env.PASSWORD,
        };
        const api = await playwright.request.newContext({ baseURL: baseURLOf(workerInfo) });
        try {
            const res = await api.post('/api/auth/register', { data: user });
            // 409: the account already exists from an earlier run.
            if (!res.ok() && res.status() !== 409) {
                throw new Error(`Could not register ${user.email}: ${res.status()} ${await res.text()}`);
            }
        } finally {
            await api.dispose();
        }
        await use(user);
    }, { scope: 'worker' }],

    // Signs the worker account in once and keeps the session cookie (password hashing is slow).
    apiSession: [async ({ playwright, apiUser }, use, workerInfo) => {
        const api = await playwright.request.newContext({ baseURL: baseURLOf(workerInfo) });
        let state;
        try {
            const res = await api.post('/api/auth/login', {
                data: { email: apiUser.email, password: apiUser.password },
            });
            if (!res.ok()) {
                throw new Error(`Could not sign in ${apiUser.email}: ${res.status()} ${await res.text()}`);
            }
            state = await api.storageState();
        } finally {
            await api.dispose();
        }
        await use(state);
    }, { scope: 'worker' }],

    // Signed-in client for endpoints behind requireAuth (cart, orders, reviews, /me).
    authApi: async ({ playwright, apiSession }, use, testInfo) => {
        const api = await playwright.request.newContext({
            baseURL: baseURLOf(testInfo),
            extraHTTPHeaders: headersOf(testInfo),
            storageState: apiSession,
        });
        await use(api);
        await api.dispose();
    },
});

export { expect };
