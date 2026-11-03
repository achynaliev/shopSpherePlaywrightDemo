import { POManager } from '../../page-objects/POManager.js';
import { authenticatedTest } from '../../fixtures/auth.fixture.js';
import { expect } from '@playwright/test';

authenticatedTest.describe('Product Search tests', () => {

    authenticatedTest('Product search functionality works correctly', { tag: ['@p0', '@smoke', '@regression'] },
        async ({ authenticatedPage }) => {
            const poManager = new POManager(authenticatedPage);
            const navBar = poManager.getNavBar();
            const productsListAndFilter = poManager.getProductsAndFilter();
            await authenticatedPage.goto('/');
            await navBar.searchItem("headphones");
            await expect(productsListAndFilter.resultsSection).toBeVisible();
            await expect(productsListAndFilter.resultsHeading).toBeVisible();
            await expect(productsListAndFilter.productGrid).toBeVisible();
            await expect(productsListAndFilter.productCard.first()).toBeVisible();
            await expect(productsListAndFilter.productCard).not.toHaveCount(0);
            await expect(productsListAndFilter.productCardTitle.first()).toContainText(/headphones/i);
        });

    authenticatedTest('Product search with no results', { tag: ['@p1', '@regression'] },
        async ({ authenticatedPage }) => {
            const poManager = new POManager(authenticatedPage);
            const productsListAndFilter = poManager.getProductsAndFilter();
            const navBar = poManager.getNavBar();
            await navBar.searchItem("paracetamol");

            await expect(productsListAndFilter.resultsSection).toBeVisible();
            await expect(productsListAndFilter.resultsHeading).toBeVisible();
            await expect(productsListAndFilter.emptyState).toBeVisible();
            await expect(productsListAndFilter.emptyStateHeading).toBeVisible();
            await expect(productsListAndFilter.browseAllProductsLink).toBeVisible();
            await expect(productsListAndFilter.emptyStateHeading).toHaveText('No results found');
        });

    authenticatedTest('Product search functionality works correctly with category', { tag: ['@p1', '@regression'] },
        async ({ authenticatedPage }) => {
            const poManager = new POManager(authenticatedPage);
            const navBar = poManager.getNavBar();
            const productsListAndFilter = poManager.getProductsAndFilter();
            await authenticatedPage.goto('/');

            // select the right category from dropdown and search for an item
            await expect(navBar.categoryDropdown).toBeVisible();
            await expect(navBar.categoryDropdown.locator('option')).toHaveCount(8);
            await navBar.categoryDropdown.selectOption('Electronics');
            await expect(navBar.categoryDropdown).toHaveValue('Electronics');
            await navBar.searchItem("headphones");
            await expect(productsListAndFilter.resultsSection).toBeVisible();
            await expect(productsListAndFilter.resultsHeading).toBeVisible();
            await expect(productsListAndFilter.productGrid).toBeVisible();
            await expect(productsListAndFilter.productCard.first()).toBeVisible();
            await expect(productsListAndFilter.productCard).not.toHaveCount(0);
            await expect(productsListAndFilter.productCardTitle.first()).toContainText(/headphones/i);

            // Now search for the same item in a different category and verify that no results are found
            await navBar.categoryDropdown.selectOption('Fashion');
            await expect(navBar.categoryDropdown).toHaveValue('Fashion');
            await navBar.searchItem("headphones");
            await expect(productsListAndFilter.resultsSection).toBeVisible();
            await expect(productsListAndFilter.resultsHeading).toBeVisible();
            await expect(productsListAndFilter.emptyState).toBeVisible();
            await expect(productsListAndFilter.emptyStateHeading).toBeVisible();
            await expect(productsListAndFilter.browseAllProductsLink).toBeVisible();
            await expect(productsListAndFilter.emptyStateHeading).toHaveText('No results found');
        });
});