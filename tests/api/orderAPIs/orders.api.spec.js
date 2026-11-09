import { test, expect } from '../../fixtures/api.fixture.js';

test.describe('Orders API', () => {
    test('GET /api/orders get orders for a user @smoke @p0', async ({ authApi }) => {
        const res = await authApi.get('/api/orders');

        expect(res.status()).toBe(200);
        expect(res.headers()['content-type']).toContain('application/json');

        const body = await res.json();
        console.log(body)
    })

    test('GET /api/orders specific order for a user unauthorized @smoke @p0', async ({ authApi }) => {
        const res = await authApi.get('/api/orders/28');

        expect(res.status()).toBe(404);
        expect(res.headers()['content-type']).toContain('application/json');

        const body = await res.json();
        console.log(body)
    })
});