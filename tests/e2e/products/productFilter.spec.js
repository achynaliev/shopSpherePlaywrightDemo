import { POManager } from '../../page-objects/POManager.js';
import { authenticatedTest } from '../../fixtures/auth.fixture.js';
import { expect } from '@playwright/test';

authenticatedTest.describe('Product Filter tests', () => {

    authenticatedTest('Filter by department works correctly', async ({ authenticatedPage }) => {
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
        await expect(productsListAndFilter.productCard).toHaveAttribute(
            'data-category',
            'Electronics'
        );
    });

    authenticatedTest('Filter by customer rating works correctly', async ({ authenticatedPage }) => {
        const poManager = new POManager(authenticatedPage);
        const productsListAndFilter = poManager.getProductsAndFilter();
        await authenticatedPage.goto('/search');
    });

    authenticatedTest('Filter by price works correctly', async ({ authenticatedPage }) => {
        const poManager = new POManager(authenticatedPage);
        const productsListAndFilter = poManager.getProductsAndFilter();
        await authenticatedPage.goto('/search');
    });

    authenticatedTest('Filter by Availability works correctly', async ({ authenticatedPage }) => {
        const poManager = new POManager(authenticatedPage);
        const productsListAndFilter = poManager.getProductsAndFilter();
        await authenticatedPage.goto('/search');
    });


});