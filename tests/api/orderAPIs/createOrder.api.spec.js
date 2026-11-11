import { test, expect } from '../../fixtures/api.fixture.js';
import { orderData } from '../../test-data/correctOrderData.js';
import { addToCartData } from '../../test-data/cartData'
import { wrongOrderDataCard, cardDataMissingOrderData, shippingDataMissingOrderData, declinedOrderDataCard } from '../../test-data/wrongOrderData.js'
import { emptyCart } from '../../test-data/emptyCart.js'
import { cancelPlacedOrders } from '../../fixtures/orderCleanup.js'

test.describe('Orders API', () => {
    test.beforeEach(async ({ authApi }) => { await authApi.delete('/api/cart'); });
    test.afterEach(async ({ authApi }) => {
        await authApi.delete('/api/cart');
        await cancelPlacedOrders(authApi); // restock what the happy path ordered
    });

    test('POST /api/orders - Create order with empty cart', {
        tag: ['@api', '@p0', '@regression']
    }, async ({ authApi }) => {
        const res = await authApi.post('/api/orders', {
            data: orderData
        });

        expect(res.status()).toBe(400);
        expect(res.headers()['content-type']).toContain('application/json');
        const body = await res.json();

        expect(body).toEqual({
            error: 'Your cart is empty.'
        });
    });


    test('POST /api/orders happy path @smoke @p0', async ({ authApi }) => {
        await authApi.post('/api/cart', { data: addToCartData });
        const res = await authApi.post('/api/orders', {
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

        const resEmptyCart = await authApi.get('/api/cart');

        expect(resEmptyCart.status()).toBe(200);
        expect(resEmptyCart.headers()['content-type']).toContain('application/json');

        const bodyEmptyCart = await resEmptyCart.json();
        expect(bodyEmptyCart).toEqual(emptyCart);
    })

    test('POST /api/orders card invalid @smoke @p0', async ({ authApi }) => {
        await authApi.post('/api/cart', { data: addToCartData });
        const res = await authApi.post('/api/orders', {
            data: wrongOrderDataCard
        });

        expect(res.status()).toBe(400);
        expect(res.headers()['content-type']).toContain('application/json');
        const body = await res.json();
        expect(body).toEqual({
            error: 'payment.cardNumber: Card number is invalid'
        });

        const cart = await authApi.get('/api/cart');
        expect(cart.status()).toBe(200);
        expect(cart.headers()['content-type']).toContain('application/json');
        const cartBody = await cart.json();
        expect(cartBody.items).not.toHaveLength(0);
    })

    test('POST /api/orders missing card data @smoke @p0', async ({ authApi }) => {
        await authApi.post('/api/cart', { data: addToCartData });
        const res = await authApi.post('/api/orders', {
            data: cardDataMissingOrderData
        });

        expect(res.status()).toBe(400);
        expect(res.headers()['content-type']).toContain('application/json');
        const body = await res.json();
        expect(body).toEqual({
            error: 'payment.cvc: Enter a valid security code'
        });

        const cart = await authApi.get('/api/cart');
        expect(cart.status()).toBe(200);
        expect(cart.headers()['content-type']).toContain('application/json');
        const cartBody = await cart.json();
        expect(cartBody.items).not.toHaveLength(0);
    })

    test('POST /api/orders missing shipping data @smoke @p0', async ({ authApi }) => {
        await authApi.post('/api/cart', { data: addToCartData });
        const res = await authApi.post('/api/orders', {
            data: shippingDataMissingOrderData
        });

        expect(res.status()).toBe(400);
        expect(res.headers()['content-type']).toContain('application/json');
        const body = await res.json();
        expect(body).toEqual({
            error: 'shipping.postalCode: Enter a valid postal code'
        });

        const cart = await authApi.get('/api/cart');
        expect(cart.status()).toBe(200);
        expect(cart.headers()['content-type']).toContain('application/json');
        const cartBody = await cart.json();
        expect(cartBody.items).not.toHaveLength(0);
    })

    test('POST /api/orders card declined @smoke @p0', async ({ authApi }) => {
        await authApi.post('/api/cart', { data: addToCartData });
        const res = await authApi.post('/api/orders', {
            data: declinedOrderDataCard
        });

        expect(res.status()).toBe(402);
        expect(res.headers()['content-type']).toContain('application/json');
        const body = await res.json();
        expect(body).toEqual({
            error: 'Your card was declined. Try a different card.'
        });

        const cart = await authApi.get('/api/cart');
        expect(cart.status()).toBe(200);
        expect(cart.headers()['content-type']).toContain('application/json');
        const cartBody = await cart.json();
        expect(cartBody.items).not.toHaveLength(0);
    })
});