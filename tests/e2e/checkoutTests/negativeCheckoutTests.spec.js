import { POManager } from '../../page-objects/POManager.js';
import { authenticatedTest } from '../../fixtures/auth.fixture.js';
import { expect } from '@playwright/test';

authenticatedTest.describe('Checkout tests', () => {

    authenticatedTest.afterEach(async ({ authenticatedPage3 }) => {
        const poManager = new POManager(authenticatedPage3);
        const cartAndCheckout = poManager.getCartAndCheckoutPages();
        await cartAndCheckout.clearCart();
    });

    authenticatedTest('Card gets declined test', { tag: ['@p1', '@regression'] },
        async ({ authenticatedPage3 }) => {
            const poManager = new POManager(authenticatedPage3);
            const navBar = poManager.getNavBar();
            const cartAndCheckoutPages = poManager.getCartAndCheckoutPages()
            const productsListAndFilter = poManager.getProductsAndFilter();
            await authenticatedPage3.goto('/');
            await navBar.searchItem("wireless headphones");
            await productsListAndFilter.addFirstItemToTheCard()
            // Verify cart count
            await navBar.verifyCartCount(1);
            await navBar.goToCartPage();
            await cartAndCheckoutPages.checkout()
            await expect(
                authenticatedPage3.getByRole('textbox', { name: 'Full name' })
            ).toHaveValue('Atai Chynaliev');

            await expect(
                authenticatedPage3.getByRole('textbox', { name: 'Country' })
            ).toHaveValue('United States');

            await cartAndCheckoutPages.fillShippingAddress('1234 lala street', 'San Mateo', 'California', '94403', '6504343442')
            await cartAndCheckoutPages.fillCardInformation('4000000000000002', '1230', '234')
            await cartAndCheckoutPages.placeOrder()
            await expect(authenticatedPage3.getByText('Your card was declined. Try a different card.')).toBeVisible()
        });

    authenticatedTest('Cannot checkout when missing information', { tag: ['@p1', '@regression'] },
        async ({ authenticatedPage3 }) => {
            const poManager = new POManager(authenticatedPage3);
            const navBar = poManager.getNavBar();
            const cartAndCheckoutPages = poManager.getCartAndCheckoutPages()
            const productsListAndFilter = poManager.getProductsAndFilter();
            await authenticatedPage3.goto('/');
            await navBar.searchItem("wireless headphones");
            await productsListAndFilter.addFirstItemToTheCard()
            // Verify cart count
            await navBar.verifyCartCount(1);
            await navBar.goToCartPage();
            await cartAndCheckoutPages.checkout()
            await expect(
                authenticatedPage3.getByRole('textbox', { name: 'Full name' })
            ).toHaveValue('Atai Chynaliev');

            await expect(
                authenticatedPage3.getByRole('textbox', { name: 'Country' })
            ).toHaveValue('United States');
            await cartAndCheckoutPages.fillShippingAddress('1234 lala street', 'San Mateo', 'California', '', '')
            await cartAndCheckoutPages.fillCardInformation('4000000000000002', '1230', '234')
            await cartAndCheckoutPages.placeOrder()
            const zipInput = authenticatedPage3.getByRole('textbox', { name: 'ZIP / Postal code' });

            const message = await zipInput.evaluate((el) => el.validationMessage);
            console.log('Validation message:', message);
            expect(message).toBe('Please fill out this field.');
        });

    authenticatedTest('Cannot checkout without security code information', { tag: ['@p1', '@regression'] },
        async ({ authenticatedPage3 }) => {
            const poManager = new POManager(authenticatedPage3);
            const navBar = poManager.getNavBar();
            const cartAndCheckoutPages = poManager.getCartAndCheckoutPages()
            const productsListAndFilter = poManager.getProductsAndFilter();
            await authenticatedPage3.goto('/');
            await navBar.searchItem("wireless headphones");
            await productsListAndFilter.addFirstItemToTheCard()
            // Verify cart count
            await navBar.verifyCartCount(1);
            await navBar.goToCartPage();
            await cartAndCheckoutPages.checkout()
            await expect(
                authenticatedPage3.getByRole('textbox', { name: 'Full name' })
            ).toHaveValue('Atai Chynaliev');

            await expect(
                authenticatedPage3.getByRole('textbox', { name: 'Country' })
            ).toHaveValue('United States');
            await cartAndCheckoutPages.fillShippingAddress('1234 lala street', 'San Mateo', 'California', '94403', '')
            await cartAndCheckoutPages.fillCardInformation('4000000000000002', '1230', '')
            await cartAndCheckoutPages.placeOrder()
            const cvc = cartAndCheckoutPages.cvc;

            const message = await cvc.evaluate((el) => el.validationMessage);
            console.log('Validation message:', message);
            expect(message).toBe('Please fill out this field.');
        });
});