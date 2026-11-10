import { test, expect } from '../../fixtures/api.fixture.js';
import { addToCartData, addToCartDataInvalid, addToCartDataOutOfStock, expectedCartProduct } from '../../test-data/cartData.js';

test.describe('Cart merge API', () => {
    // authApi3's cart is shared across tests, so reset it around each one
    test.beforeEach(async ({ authApi3 }) => { await authApi3.delete('/api/cart'); });
    test.afterEach(async ({ authApi3 }) => { await authApi3.delete('/api/cart'); });

    test('POST /api/cart/merge - merges guest items into empty cart', {
        tag: ['@api', '@p0', '@regression']
    }, async ({ authApi3 }) => {
        const res = await authApi3.post('/api/cart/merge', {
            data: { items: [{ productId: 8, quantity: 2 }] }
        });

        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.count).toBe(2);
        expect(body.items).toEqual([
            expect.objectContaining({ quantity: 2, product: expect.objectContaining(expectedCartProduct) })
        ]);
    });

    test('POST /api/cart/merge - adds to quantity already in cart', {
        tag: ['@api', '@p0', '@regression']
    }, async ({ authApi3 }) => {
        await authApi3.post('/api/cart', { data: addToCartData }); // account cart: qty 1

        const res = await authApi3.post('/api/cart/merge', {
            data: { items: [{ productId: 8, quantity: 2 }] }      // guest cart: qty 2
        });

        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.items).toHaveLength(1);                         // same line, not a duplicate
        expect(body.items[0].quantity).toBe(3);
    });

    test('POST /api/cart/merge - skips unknown and out-of-stock products', {
        tag: ['@api', '@p1', '@regression']
    }, async ({ authApi3 }) => {
        const res = await authApi3.post('/api/cart/merge', {
            data: { items: [addToCartData, addToCartDataInvalid, addToCartDataOutOfStock] }
        });

        expect(res.status()).toBe(200);                             // no 404/409, unlike POST /api/cart
        const body = await res.json();
        expect(body.items.map(i => i.product.id)).toEqual([8]);
    });

    test('POST /api/cart/merge - clamps quantity to the max of 10', {
        tag: ['@api', '@p1', '@regression']
    }, async ({ authApi3 }) => {
        const res = await authApi3.post('/api/cart/merge', {
            data: { items: [{ productId: 8, quantity: 10 }, { productId: 8, quantity: 5 }] }
        });

        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.items[0].quantity).toBe(10);                    // 15 requested, capped
    });

    test('POST /api/cart/merge - empty items leaves cart unchanged', {
        tag: ['@api', '@p2', '@regression']
    }, async ({ authApi3 }) => {
        const res = await authApi3.post('/api/cart/merge', { data: { items: [] } });

        expect(res.status()).toBe(200);
        expect((await res.json()).count).toBe(0);
    });

    test('POST /api/cart/merge - invalid body returns 400', {
        tag: ['@api', '@p1', '@regression']
    }, async ({ authApi3 }) => {
        const res = await authApi3.post('/api/cart/merge', { data: { items: [{ quantity: 1 }] } });

        expect(res.status()).toBe(400);
        expect((await res.json()).error).toContain('productId');
    });

    test('POST /api/cart/merge - without auth returns 401', {
        tag: ['@api', '@p0', '@regression']
    }, async ({ api }) => {
        const res = await api.post('/api/cart/merge', { data: { items: [addToCartData] } });

        expect(res.status()).toBe(401);
        expect(await res.json()).toEqual({ error: 'Please sign in to continue.' });
    });
});