import { POManager } from '../../page-objects/POManager.js';
import { authenticatedTest } from '../../fixtures/auth.fixture.js';
import { expect } from '@playwright/test';

authenticatedTest.describe('Checkout tests', () => {

    authenticatedTest('Going to checkout page with no items in cart takes to cart page', { tag: ['@p1', '@regression'] },
        async ({ authenticatedPage }) => {
            const poManager = new POManager(authenticatedPage);
            const navBar = poManager.getNavBar();
            await authenticatedPage.goto('/');
            await navBar.verifyCartCount(0);

            await authenticatedPage.goto('/checkout');
            await expect(authenticatedPage).toHaveURL(/.*\/cart/);
        });

    authenticatedTest('Defaults | Full name and name-on-card prefilled with user name; country "United States"; heading "Checkout (N items)"', { tag: ['@p1', '@regression'] },
        async ({ authenticatedPage }) => {
            const poManager = new POManager(authenticatedPage);
            const navBar = poManager.getNavBar();
            const cartAndCheckoutPages = poManager.getCartAndCheckoutPages()
            const productsListAndFilter = poManager.getProductsAndFilter();
            await authenticatedPage.goto('/');
            await navBar.searchItem("wireless headphones");
            await productsListAndFilter.addFirstItemToTheCard()
            // Verify cart count
            await navBar.verifyCartCount(1);
            await navBar.goToCartPage();
            await cartAndCheckoutPages.checkout()
            await expect(
                authenticatedPage.getByRole('textbox', { name: 'Full name' })
            ).toHaveValue('Atai Chynaliev');

            await expect(
                authenticatedPage.getByRole('textbox', { name: 'Country' })
            ).toHaveValue('United States');
            await authenticatedPage.pause();
        });
});