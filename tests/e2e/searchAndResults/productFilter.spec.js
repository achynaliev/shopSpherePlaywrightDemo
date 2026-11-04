import { POManager } from '../../page-objects/POManager.js';
import { authenticatedTest } from '../../fixtures/auth.fixture.js';
import { expect } from '@playwright/test';

authenticatedTest.describe('Product Filter tests', () => {

    authenticatedTest('Filter by department works correctly', { tag: ['@p0', '@smoke', '@regression'] },
        async ({ authenticatedPage }) => {
            const poManager = new POManager(authenticatedPage);
            const productsListAndFilter = poManager.getProductsAndFilter();
            await authenticatedPage.goto('/search');
            await expect(productsListAndFilter.departmentFilter).toBeVisible();
            await expect(productsListAndFilter.departmentOptions).toHaveCount(8);
            await expect(productsListAndFilter.activeDepartment).toHaveText('Any department');

            await productsListAndFilter.departmentFilter
                .getByRole('button', { name: /Electronics/ })
                .click();
            await expect(productsListAndFilter.activeDepartment).toContainText('Electronics');
            await expect(productsListAndFilter.productCard.first()).toBeVisible();
            // Results load after the filter is marked active, so retry until the unfiltered cards are replaced.
            await expect.poll(async () => {
                const categories = await productsListAndFilter.productCard.evaluateAll(
                    cards => cards.map(card => card.getAttribute('data-category'))
                );
                return categories.length > 0 && categories.every(category => category === 'Electronics');
            }).toBe(true);
        });

    authenticatedTest('Filter by customer rating works correctly', { tag: ['@p1', '@regression'] },
        async ({ authenticatedPage }) => {
            const poManager = new POManager(authenticatedPage);
            const productsListAndFilter = poManager.getProductsAndFilter();
            await authenticatedPage.goto('/search');
            await expect(productsListAndFilter.customerReviewsFilter).toBeVisible();
            await expect(productsListAndFilter.customerReviewOptions).toHaveCount(3);

            await productsListAndFilter.customerReviewsFilter
                .getByRole('button', { name: /4\.0 out of 5 stars/ })
                .click();
            await expect(authenticatedPage).toHaveURL(/minRating=4/);
            await expect(productsListAndFilter.productCard.first()).toBeVisible();

            // Results load after the URL changes, so retry until the unfiltered cards are replaced.
            await expect.poll(async () => {
                const labels = await productsListAndFilter.productRatings.evaluateAll(
                    (els) => els.map((el) => el.getAttribute('aria-label'))
                );
                return labels.length > 0 && labels.every((label) => Number.parseFloat(label) >= 4);
            }).toBe(true);
        });

    authenticatedTest('Filter by price works correctly', { tag: ['@p0', '@smoke', '@regression'] },
        async ({ authenticatedPage }) => {
            const poManager = new POManager(authenticatedPage);
            const productsListAndFilter = poManager.getProductsAndFilter();
            await authenticatedPage.goto('/search');
            await expect(productsListAndFilter.priceFilter).toBeVisible();
            await productsListAndFilter.priceFilter
                .getByRole('button', { name: '$25 to $50' })
                .click();
            await expect(productsListAndFilter.activePriceOption)
                .toHaveText('$25 to $50');
            await expect.poll(async () => {
                const prices = await productsListAndFilter.productPrices.evaluateAll(elements =>
                    elements.map(element => {
                        const [dollars, cents] = Array.from(element.querySelectorAll('sup'))
                            .map(node => node.textContent.trim());
                        const wholeDollars = element.childNodes[1].textContent.trim();
                        return Number(`${wholeDollars}.${cents}`);
                    })
                );
                return prices.length > 0 &&
                    prices.every(price => price >= 25 && price <= 50);
            }).toBe(true);
        });

    authenticatedTest('Filter by in-stock availability works correctly', { tag: ['@p1', '@regression'] },
        async ({ authenticatedPage }) => {
            const poManager = new POManager(authenticatedPage);
            const productsListAndFilter = poManager.getProductsAndFilter();
            await authenticatedPage.goto('/search');

            await expect(productsListAndFilter.availabilityFilter).toBeVisible();
            await expect(productsListAndFilter.inStockCheckbox).not.toBeChecked();
            await productsListAndFilter.inStockCheckbox.click();
            await expect(productsListAndFilter.inStockCheckbox).toBeChecked();
            await expect.poll(async () => {
                return await productsListAndFilter.productCard.evaluateAll(cards =>
                    cards.every(card =>
                        !card.textContent.includes('Currently unavailable')
                    )
                );
            }).toBe(true);
        });

    authenticatedTest('Filter by deals works correctly', { tag: ['@p0', '@smoke', '@regression'] },
        async ({ authenticatedPage }) => {
            const poManager = new POManager(authenticatedPage);
            const productsListAndFilter = poManager.getProductsAndFilter();
            await authenticatedPage.goto('/search');
            await expect(productsListAndFilter.dealsOnlyCheckbox).not.toBeChecked();
            await productsListAndFilter.dealsOnlyCheckbox.click();
            await expect(productsListAndFilter.dealsOnlyCheckbox).toBeChecked();
            await expect(productsListAndFilter.productCard.first()).toBeVisible();

            const productCards = productsListAndFilter.productCard;

            // Every product must have a discount badge, current price and list price.
            await expect(productCards.locator('.price-discount')).toHaveCount(
                await productCards.count()
            );
            await expect(productCards.locator('.price-now')).toHaveCount(
                await productCards.count()
            );
            await expect(productCards.locator('.price-list')).toHaveCount(
                await productCards.count()
            );

            // Verify the original list price is greater than the current price.
            const prices = await productCards.evaluateAll(cards =>
                cards.map(card => {
                    const currentPrice = card.querySelector('.price-now');
                    const listPrice = card.querySelector('.price-list s');

                    const extractPrice = element => {
                        const wholeDollars = element.childNodes[1].textContent.trim();
                        const cents = element.querySelector('sup:last-child').textContent.trim();

                        return Number(`${wholeDollars}.${cents}`);
                    };

                    return {
                        current: extractPrice(currentPrice),
                        list: Number(listPrice.textContent.replace(/[^0-9.]/g, ''))
                    };
                })
            );

            expect(prices.length).toBeGreaterThan(0);
            for (const price of prices) {
                expect(price.list).toBeGreaterThan(price.current);
            }
        });

    authenticatedTest('Clearing all filters works correctly', { tag: ['@p0', '@smoke', '@regression'] },
        async ({ authenticatedPage }) => {
            const poManager = new POManager(authenticatedPage);
            const productsListAndFilter = poManager.getProductsAndFilter();
            await authenticatedPage.goto('/search');
            await expect(productsListAndFilter.departmentFilter).toBeVisible();
            await expect(productsListAndFilter.departmentOptions).toHaveCount(8);
            await expect(productsListAndFilter.activeDepartment).toHaveText('Any department');

            await productsListAndFilter.departmentFilter
                .getByRole('button', { name: /Electronics/ })
                .click();
            await expect(productsListAndFilter.activeDepartment).toContainText('Electronics');
            await expect(productsListAndFilter.productCard.first()).toBeVisible();
            await expect(productsListAndFilter.productCard).not.toHaveCount(0);

            await expect(authenticatedPage).toHaveURL(/\/search\?category=Electronics$/);

            await productsListAndFilter.clearAllFiltersButton.click();
            await expect(productsListAndFilter.activeDepartment).toHaveText('Any department');
            await expect(productsListAndFilter.productCard.first()).toBeVisible();
            await expect(productsListAndFilter.productCard).not.toHaveCount(0);
            await expect(authenticatedPage).toHaveURL(/\/search$/);
        });
});