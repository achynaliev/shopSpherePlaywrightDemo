import { POManager } from '../../page-objects/POManager.js';
import { authenticatedTest } from '../../fixtures/auth.fixture.js';
import { expect } from '@playwright/test';

authenticatedTest.describe('Checkout tests', () => {

    authenticatedTest.afterEach(async ({ authenticatedPage }) => {
        const poManager = new POManager(authenticatedPage);
        const cartAndCheckout = poManager.getCartAndCheckoutPages();
        await cartAndCheckout.clearCart();
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
        });

    authenticatedTest('Data persistence after one order, delivery information, no card information saved', { tag: ['@p1', '@regression'] },
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

            await cartAndCheckoutPages.fillShippingAddress('1234 lala street', 'San Mateo', 'California', '94403', '6504343442')
            await cartAndCheckoutPages.fillCardInformation('4242424242424242', '1230', '234')
            await cartAndCheckoutPages.placeOrder()
            await expect(authenticatedPage.getByRole('heading', { name: '✅ Order placed, thank you!' })).toBeVisible()
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

            await expect(cartAndCheckoutPages.streetAddressInput).toHaveValue('1234 lala street')
            await expect(cartAndCheckoutPages.cityInput).toHaveValue('San Mateo')
            await expect(cartAndCheckoutPages.stateInput).toHaveValue('California')
            await expect(cartAndCheckoutPages.zipCodeInput).toHaveValue('94403')
            await expect(cartAndCheckoutPages.phoneInput).toHaveValue('6504343442')
            await expect(cartAndCheckoutPages.cardNumber).toHaveValue('')
            await expect(cartAndCheckoutPages.cardExpiry).toHaveValue('')
            await expect(cartAndCheckoutPages.cvc).toHaveValue('')
            await expect(cartAndCheckoutPages.cardName).toHaveValue('Atai Chynaliev')
        });
});

authenticatedTest('Going to checkout page with no items in cart takes to cart page', { tag: ['@p1', '@regression'] },
    async ({ authenticatedPage }) => {
        const poManager = new POManager(authenticatedPage);
        const navBar = poManager.getNavBar();
        await authenticatedPage.goto('/');
        await navBar.verifyCartCount(0);

        await authenticatedPage.goto('/checkout');
        await expect(authenticatedPage).toHaveURL(/.*\/cart/);
    });