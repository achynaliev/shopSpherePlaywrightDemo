import { test, expect } from '../../fixtures/api.fixture.js';
import { addToCartData, expectedCartProduct } from '../../test-data/cartData.js';

const LOW_STOCK_PRODUCT_ID = 1; // Auralis Pro headphones: seeded with stock below the per-line cap of 10

test.describe('Cart item API (PUT / DELETE /api/cart/{productId})', () => {
    // authApi4's cart is shared by every test in this file, so reset it around each one
    test.beforeEach(async ({ authApi4 }) => { await authApi4.delete('/api/cart'); });
    test.afterEach(async ({ authApi4 }) => { await authApi4.delete('/api/cart'); });

    test('PUT /api/cart/{productId} - sets quantity of a cart line', {
        tag: ['@api', '@p0', '@regression']
    }, async ({ authApi4 }) => {
        await authApi4.post('/api/cart', { data: addToCartData });

        const res = await authApi4.put(`/api/cart/${addToCartData.productId}`, { data: { quantity: 4 } });

        expect(res.status()).toBe(200);
        expect(res.headers()['content-type']).toContain('application/json');
        const body = await res.json();
        expect(body.count).toBe(4);
        expect(body.items).toEqual([
            expect.objectContaining({ quantity: 4, product: expect.objectContaining(expectedCartProduct) })
        ]);
        expect(body.subtotal).toBe(expectedCartProduct.price * 4);
    });

    test('PUT /api/cart/{productId} - replaces quantity instead of adding to it', {
        tag: ['@api', '@p1', '@regression']
    }, async ({ authApi4 }) => {
        await authApi4.post('/api/cart', { data: { productId: addToCartData.productId, quantity: 5 } });

        const res = await authApi4.put(`/api/cart/${addToCartData.productId}`, { data: { quantity: 2 } });

        expect(res.status()).toBe(200);
        expect((await res.json()).items[0].quantity).toBe(2);
    });

    test('PUT /api/cart/{productId} - quantity outside 1..10 returns 400', {
        tag: ['@api', '@p1', '@regression']
    }, async ({ authApi4 }) => {
        await authApi4.post('/api/cart', { data: addToCartData });

        for (const quantity of [0, 11]) {
            const res = await authApi4.put(`/api/cart/${addToCartData.productId}`, { data: { quantity } });
            expect(res.status(), `quantity ${quantity}`).toBe(400);
            expect((await res.json()).error).toContain('quantity');
        }
    });

    test('PUT /api/cart/{productId} - missing quantity returns 400', {
        tag: ['@api', '@p2', '@regression']
    }, async ({ authApi4 }) => {
        await authApi4.post('/api/cart', { data: addToCartData });

        const res = await authApi4.put(`/api/cart/${addToCartData.productId}`, { data: {} });

        expect(res.status()).toBe(400);
        expect((await res.json()).error).toContain('quantity');
    });

    test('PUT /api/cart/{productId} - product not in cart returns 404', {
        tag: ['@api', '@p1', '@regression']
    }, async ({ authApi4 }) => {
        const res = await authApi4.put(`/api/cart/${addToCartData.productId}`, { data: { quantity: 1 } });

        expect(res.status()).toBe(404);
        expect(await res.json()).toEqual({ error: 'Item is not in your cart.' });
    });

    test('PUT /api/cart/{productId} - quantity above available stock returns 409', {
        tag: ['@api', '@p1', '@regression']
    }, async ({ authApi4 }) => {
        // Read stock at runtime: orders and cancellations change it
        const { product } = await (await authApi4.get(`/api/products/${LOW_STOCK_PRODUCT_ID}`)).json();
        test.skip(product.stock < 1 || product.stock >= 10, `needs stock 1-9, product has ${product.stock}`);

        await authApi4.post('/api/cart', { data: { productId: LOW_STOCK_PRODUCT_ID, quantity: 1 } });

        const res = await authApi4.put(`/api/cart/${LOW_STOCK_PRODUCT_ID}`, { data: { quantity: product.stock + 1 } });

        expect(res.status()).toBe(409);
        expect(await res.json()).toEqual({ error: `Only ${product.stock} available for this item.` });
    });

    test('PUT /api/cart/{productId} - without auth returns 401', {
        tag: ['@api', '@p0', '@regression']
    }, async ({ api }) => {
        const res = await api.put(`/api/cart/${addToCartData.productId}`, { data: { quantity: 1 } });

        expect(res.status()).toBe(401);
        expect(await res.json()).toEqual({ error: 'Please sign in to continue.' });
    });

    test('DELETE /api/cart/{productId} - removes a cart line', {
        tag: ['@api', '@p0', '@regression']
    }, async ({ authApi4 }) => {
        await authApi4.post('/api/cart', { data: addToCartData });

        const res = await authApi4.delete(`/api/cart/${addToCartData.productId}`);

        expect(res.status()).toBe(200);
        expect(res.headers()['content-type']).toContain('application/json');
        const body = await res.json();
        expect(body.items).toEqual([]);
        expect(body.count).toBe(0);
        expect(body.total).toBe(0);
    });

    test('DELETE /api/cart/{productId} - removes only that line', {
        tag: ['@api', '@p1', '@regression']
    }, async ({ authApi4 }) => {
        await authApi4.post('/api/cart', { data: addToCartData });
        await authApi4.post('/api/cart', { data: { productId: LOW_STOCK_PRODUCT_ID, quantity: 1 } });

        const res = await authApi4.delete(`/api/cart/${LOW_STOCK_PRODUCT_ID}`);

        expect(res.status()).toBe(200);
        expect((await res.json()).items.map(i => i.product.id)).toEqual([addToCartData.productId]);
    });

    test('DELETE /api/cart/{productId} - is idempotent when product not in cart', {
        tag: ['@api', '@p2', '@regression']
    }, async ({ authApi4 }) => {
        const res = await authApi4.delete(`/api/cart/${addToCartData.productId}`);

        expect(res.status()).toBe(200);
        expect((await res.json()).count).toBe(0);
    });

    test('DELETE /api/cart/{productId} - without auth returns 401', {
        tag: ['@api', '@p0', '@regression']
    }, async ({ api }) => {
        const res = await api.delete(`/api/cart/${addToCartData.productId}`);

        expect(res.status()).toBe(401);
        expect(await res.json()).toEqual({ error: 'Please sign in to continue.' });
    });
});
