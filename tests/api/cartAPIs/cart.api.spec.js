import { test, expect } from '../../fixtures/api.fixture.js';

test.describe('Cart API', () => {
    test('GET /api/cart - get empty cart', {
        tag: ['@api', '@p0', '@regression']
    }, async ({ AuthApi3 }) => {
        const res = await AuthApi3.get('/api/cart');

        expect(res.status()).toBe(200);
        expect(res.headers()['content-type']).toContain('application/json');

        const body = await res.json();
        expect(body).toEqual({
            items: [],
            count: 0,
            subtotal: 0,
            shipping: 0,
            tax: 0,
            total: 0,
            freeShippingThreshold: 3500
        });
    });
});