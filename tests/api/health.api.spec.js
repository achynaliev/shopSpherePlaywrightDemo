import { test, expect } from '../fixtures/api.fixture';

test.describe('Health API tests', () => {
    test('GET /api/health health API check', async ({ api }) => {
        const res = await api.get('/api/health');
        expect(res.status()).toBe(200);
        expect(res.headers()['content-type']).toContain('application/json');
        const body = await res.json();
        expect(body).toEqual({ ok: true });
    })

    test('GET /api/health health API check as user', async ({ authApi }) => {
        const res = await authApi.get('/api/health');
        expect(res.status()).toBe(200);
        expect(res.headers()['content-type']).toContain('application/json');
        const body = await res.json();
        expect(body).toEqual({ ok: true });
    })
});

