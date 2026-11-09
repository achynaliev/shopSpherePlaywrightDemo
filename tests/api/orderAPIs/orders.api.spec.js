import { test, expect } from '../../fixtures/api.fixture.js';

test.describe('Orders API', () => {
    test('GET /api/orders get orders for a user @smoke @p0', async ({ authApi }) => {
        const res = await authApi.get('/api/orders');

        expect(res.status()).toBe(200);
        expect(res.headers()['content-type']).toContain('application/json');

        const body = await res.json();
        expect(body).toHaveProperty('orders');
        expect(body.orders).toBeInstanceOf(Array);

        for (const order of body.orders) {
            expect(order).toEqual(
                expect.objectContaining({
                    id: expect.any(Number),
                    userId: expect.any(Number)
                })
            );
        }
    })

    test('GET /api/orders specific order for a different user @smoke @p0', async ({ authApi }) => {
        const res = await authApi.get('/api/orders/28');

        expect(res.status()).toBe(404);
        expect(res.headers()['content-type']).toContain('application/json');

        const body = await res.json();
        expect(body).toEqual({
            error: 'Order not found.'
        });
    })

    test('GET /api/orders get orders for an unauthorized request @smoke @p0', async ({ api }) => {
        const res = await api.get('/api/orders');

        expect(res.status()).toBe(401);
        expect(res.headers()['content-type']).toContain('application/json');

        const body = await res.json();
        expect(body).toEqual({
            error: 'Please sign in to continue.'
        });
    })

    test('GET /api/orders specific order for an unauthorized request @smoke @p0', async ({ api }) => {
        const res = await api.get('/api/orders/28');

        expect(res.status()).toBe(401);
        expect(res.headers()['content-type']).toContain('application/json');

        const body = await res.json();
        expect(body).toEqual({
            error: 'Please sign in to continue.'
        });
    })
});