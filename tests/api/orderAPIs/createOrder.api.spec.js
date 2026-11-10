import { test, expect } from '../../fixtures/api.fixture.js';
import { orderData } from '../../test-data/correctOrderData.js';
import { addToCartData } from '../../test-data/cartData'
import { wrongOrderDataCard, cardDataMissingOrderData, shippingDataMissingOrderData } from '../../test-data/wrongOrderData.js'

test.describe('Orders API', () => {
    test('POST /api/orders - Create order with empty cart', {
        tag: ['@api', '@p0', '@regression']
    }, async ({ authApi2 }) => {
        await authApi2.delete('/api/cart');
        const res = await authApi2.post('/api/orders', {
            data: orderData
        });

        expect(res.status()).toBe(400);
        expect(res.headers()['content-type']).toContain('application/json');
        const body = await res.json();

        expect(body).toEqual({
            error: 'Your cart is empty.'
        });
    });


    test('POST /api/orders happy path @smoke @p0', async ({ authApi2 }) => {
        // Start from an empty cart so re-runs don't stack quantities
        await authApi2.delete('/api/cart');

        await authApi2.post('/api/cart', { data: addToCartData });
        const res = await authApi2.post('/api/orders', {
            data: orderData
        });

        expect(res.status()).toBe(201);
        expect(res.headers()['content-type']).toContain('application/json');
        const body = await res.json();
        const order = body.order;

        expect(order.id).toEqual(expect.any(Number));
        expect(order.orderNumber).toMatch(/^\d{3}-\d{7}-\d{7}$/);
        expect(order.status).toBe('placed');

        expect(order.subtotal).toBe(6499);
        expect(order.shipping).toBe(0);
        expect(order.tax).toBe(520);
        expect(order.total).toBe(7019);

        expect(order.shippingAddress).toMatchObject({
            fullName: 'Atai Chynaliev',
            city: 'San Mateo',
            state: 'CA',
            postalCode: '94403',
            country: 'United States'
        });

        expect(order.payment).toEqual({
            brand: 'Visa',
            last4: '4242'
        });

        expect(order.items).toHaveLength(1);

        // Security: sensitive payment details must not be returned
        expect(JSON.stringify(order)).not.toContain('4242 4242 4242 4242');
        expect(JSON.stringify(order)).not.toContain('"cvc"');

        // Verify total calculation
        expect(order.total).toBe(
            order.subtotal + order.shipping + order.tax
        );

        const resEmptyCart = await authApi2.get('/api/cart');

        expect(resEmptyCart.status()).toBe(200);
        expect(resEmptyCart.headers()['content-type']).toContain('application/json');

        const bodyEmptyCart = await resEmptyCart.json();
        expect(bodyEmptyCart).toEqual({
            items: [],
            count: 0,
            subtotal: 0,
            shipping: 0,
            tax: 0,
            total: 0,
            freeShippingThreshold: 3500
        });
    })

    test('POST /api/orders card declined @smoke @p0', async ({ authApi2 }) => {
        // Start from an empty cart so re-runs don't stack quantities
        await authApi2.delete('/api/cart');

        await authApi2.post('/api/cart', { data: addToCartData });
        const res = await authApi2.post('/api/orders', {
            data: wrongOrderDataCard
        });

        expect(res.status()).toBe(400);
        expect(res.headers()['content-type']).toContain('application/json');
        const body = await res.json();
        expect(body).toEqual({
            error: 'payment.cardNumber: Card number is invalid'
        });

        const cart = await authApi2.get('/api/cart');
        expect(cart.status()).toBe(200);
        expect(cart.headers()['content-type']).toContain('application/json');
        const cartBody = await cart.json();
        expect(cartBody.items).not.toHaveLength(0);

        await authApi2.delete('/api/cart');
    })

    test('POST /api/orders missing card data @smoke @p0', async ({ authApi2 }) => {
        // Start from an empty cart so re-runs don't stack quantities
        await authApi2.delete('/api/cart');

        await authApi2.post('/api/cart', { data: addToCartData });
        const res = await authApi2.post('/api/orders', {
            data: cardDataMissingOrderData
        });

        expect(res.status()).toBe(400);
        expect(res.headers()['content-type']).toContain('application/json');
        const body = await res.json();
        expect(body).toEqual({
            error: 'payment.cvc: Enter a valid security code'
        });

        const cart = await authApi2.get('/api/cart');
        expect(cart.status()).toBe(200);
        expect(cart.headers()['content-type']).toContain('application/json');
        const cartBody = await cart.json();
        expect(cartBody.items).not.toHaveLength(0);

        await authApi2.delete('/api/cart');
    })

    test('POST /api/orders missing shipping data @smoke @p0', async ({ authApi2 }) => {
        // Start from an empty cart so re-runs don't stack quantities
        await authApi2.delete('/api/cart');

        await authApi2.post('/api/cart', { data: addToCartData });
        const res = await authApi2.post('/api/orders', {
            data: shippingDataMissingOrderData
        });

        expect(res.status()).toBe(400);
        expect(res.headers()['content-type']).toContain('application/json');
        const body = await res.json();
        expect(body).toEqual({
            error: 'shipping.postalCode: Enter a valid postal code'
        });

        const cart = await authApi2.get('/api/cart');
        expect(cart.status()).toBe(200);
        expect(cart.headers()['content-type']).toContain('application/json');
        const cartBody = await cart.json();
        expect(cartBody.items).not.toHaveLength(0);

        await authApi2.delete('/api/cart');
    })
});