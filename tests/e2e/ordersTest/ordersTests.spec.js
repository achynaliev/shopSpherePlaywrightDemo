import { POManager } from '../../page-objects/POManager.js';
import { authenticatedTest } from '../../fixtures/auth.fixture.js';
import { expect } from '@playwright/test';

authenticatedTest.describe('Orders tests', () => {

    authenticatedTest('Empty orders page shows correctly', { tag: ['@p1', '@regression'] },
        async ({ authenticatedPage3 }) => {
            const poManager = new POManager(authenticatedPage3);
            const navBar = poManager.getNavBar();
            await navBar.goToOrdersPage();
            await expect(authenticatedPage3.getByText('You haven\'t placed any orders')).toBeVisible();
            await expect(authenticatedPage3.getByRole('link', { name: 'Start shopping' })).toBeVisible();
        });
});
