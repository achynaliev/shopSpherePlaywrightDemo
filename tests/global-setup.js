import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { request } from '@playwright/test';
import dotenv from 'dotenv';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Load .env from ECOMMERCE root (in CI the variables come from GitHub secrets instead).
dotenv.config({ path: path.join(ROOT_DIR, '.env') });

// Accounts the specs sign in with. The names matter: specs assert on "Hello, <first name>".
const USERS = [
    { key: 'REGULAR_USER', name: 'Atai Regular' },
    { key: 'REGULAR_USER2', name: 'atai session' },
    { key: 'REGULAR_USER3', name: 'Atai Shopper' },
    { key: 'REGULAR_USER4', name: 'Atai Shopper Two' },
];

// Registers the test accounts so the suite also runs against a fresh database (e.g. in CI).
export default async function globalSetup(config) {
    const { baseURL } = config.projects[0].use;
    const api = await request.newContext({ baseURL });
    try {
        for (const { key, name } of USERS) {
            const email = process.env[key];
            if (!email) throw new Error(`Missing environment variable: ${key}`);
            const res = await api.post('/api/auth/register', {
                data: { name, email, password: process.env.PASSWORD },
            });
            // 409: the account already exists from an earlier run.
            if (!res.ok() && res.status() !== 409) {
                throw new Error(`Could not register ${key}: ${res.status()} ${await res.text()}`);
            }
        }
    } finally {
        await api.dispose();
    }
}
