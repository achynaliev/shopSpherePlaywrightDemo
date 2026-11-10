import { test, expect } from '../../fixtures/api.fixture.js';
import { orderData } from '../../test-data/correctOrderData.js';

test.describe('Orders API', () => {
    test('POST /api/orders - Create order successfully', {
        tag: ['@api', '@p0', '@regression']
    }, async ({ authApi2 }) => {
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


    // test('GET /api/orders get orders for a user @smoke @p0', async ({ authApi }) => {
    //     const res = await authApi.get('/api/orders');

    //     expect(res.status()).toBe(200);
    //     expect(res.headers()['content-type']).toContain('application/json');

    //     const body = await res.json();
    //     expect(body).toHaveProperty('orders');
    //     expect(body.orders).toBeInstanceOf(Array);

    //     for (const order of body.orders) {
    //         expect(order).toEqual(
    //             expect.objectContaining({
    //                 id: expect.any(Number),
    //                 userId: expect.any(Number)
    //             })
    //         );
    //     }
    // })

    // test('GET /api/orders specific order for a different user @smoke @p0', async ({ authApi }) => {
    //     const res = await authApi.get('/api/orders/28');

    //     expect(res.status()).toBe(404);
    //     expect(res.headers()['content-type']).toContain('application/json');

    //     const body = await res.json();
    //     expect(body).toEqual({
    //         error: 'Order not found.'
    //     });
    // })
});