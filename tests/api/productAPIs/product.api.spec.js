import { test, expect } from '../../fixtures/api.fixture.js';

test.describe('Products API for single product page', () => {
    test('GET /api/products/product get a specific product @smoke @p0', async ({ api }) => {
        const res = await api.get('/api/products/auralis-pro-wireless-noise-cancelling-headphones');

        expect(res.status()).toBe(200);
        expect(res.headers()['content-type']).toContain('application/json');

        const body = await res.json();
        const product = body.product;

        // Response structure
        expect(product).toBeDefined();
        expect(product).toBeTruthy();

        // Product identification
        expect(Number.isInteger(product.id)).toBe(true);
        expect(product.id).toBeGreaterThan(0);
        expect(product.slug).toBe('auralis-pro-wireless-noise-cancelling-headphones');
        expect(product.title).toBeTruthy();
        expect(product.brand).toBeTruthy();
        expect(product.category).toBeTruthy();

        // Description and features
        expect(typeof product.description).toBe('string');
        expect(product.description.length).toBeGreaterThan(0);
        expect(Array.isArray(product.features)).toBe(true);
        expect(product.features.length).toBeGreaterThan(0);

        // Pricing
        expect(typeof product.price).toBe('number');
        expect(typeof product.listPrice).toBe('number');
        expect(product.price).toBeGreaterThan(0);
        expect(product.listPrice).toBeGreaterThan(0);
        expect(product.price).toBeLessThanOrEqual(product.listPrice);

        // Inventory
        expect(Number.isInteger(product.stock)).toBe(true);
        expect(product.stock).toBeGreaterThanOrEqual(0);

        // Rating
        expect(product.rating).toBeGreaterThanOrEqual(0);
        expect(product.rating).toBeLessThanOrEqual(5);
        expect(Number.isInteger(product.ratingCount)).toBe(true);
        expect(product.ratingCount).toBeGreaterThanOrEqual(0);

        // Dynamic rating breakdown
        const breakdown = product.ratingBreakdown;
        expect(breakdown).toBeDefined();
        const totalRatings = Object.values(breakdown)
            .reduce((sum, count) => sum + count, 0);
        expect(totalRatings).toBe(product.ratingCount);

        // Rating distribution
        for (let rating = 1; rating <= 5; rating++) {
            expect(breakdown).toHaveProperty(String(rating));
            expect(Number.isInteger(breakdown[rating])).toBe(true);
            expect(breakdown[rating]).toBeGreaterThanOrEqual(0);
        }

        // Dynamically calculate average rating
        if (product.ratingCount > 0) {
            const weightedTotal = Object.entries(breakdown)
                .reduce((sum, [rating, count]) => {
                    return sum + Number(rating) * count;
                }, 0);

            const calculatedRating = weightedTotal / product.ratingCount;
            expect(product.rating).toBeCloseTo(calculatedRating, 1);
        }

        // Other attributes
        expect(typeof product.isFeatured).toBe('boolean');
        expect(
            product.imageUrl === null ||
            typeof product.imageUrl === 'string'
        ).toBe(true);
    });


    test('GET /api/products/:slug/related - should return related products @smoke @p0', async ({ api }) => {

        const slug = 'auralis-pro-wireless-noise-cancelling-headphones';

        const res = await api.get(`/api/products/${slug}/related`);

        expect(res.status()).toBe(200);
        expect(res.headers()['content-type']).toContain('application/json');

        const body = await res.json();
        const products = body.products;

        // Response structure
        expect(Array.isArray(products)).toBe(true);
        expect(products.length).toBeGreaterThan(0);

        // Product validation
        for (const product of products) {
            expect(Number.isInteger(product.id)).toBe(true);
            expect(product.id).toBeGreaterThan(0);

            expect(typeof product.slug).toBe('string');
            expect(product.slug.length).toBeGreaterThan(0);
            expect(product.slug).not.toBe(slug);

            expect(typeof product.title).toBe('string');
            expect(product.title.length).toBeGreaterThan(0);

            expect(typeof product.brand).toBe('string');
            expect(typeof product.category).toBe('string');

            // Pricing
            expect(typeof product.price).toBe('number');
            expect(product.price).toBeGreaterThan(0);

            if (product.listPrice !== null) {
                expect(typeof product.listPrice).toBe('number');
                expect(product.listPrice).toBeGreaterThanOrEqual(product.price);
            }

            // Inventory
            expect(Number.isInteger(product.stock)).toBe(true);
            expect(product.stock).toBeGreaterThanOrEqual(0);

            // Ratings
            expect(product.rating).toBeGreaterThanOrEqual(0);
            expect(product.rating).toBeLessThanOrEqual(5);

            expect(Number.isInteger(product.ratingCount)).toBe(true);
            expect(product.ratingCount).toBeGreaterThanOrEqual(0);

            // Product attributes
            expect(typeof product.isFeatured).toBe('boolean');

            expect(
                product.imageUrl === null ||
                typeof product.imageUrl === 'string'
            ).toBe(true);
        }

        // Unique product IDs
        const productIds = products.map(product => product.id);
        expect(new Set(productIds).size).toBe(productIds.length);

        // Unique product slugs
        const productSlugs = products.map(product => product.slug);
        expect(new Set(productSlugs).size).toBe(productSlugs.length);

    });


    test('GET /api/products/product get reviews for the product @smoke @p0', async ({ api }) => {
        const res = await api.get('/api/products/auralis-pro-wireless-noise-cancelling-headphones/reviews?sort=recent');

        expect(res.status()).toBe(200);
        expect(res.headers()['content-type']).toContain('application/json');

        const body = await res.json();
        const reviews = body.reviews;

        // Response structure
        expect(Array.isArray(reviews)).toBe(true);

        // Review validation
        for (const review of reviews) {

            // Review ID
            expect(Number.isInteger(review.id)).toBe(true);
            expect(review.id).toBeGreaterThan(0);

            // Rating
            expect(Number.isInteger(review.rating)).toBe(true);
            expect(review.rating).toBeGreaterThanOrEqual(1);
            expect(review.rating).toBeLessThanOrEqual(5);

            // Review content
            expect(typeof review.title).toBe('string');
            expect(review.title.trim().length).toBeGreaterThan(0);
            expect(typeof review.body).toBe('string');
            expect(review.body.trim().length).toBeGreaterThan(0);

            // Author
            expect(typeof review.author).toBe('string');
            expect(review.author.trim().length).toBeGreaterThan(0);

            // Boolean attributes
            expect(typeof review.verifiedPurchase).toBe('boolean');
            expect(typeof review.isMine).toBe('boolean');

            // Timestamps
            expect(Number.isNaN(Date.parse(review.createdAt))).toBe(false);
            expect(Number.isNaN(Date.parse(review.updatedAt))).toBe(false);

            expect(
                new Date(review.updatedAt).getTime()
            ).toBeGreaterThanOrEqual(
                new Date(review.createdAt).getTime()
            );
        }

        // Unique review IDs
        const reviewIds = reviews.map(review => review.id);
        expect(new Set(reviewIds).size).toBe(reviewIds.length);

        // Reviews sorted newest first
        const timestamps = reviews.map(review =>
            new Date(review.createdAt).getTime()
        );

        for (let i = 1; i < timestamps.length; i++) {
            expect(timestamps[i]).toBeLessThanOrEqual(timestamps[i - 1]);
        }
    });
});