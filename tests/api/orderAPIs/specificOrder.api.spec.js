import { test, expect } from '../../fixtures/api.fixture.js';
import { addToCartData } from '../../test-data/cartData.js';
import { orderData } from '../../test-data/correctOrderData.js'
import { cancelPlacedOrders } from '../../fixtures/orderCleanup.js'

const NON_EXISTENT_ORDER_ID = 999999999;

async function placeOrder(client) {
    const add = await client.post('/api/cart', { data: addToCartData });
    expect(add.status(), `setup: add to cart failed: ${await add.text()}`).toBe(201);
    const res = await client.post('/api/orders', { data: orderData });
    expect(res.status(), `setup: create order failed: ${await res.text()}`).toBe(201);
    return (await res.json()).order;
}

test.describe('Orders API', () => {
    test.beforeEach(async ({ authApi }) => { await authApi.delete('/api/cart'); });
    test.afterEach(async ({ authApi }) => {
        await authApi.delete('/api/cart');
        await cancelPlacedOrders(authApi); // restocks whatever the test ordered
    });

    test('POST /api/orders create order and get that order', async ({ authApi }) => {
        const order = await placeOrder(authApi);

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

        const orderRes = await authApi.get(`/api/orders/${order.id}`);
        expect(orderRes.status()).toBe(200);
        expect(orderRes.headers()['content-type']).toContain('application/json');
        const orderBody = await orderRes.json();
        const newOrder = orderBody.order;

        // Order details
        expect(newOrder.id).toBe(order.id);
        expect(newOrder.orderNumber).toBe(order.orderNumber);
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
        const order = await placeOrder(authApi);

        const canceledOrder = await authApi.post(`/api/orders/${order.id}/cancel`);
        expect(canceledOrder.status()).toBe(200);
        expect(canceledOrder.headers()['content-type']).toContain('application/json');
        const orderBody = await canceledOrder.json();
        expect(orderBody.order.id).toBe(order.id);
        expect(orderBody.order.status).toBe('cancelled');
    })

    test('POST /api/orders cancel order as not logged in user', async ({ authApi, api }) => {
        const order = await placeOrder(authApi);

        const canceledOrder = await api.post(`/api/orders/${order.id}/cancel`);
        expect(canceledOrder.status()).toBe(401);
        expect(canceledOrder.headers()['content-type']).toContain('application/json');
        const orderBody = await canceledOrder.json();
        expect(orderBody).toEqual({ error: 'Please sign in to continue.' });

        // The rejected request must not have cancelled it
        const stillPlaced = await authApi.get(`/api/orders/${order.id}`);
        expect((await stillPlaced.json()).order.status).toBe('placed');
    })

    test('POST /api/orders cancel order that does not exist', async ({ authApi }) => {
        const canceledOrder = await authApi.post(`/api/orders/${NON_EXISTENT_ORDER_ID}/cancel`);
        expect(canceledOrder.status()).toBe(404);
        expect(canceledOrder.headers()['content-type']).toContain('application/json');
        const orderBody = await canceledOrder.json();
        expect(orderBody).toEqual({ error: 'Order not found.' });
    })

    test('POST /api/orders cancel order that was already cancelled', async ({ authApi }) => {
        const order = await placeOrder(authApi);
        const first = await authApi.post(`/api/orders/${order.id}/cancel`);
        expect(first.status(), 'setup: first cancel should succeed').toBe(200);

        const canceledOrder = await authApi.post(`/api/orders/${order.id}/cancel`);
        expect(canceledOrder.status()).toBe(409);
        expect(canceledOrder.headers()['content-type']).toContain('application/json');
        const orderBody = await canceledOrder.json();
        expect(orderBody).toEqual({ error: 'This order is cancelled and can no longer be cancelled.' });
    })
});
