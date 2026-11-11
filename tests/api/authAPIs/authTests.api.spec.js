import { test, expect } from '../../fixtures/api.fixture';
import dotenv from 'dotenv';

test.describe('Sign up API tests', () => {
    test('POST /api/auth/register - Register a new user', {
        tag: ['@api', '@p0', '@regression']
    }, async ({ api }) => {
        const userData = {
            name: 'Atai Chynaliev',
            email: `atai+${Date.now()}@test.com`,
            password: process.env.PASSWORD
        };
        const res = await api.post('/api/auth/register', {
            data: userData
        });

        expect(res.status()).toBe(201);
        expect(res.headers()['content-type']).toContain('application/json');
        const body = await res.json();
        expect(body).toHaveProperty('user');

        expect(body.user).toMatchObject({
            id: expect.any(Number),
            name: userData.name,
            email: userData.email,
            createdAt: expect.any(String)
        });

        // Password must not be exposed
        expect(body.user).not.toHaveProperty('password');
    });

    test('POST /api/auth/register - Register a new user with no  name', {
        tag: ['@api', '@p0', '@regression']
    }, async ({ api }) => {
        const userData = {
            name: '',
            email: `atai+${Date.now()}@test.com`,
            password: process.env.PASSWORD
        };
        const res = await api.post('/api/auth/register', {
            data: userData
        });

        expect(res.status()).toBe(400);
        expect(res.headers()['content-type']).toContain('application/json');
        const body = await res.json();
        expect(body).toEqual({ error: 'name: Name is required' });
    });

    test('POST /api/auth/register - Register a new user with no password', {
        tag: ['@api', '@p0', '@regression']
    }, async ({ api }) => {
        const userData = {
            name: 'Atai Chynaliev',
            email: `atai+${Date.now()}@test.com`,
            password: ''
        };
        const res = await api.post('/api/auth/register', {
            data: userData
        });

        expect(res.status()).toBe(400);
        expect(res.headers()['content-type']).toContain('application/json');
        const body = await res.json();
        expect(body).toEqual({ error: 'password: Password must be at least 8 characters' });
    });

    test('POST /api/auth/register - Register a new user with no email', {
        tag: ['@api', '@p0', '@regression']
    }, async ({ api }) => {
        const userData = {
            name: 'Atai Chynaliev',
            email: ``,
            password: process.env.PASSWORD
        };
        const res = await api.post('/api/auth/register', {
            data: userData
        });

        expect(res.status()).toBe(400);
        expect(res.headers()['content-type']).toContain('application/json');
        const body = await res.json();
        expect(body).toEqual({ error: 'email: Enter a valid email address' });
    });

    test('POST /api/auth/register - Register a new user with invalid email', {
        tag: ['@api', '@p0', '@regression']
    }, async ({ api }) => {
        const userData = {
            name: 'Atai Chynaliev',
            email: `atai.com`,
            password: process.env.PASSWORD
        };
        const res = await api.post('/api/auth/register', {
            data: userData
        });

        expect(res.status()).toBe(400);
        expect(res.headers()['content-type']).toContain('application/json');
        const body = await res.json();
        expect(body).toEqual({ error: 'email: Enter a valid email address' });
    });

    // test('POST /api/auth/register - Register a new user with weak password', {
    //     tag: ['@api', '@p0', '@regression']
    // }, async ({ api }) => {
    //     const userData = {
    //         name: 'Atai Chynaliev',
    //         email: `atai+${Date.now()}@test.com`,
    //         password: 'password'
    //     };
    //     const res = await api.post('/api/auth/register', {
    //         data: userData
    //     });

    //     expect(res.status()).toBe(400);
    //     expect(res.headers()['content-type']).toContain('application/json');
    //     const body = await res.json();

    //     console.log(body);
    // });

    test('POST /api/auth/register - Register with existing user/email', {
        tag: ['@api', '@p0', '@regression']
    }, async ({ api }) => {
        const userData = {
            name: 'Atai Chynaliev',
            email: `atai@test.com`,
            password: process.env.PASSWORD
        };
        const res = await api.post('/api/auth/register', {
            data: userData
        });

        expect(res.status()).toBe(409);
        expect(res.headers()['content-type']).toContain('application/json');
        const body = await res.json();
        expect(body).toEqual({ error: 'An account with this email already exists.' });
    });
});
