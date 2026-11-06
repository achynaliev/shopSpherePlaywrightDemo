import { test, expect } from '../fixtures/api.fixture.js';

test.describe('Products API', () => {
    test('GET /api/products returns a paginated product list @smoke @p0', async ({ api }) => {
        const res = await api.get('/api/products', { params: { limit: 5 } });

        expect(res.status()).toBe(200);
        expect(res.headers()['content-type']).toContain('application/json');

        const body = await res.json();
        //console.log('Response body:', body);
        expect(body).toMatchObject({ page: 1, limit: 5 });
        expect(body.total).toBeGreaterThan(0);
        expect(body.products.length).toBeGreaterThan(0);
        expect(body.products.length).toBeLessThanOrEqual(5);

        for (const product of body.products) {
            expect(product).toEqual(expect.objectContaining({
                id: expect.any(Number),
                slug: expect.any(String),
                title: expect.any(String),
                price: expect.any(Number),
                stock: expect.any(Number),
            }));
        }
    });

    test('GET /api/products/categories list of categories @smoke @p0', async ({ api }) => {
        const res = await api.get('/api/products/categories');

        expect(res.status()).toBe(200);
        expect(res.headers()['content-type']).toContain('application/json');

        const body = await res.json();
        console.log('Response body:', body);
    });


    test('GET /api/products/categories specific category @smoke @p0', async ({ api }) => {
        const res = await api.get('/api/products?categories=Electronics');

        expect(res.status()).toBe(200);
        expect(res.headers()['content-type']).toContain('application/json');

        const body = await res.json();
        console.log('Response body:', body);
    });
});
