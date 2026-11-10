import { test, expect } from '../../fixtures/api.fixture.js';
import { addToCartData, expectedCartProduct, addToCartDataInvalid, addToCartDataOutOfStock } from '../../test-data/cartData.js';

test.describe('Cart API', () => {
    test('GET /api/cart - get empty cart', {
        tag: ['@api', '@p0', '@regression']
    }, async ({ authApi3 }) => {
        const res = await authApi3.get('/api/cart');

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

    test('GET /api/cart - get empty cart not authorized', {
        tag: ['@api', '@p0', '@regression']
    }, async ({ authApi }) => {
        const res = await authApi.get('/api/cart');

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

    test('POST /api/cart - add item to cart', {
        tag: ['@api', '@p0', '@regression']
    }, async ({ authApi3 }) => {
        // Start from an empty cart so re-runs don't stack quantities
        await authApi3.delete('/api/cart');

        const res = await authApi3.post('/api/cart', { data: addToCartData });

        expect(res.status()).toBe(201);
        expect(res.headers()['content-type']).toContain('application/json');

        const body = await res.json();
        expect(body.count).toBe(addToCartData.quantity);
        expect(body.items).toEqual([
            expect.objectContaining({
                quantity: addToCartData.quantity,
                product: expect.objectContaining(expectedCartProduct)
            })
        ]);
        expect(body.subtotal).toBe(expectedCartProduct.price * addToCartData.quantity);
        expect(body.total).toBe(body.subtotal + body.shipping + body.tax);

        // Clean up so the "empty cart" test stays independent
        await authApi3.delete('/api/cart');
    });

    test('POST /api/cart - add item with invalid body returns 400', {
        tag: ['@api', '@p1', '@regression']
    }, async ({ authApi3 }) => {
        const res = await authApi3.post('/api/cart', { data: { quantity: 1 } });

        expect(res.status()).toBe(400);
        expect(res.headers()['content-type']).toContain('application/json');

        const body = await res.json();
        expect(body.error).toContain('productId');
    });

    test('POST /api/cart - add item as a guest returns 401', {
        tag: ['@api', '@p1', '@regression']
    }, async ({ api }) => {
        const res = await api.post('/api/cart', { data: addToCartData });

        expect(res.status()).toBe(401);
        expect(res.headers()['content-type']).toContain('application/json');

        const body = await res.json();
        expect(await res.json()).toEqual({ error: 'Please sign in to continue.' });
    });

    test('POST /api/cart - add item that does not exist', {
        tag: ['@api', '@p1', '@regression']
    }, async ({ authApi3 }) => {
        const res = await authApi3.post('/api/cart', { data: addToCartDataInvalid });

        expect(res.status()).toBe(404);
        expect(res.headers()['content-type']).toContain('application/json');

        const body = await res.json();
        expect(await res.json()).toEqual({ error: 'Product not found.' });
    });

    test('POST /api/cart - add item that is out of stock', {
        tag: ['@api', '@p1', '@regression']
    }, async ({ authApi3 }) => {
        const res = await authApi3.post('/api/cart', { data: addToCartDataOutOfStock });

        expect(res.status()).toBe(409);
        expect(res.headers()['content-type']).toContain('application/json');

        const body = await res.json();
        expect(await res.json()).toEqual({ error: 'This item is out of stock.' });
    });

    test('POST /api/cart - delete item', {
        tag: ['@api', '@p0', '@regression']
    }, async ({ authApi3 }) => {
        // Start from an empty cart so re-runs don't stack quantities
        await authApi3.delete('/api/cart');

        const res = await authApi3.post('/api/cart', { data: addToCartData });

        expect(res.status()).toBe(201);
        expect(res.headers()['content-type']).toContain('application/json');

        const body = await res.json();
        expect(body.count).toBe(addToCartData.quantity);
        expect(body.items).toEqual([
            expect.objectContaining({
                quantity: addToCartData.quantity,
                product: expect.objectContaining(expectedCartProduct)
            })
        ]);
        expect(body.subtotal).toBe(expectedCartProduct.price * addToCartData.quantity);
        expect(body.total).toBe(body.subtotal + body.shipping + body.tax);

        // Clean up so the "empty cart" test stays independent
        await authApi3.delete('/api/cart');

        const results = await authApi3.get('/api/cart');

        expect(results.status()).toBe(200);
        expect(results.headers()['content-type']).toContain('application/json');

        const bodyEmpty = await results.json();
        expect(bodyEmpty).toEqual({
            items: [],
            count: 0,
            subtotal: 0,
            shipping: 0,
            tax: 0,
            total: 0,
            freeShippingThreshold: 3500
        });
    });

    test('DELETE /api/cart - try to delete cart not authorized', {
        tag: ['@api', '@p0', '@regression']
    }, async ({ api }) => {
        const res = await api.delete('/api/cart');

        expect(res.status()).toBe(401);
        expect(res.headers()['content-type']).toContain('application/json');

        const body = await res.json();
        expect(await res.json()).toEqual({ error: 'Please sign in to continue.' });
    });
});
