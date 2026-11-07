import { test, expect } from '../../fixtures/api.fixture.js';

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
        // Validate response structure
        expect(body).toHaveProperty('categories');
        expect(Array.isArray(body.categories)).toBeTruthy();

        // Validate category count
        expect(body.categories).toHaveLength(7);

        // Validate category names and product counts
        expect(body.categories).toEqual([
            { name: 'Beauty & Personal Care', count: 3 },
            { name: 'Books', count: 4 },
            { name: 'Electronics', count: 7 },
            { name: 'Fashion', count: 4 },
            { name: 'Home & Kitchen', count: 6 },
            { name: 'Sports & Outdoors', count: 4 },
            { name: 'Toys & Games', count: 2 }
        ]);

        // Validate data types and values
        for (const category of body.categories) {
            expect(typeof category.name).toBe('string');
            expect(category.name.length).toBeGreaterThan(0);

            expect(typeof category.count).toBe('number');
            expect(category.count).toBeGreaterThanOrEqual(0);
        }

        // Validate total number of products
        const totalProducts = body.categories.reduce(
            (sum, category) => sum + category.count, 0
        );

        expect(totalProducts).toBe(30);
    });


    test('GET /api/products/categories specific category @smoke @p0', async ({ api }) => {
        const res = await api.get('/api/products?categories=Electronics');

        expect(res.status()).toBe(200);
        expect(res.headers()['content-type']).toContain('application/json');

        const body = await res.json();
        // Response structure
        expect(body).toHaveProperty('products');
        expect(Array.isArray(body.products)).toBeTruthy();

        // Pagination
        expect(body.page).toBe(1);
        expect(body.limit).toBe(12);
        expect(body.total).toBe(30);
        expect(body.totalPages).toBe(3);

        expect(body.products).toHaveLength(12);

        // Product data validation
        for (const product of body.products) {
            expect(product.id).toEqual(expect.any(Number));
            expect(product.slug).toEqual(expect.any(String));
            expect(product.title).toEqual(expect.any(String));
            expect(product.brand).toEqual(expect.any(String));
            expect(product.category).toEqual(expect.any(String));
            expect(product.description).toEqual(expect.any(String));

            expect(product.price).toEqual(expect.any(Number));
            expect(product.price).toBeGreaterThan(0);

            expect(product.stock).toEqual(expect.any(Number));
            expect(product.stock).toBeGreaterThanOrEqual(0);

            expect(product.rating).toEqual(expect.any(Number));
            expect(product.rating).toBeGreaterThanOrEqual(0);
            expect(product.rating).toBeLessThanOrEqual(5);

            expect(product.ratingCount).toEqual(expect.any(Number));
            expect(product.isFeatured).toEqual(expect.any(Boolean));

            expect(product).toHaveProperty('features');
            expect(Array.isArray(product.features)).toBeTruthy();

            expect(product).toHaveProperty('imageUrl');
            expect(product).toHaveProperty('listPrice');
        }

        // Unique product IDs and slugs
        const ids = body.products.map(p => p.id);
        const slugs = body.products.map(p => p.slug);

        expect(new Set(ids).size).toBe(ids.length);
        expect(new Set(slugs).size).toBe(slugs.length);
    });

    test('GET /api/products/categories featured products @smoke @p0', async ({ api }) => {
        const res = await api.get('/api/products?featured=true&limit=8');

        expect(res.status()).toBe(200);
        expect(res.headers()['content-type']).toContain('application/json');

        const body = await res.json();
        // Response structure
        expect(body).toHaveProperty('products');
        expect(body.products).toBeInstanceOf(Array);

        // Pagination
        expect(body.page).toBe(1);
        expect(body.limit).toBe(8);
        expect(body.total).toBe(8);
        expect(body.totalPages).toBe(1);
        expect(body.products).toHaveLength(8);

        // Product schema
        for (const product of body.products) {
            expect(product).toEqual(expect.objectContaining({
                id: expect.any(Number),
                slug: expect.any(String),
                title: expect.any(String),
                brand: expect.any(String),
                category: expect.any(String),
                price: expect.any(Number),
                stock: expect.any(Number),
                rating: expect.any(Number),
                ratingCount: expect.any(Number),
                isFeatured: expect.any(Boolean)
            }));

            expect(product.price).toBeGreaterThan(0);
            expect(product.stock).toBeGreaterThanOrEqual(0);
            expect(product.rating).toBeGreaterThanOrEqual(0);
            expect(product.rating).toBeLessThanOrEqual(5);
        }
    });

    test('GET /api/products/categories get newest products @smoke @p0', async ({ api }) => {
        const res = await api.get('/api/products?sort=newest&limit=8');

        expect(res.status()).toBe(200);
        expect(res.headers()['content-type']).toContain('application/json');

        const body = await res.json();
        // Response structure
        expect(body).toHaveProperty('products');
        expect(body.products).toBeInstanceOf(Array);

        // Pagination
        expect(body.page).toBe(1);
        expect(body.limit).toBe(8);
        expect(body.total).toBe(30);
        expect(body.totalPages).toBe(4);
        expect(body.products).toHaveLength(8);

        // Product schema
        for (const product of body.products) {
            expect(product).toEqual(expect.objectContaining({
                id: expect.any(Number),
                slug: expect.any(String),
                title: expect.any(String),
                brand: expect.any(String),
                category: expect.any(String),
                price: expect.any(Number),
                stock: expect.any(Number),
                rating: expect.any(Number),
                ratingCount: expect.any(Number),
                isFeatured: expect.any(Boolean)
            }));

            expect(product.price).toBeGreaterThan(0);
            expect(product.stock).toBeGreaterThanOrEqual(0);
            expect(product.rating).toBeGreaterThanOrEqual(0);
            expect(product.rating).toBeLessThanOrEqual(5);
        }
    });

    test('GET /api/products/categories get by sorted ratings products @smoke @p0', async ({ api }) => {
        const res = await api.get('/api/products?sort=rating&limit=8');

        expect(res.status()).toBe(200);
        expect(res.headers()['content-type']).toContain('application/json');

        const body = await res.json();
        // Response structure
        expect(body).toHaveProperty('products');
        expect(body.products).toBeInstanceOf(Array);

        // Pagination
        expect(body.page).toBe(1);
        expect(body.limit).toBe(8);
        expect(body.total).toBe(30);
        expect(body.totalPages).toBe(4);
        expect(body.products).toHaveLength(8);

        // Product schema
        for (const product of body.products) {
            expect(product).toEqual(expect.objectContaining({
                id: expect.any(Number),
                slug: expect.any(String),
                title: expect.any(String),
                brand: expect.any(String),
                category: expect.any(String),
                price: expect.any(Number),
                stock: expect.any(Number),
                rating: expect.any(Number),
                ratingCount: expect.any(Number),
                isFeatured: expect.any(Boolean)
            }));

            expect(product.price).toBeGreaterThan(0);
            expect(product.stock).toBeGreaterThanOrEqual(0);
            expect(product.rating).toBeGreaterThanOrEqual(0);
            expect(product.rating).toBeLessThanOrEqual(5);
        }
    });
});
