import { test, expect } from '../../fixtures/api.fixture';
import dotenv from 'dotenv';

test.describe('Login and Logout API tests', () => {
    test('POST /api/auth/me happy path to get profile info', {
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

        const me = await api.get('/api/auth/me')
        expect(me.status()).toBe(200);
        expect(me.headers()['content-type']).toContain('application/json');
        const bodyMe = await res.json();
        expect(bodyMe.user).toEqual({
            id: expect.any(Number),
            name: 'Atai Chynaliev',
            email: 'atai@test.com',
            createdAt: expect.any(String)
        });

        expect(body.user).not.toHaveProperty('password');

        const resLogout = await api.post('/api/auth/logout');
        expect(resLogout.status()).toBe(200);
        expect(resLogout.headers()['content-type']).toContain('application/json');
        const bodyLogout = await resLogout.json();
        expect(bodyLogout).toEqual({ ok: true });
    });

    test('POST /api/auth/me without being logged in', {
        tag: ['@api', '@p0', '@regression']
    }, async ({ api }) => {
        const me = await api.get('/api/auth/me')
        expect(me.status()).toBe(200);
        expect(me.headers()['content-type']).toContain('application/json');
        const bodyMe = await me.json();
        expect(bodyMe).toEqual({ user: null });
    });
});