import { POManager } from '../../page-objects/POManager.js';
import { authenticatedTest } from '../../fixtures/auth.fixture.js';
import { expect } from '@playwright/test';

authenticatedTest.describe('Product list and Filter tests', () => {

    authenticatedTest('Home page product catalog loads successfully', async ({ authenticatedPage }) => {
        const poManager = new POManager(authenticatedPage);
        const navBar = poManager.getNavBar();
        const productsListAndFilter = poManager.getProductsAndFilter();
        await authenticatedPage.goto('/');

        // Verify header navigation
        await expect(navBar.headerSub).toBeVisible();
        await expect(navBar.headerSubLinks).toHaveCount(10);

        await expect(authenticatedPage.getByRole('link', { name: 'Shop today\'s deals' })).toBeVisible();
        await expect(authenticatedPage.getByRole('link', { name: 'Browse everything' })).toBeVisible();
        // category cards are visible and have the expected text
        const expectedCategories = [
            'Beauty & Personal Care',
            'Books',
            'Electronics',
            'Fashion',
            'Home & Kitchen',
            'Sports & Outdoors',
            'Toys & Games'
        ];

        const categories = authenticatedPage.locator('.category-grid .category-name');
        await expect(categories).toHaveCount(expectedCategories.length);
        await expect(categories).toHaveText(expectedCategories);

        // Verify both sections exist
        await expect(productsListAndFilter.shelves).toHaveCount(2);

        // Verify New Arrivals section
        await expect(productsListAndFilter.newArrivalsShelf).toBeVisible();
        await expect(productsListAndFilter.newArrivalsShelf.locator('.shelf-item').first()).toBeVisible();
        await expect(productsListAndFilter.newArrivalsShelf.locator('.shelf-item').count()).resolves.toBeGreaterThan(0);

        // Verify Top Rated section
        await expect(productsListAndFilter.topRatedShelf).toBeVisible();
        await expect(productsListAndFilter.topRatedShelf.locator('.shelf-item').first()).toBeVisible();
        await expect(productsListAndFilter.topRatedShelf.locator('.shelf-item').count()).resolves.toBeGreaterThan(0);

        // Verify Today's Featured Deals section
        await expect(productsListAndFilter.featuredDealsSection).toBeVisible();
        await expect(productsListAndFilter.featuredDealCards.first()).toBeVisible();
        await expect(productsListAndFilter.featuredDealCards).not.toHaveCount(0);
    });

    authenticatedTest('All Product cards display correctly', async ({ authenticatedPage }) => {
        const poManager = new POManager(authenticatedPage);
        const productsListAndFilter = poManager.getProductsAndFilter();
        await authenticatedPage.goto('/search');

        await expect(productsListAndFilter.resultsHeading).toBeVisible();
        await expect(productsListAndFilter.productGrid).toBeVisible();
        await expect(productsListAndFilter.productCard.first()).toBeVisible();
        await expect(productsListAndFilter.productCard).not.toHaveCount(0);
    });

    authenticatedTest('Pagination controls are visible and enabled and work', async ({ authenticatedPage }) => {
        const poManager = new POManager(authenticatedPage);
        const productsListAndFilter = poManager.getProductsAndFilter();
        await authenticatedPage.goto('/search');

        await expect(productsListAndFilter.productGrid).toBeVisible();
        await expect(productsListAndFilter.productCard).not.toHaveCount(0);

        // Verify pagination controls
        await expect(productsListAndFilter.nextPageButton).toBeVisible();
        await expect(productsListAndFilter.nextPageButton).toBeEnabled();
        await expect(productsListAndFilter.previousPageButton).toBeVisible();
        await expect(productsListAndFilter.previousPageButton).toBeDisabled();

        await expect(productsListAndFilter.activePageButton).toBeVisible();
        await expect(productsListAndFilter.activePageButton).toHaveText('1');

        await productsListAndFilter.nextPageButton.click();
        await expect(productsListAndFilter.activePageButton).toHaveText('2');
        await expect(productsListAndFilter.previousPageButton).toBeEnabled();
        const page1Loaded = authenticatedPage.waitForResponse(
            (res) => res.url().includes('/api/products') && res.url().includes('page=1')
        );
        await productsListAndFilter.previousPageButton.click();
        await page1Loaded;

        await expect(productsListAndFilter.activePageButton).toHaveText('2');
        await expect(productsListAndFilter.previousPageButton).toBeDisabled();
    });
});