import { test, expect } from '../../fixtures/api.fixture';
import dotenv from 'dotenv';

test.describe('Login and Logout API tests', () => {
    test('POST /api/auth/login happy path login and logout', {
        tag: ['@api', '@p0', '@regression']
    }, async ({ api }) => {
        const userData = {
            email: process.env.REGULAR_USER,
            password: process.env.PASSWORD
        };
        const res = await api.post('/api/auth/login', {
            data: userData
        });
        expect(res.status()).toBe(200);
        expect(res.headers()['content-type']).toContain('application/json');
        const body = await res.json();
        expect(body.user).toMatchObject({
            id: expect.any(Number),
            name: 'Atai Chynaliev',
            email: process.env.REGULAR_USER,
            createdAt: expect.any(String)
        });
        expect(body.user).not.toHaveProperty('password');

        const resLogout = await api.post('/api/auth/logout');
        expect(resLogout.status()).toBe(200);
        expect(resLogout.headers()['content-type']).toContain('application/json');
        const bodyLogout = await resLogout.json();
        expect(bodyLogout).toEqual({ ok: true });
    });

    test('POST /api/auth/login happy path logout', {
        tag: ['@api', '@p0', '@regression']
    }, async ({ api }) => {
        const res = await api.post('/api/auth/logout');
        expect(res.status()).toBe(200);
        expect(res.headers()['content-type']).toContain('application/json');
        const body = await res.json();
        expect(body).toEqual({ ok: true });
    });

    test('POST /api/auth/login login wrong password', {
        tag: ['@api', '@p0', '@regression']
    }, async ({ api }) => {
        const userData = {
            email: process.env.REGULAR_USER,
            password: 'password'
        };
        const res = await api.post('/api/auth/login', {
            data: userData
        });
        expect(res.status()).toBe(401);
        expect(res.headers()['content-type']).toContain('application/json');
        const body = await res.json();
        expect(body).toEqual({ error: 'Incorrect email or password.' });
    });

    test('POST /api/auth/login login wrong user, not email', {
        tag: ['@api', '@p0', '@regression']
    }, async ({ api }) => {
        const userData = {
            email: "atai.com",
            password: process.env.PASSWORD
        };
        const res = await api.post('/api/auth/login', {
            data: userData
        });
        expect(res.status()).toBe(400);
        expect(res.headers()['content-type']).toContain('application/json');
        const body = await res.json();
        expect(body).toEqual({ error: 'email: Enter a valid email address' });
    });

    test('POST /api/auth/login login missing password', {
        tag: ['@api', '@p0', '@regression']
    }, async ({ api }) => {
        const userData = {
            email: process.env.REGULAR_USER,
            password: ""
        };
        const res = await api.post('/api/auth/login', {
            data: userData
        });
        expect(res.status()).toBe(400);
        expect(res.headers()['content-type']).toContain('application/json');
        const body = await res.json();
        expect(body).toEqual({ error: 'password: Password is required' });
    });
});
