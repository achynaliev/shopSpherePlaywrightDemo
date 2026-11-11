import { test, expect } from '../../fixtures/api.fixture.js';
import { addToCartData } from '../../test-data/cartData.js';
import { orderData } from '../../test-data/correctOrderData.js'
import { cancelPlacedOrders } from '../../fixtures/orderCleanup.js'
let orderId;

test.describe('Orders API', () => {
    // The tests below share orderId, so clean up once at the end, not after each test.
    // afterAll can't use test fixtures like authApi, so build a client from this worker's session.
    test.afterAll(async ({ playwright, apiSession }, workerInfo) => {
        const client = await playwright.request.newContext({
            baseURL: workerInfo.project.use.baseURL,
            storageState: apiSession,
        });
        try {
            await cancelPlacedOrders(client); // restocks if the cancel test failed or didn't run
        } finally {
            await client.dispose();
        }
    });

    test('POST /api/orders create order and get that order', async ({ authApi }) => {
        await authApi.post('/api/cart', { data: addToCartData });
        const res = await authApi.post('/api/orders', {
            data: orderData
        });

        expect(res.status()).toBe(201);
        expect(res.headers()['content-type']).toContain('application/json');
        const body = await res.json();
        const order = body.order;
        orderId = order.id

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

        const orderRes = await authApi.get(`/api/orders/${orderId}`);
        expect(orderRes.status()).toBe(200);
        expect(orderRes.headers()['content-type']).toContain('application/json');
        const orderBody = await orderRes.json();
        const newOrder = orderBody.order;

        // Order details
        expect(newOrder.id).toEqual(expect.any(Number));
        expect(newOrder.orderNumber).toMatch(/^\d{3}-\d{7}-\d{7}$/);
        expect(newOrder.status).toBe('placed');

        // Order items
        expect(newOrder.items).toHaveLength(1);
        expect(newOrder.items[0]).toMatchObject({
            productId: 8,
            slug: 'brewmaster-12-cup-programmable-coffee-maker',
            title: 'Brewmaster 12-Cup Programmable Coffee Maker',
            price: 6499,
            quantity: 1
        });
        // Financial calculations
        expect(newOrder.subtotal).toBe(6499);
        expect(newOrder.shipping).toBe(0);
        expect(newOrder.tax).toBe(520);
        expect(newOrder.total).toBe(7019);
        expect(newOrder.total).toBe(
            newOrder.subtotal + newOrder.shipping + newOrder.tax
        );
        // Shipping information
        expect(newOrder.shippingAddress).toMatchObject({
            fullName: 'Atai Chynaliev',
            city: 'San Mateo',
            state: 'CA',
            postalCode: '94403',
            country: 'United States'
        });
        // Payment information
        expect(newOrder.payment).toEqual({
            brand: 'Visa',
            last4: '4242'
        });
    })

    test('POST /api/orders cancel order', async ({ authApi }) => {
        const canceledOrder = await authApi.post(`/api/orders/${orderId}/cancel`);
        expect(canceledOrder.status()).toBe(200);
        expect(canceledOrder.headers()['content-type']).toContain('application/json');
        const orderBody = await canceledOrder.json();
        expect(orderBody.order.status).toBe('cancelled');
    })

    test('POST /api/orders cancel order as not logged in user', async ({ api }) => {
        const canceledOrder = await api.post(`/api/orders/${orderId}/cancel`);
        expect(canceledOrder.status()).toBe(401);
        expect(canceledOrder.headers()['content-type']).toContain('application/json');
        const orderBody = await canceledOrder.json();
        expect(orderBody).toEqual({ error: 'Please sign in to continue.' });
    })

    test('POST /api/orders cancel order that does not exist', async ({ authApi }) => {
        const canceledOrder = await authApi.post(`/api/orders/0000001/cancel`);
        expect(canceledOrder.status()).toBe(404);
        expect(canceledOrder.headers()['content-type']).toContain('application/json');
        const orderBody = await canceledOrder.json();
        expect(orderBody).toEqual({ error: 'Order not found.' });
    })

    test('POST /api/orders cancel order that was already cancelled', async ({ authApi }) => {
        const canceledOrder = await authApi.post(`/api/orders/${orderId}/cancel`);
        expect(canceledOrder.status()).toBe(409);
        expect(canceledOrder.headers()['content-type']).toContain('application/json');
        const orderBody = await canceledOrder.json();
        expect(orderBody).toEqual({ error: 'This order is cancelled and can no longer be cancelled.' });
    })
});

