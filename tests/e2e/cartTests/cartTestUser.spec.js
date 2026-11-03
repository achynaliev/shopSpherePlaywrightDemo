import { POManager } from '../../page-objects/POManager.js';
import { authenticatedTest } from '../../fixtures/auth.fixture.js';
import { expect } from '@playwright/test';

authenticatedTest.describe('Cart tests for authenticated users', () => {

    // Start every test with an empty account cart
    authenticatedTest.beforeEach(async ({ authenticatedPage2 }) => {
        const poManager = new POManager(authenticatedPage2);
        const cartAndCheckout = poManager.getCartAndCheckoutPages();
        await cartAndCheckout.clearCart();
    });

    authenticatedTest('Add items to the cart | not stored in `localStorage` , survives reload', { tag: ['@p0', '@smoke', '@regression'] },
        async ({ authenticatedPage2 }) => {
            const poManager = new POManager(authenticatedPage2);
            const navBar = poManager.getNavBar();
            const productsListAndFilter = poManager.getProductsAndFilter();
            await authenticatedPage2.goto('/');
            await navBar.searchItem("wireless headphones");
            await productsListAndFilter.addFirstItemToTheCard()
            // Verify cart count
            await navBar.verifyCartCount(1);
            await authenticatedPage2.reload();
            // Verify cart count persists
            await navBar.verifyCartCount(1);
            // Verify cart storage
            const guestCart = await authenticatedPage2.evaluate(() => {
                return JSON.parse(localStorage.getItem('ss_guest_cart') || '[]');
            });
            expect(guestCart).toHaveLength(0);
        });

    authenticatedTest('Add items to the cart and change quantity', { tag: ['@p1', '@regression'] },
        async ({ authenticatedPage2 }) => {
            const poManager = new POManager(authenticatedPage2);
            const navBar = poManager.getNavBar();
            const productsListAndFilter = poManager.getProductsAndFilter();
            const cartAndCheckout = poManager.getCartAndCheckoutPages();
            await authenticatedPage2.goto('/');
            await navBar.searchItem("wireless headphones");
            await productsListAndFilter.addFirstItemToTheCard()
            // Verify cart count
            await navBar.verifyCartCount(1);
            await navBar.goToCartPage();
            await cartAndCheckout.selectQuantity(2);
            await cartAndCheckout.verifySelectedQuantity(2);
            await navBar.verifyCartCount(2);
        });

    authenticatedTest('Add items to the cart and make sure the correct total and tax are displayed', { tag: ['@p0', '@smoke', '@regression'] },
        async ({ authenticatedPage2 }) => {
            const poManager = new POManager(authenticatedPage2);
            const navBar = poManager.getNavBar();
            const productsListAndFilter = poManager.getProductsAndFilter();
            const cartAndCheckout = poManager.getCartAndCheckoutPages();
            await authenticatedPage2.goto('/');
            await navBar.searchItem("wireless headphones");
            await productsListAndFilter.addFirstItemToTheCard()
            // Verify cart count
            await navBar.verifyCartCount(1);
            await navBar.goToCartPage();
            await cartAndCheckout.verifyOrderSummary({
                items: '$179.99',
                shipping: 'FREE',
                tax: '$14.40',
                total: '$194.39'
            });
        });

    authenticatedTest('Add items to the cart, logout and login, the cart is not empty', { tag: ['@p0', '@smoke', '@regression'] },
        async ({ authenticatedPage2 }) => {
            const poManager = new POManager(authenticatedPage2);
            const navBar = poManager.getNavBar();
            const productsListAndFilter = poManager.getProductsAndFilter();
            const authenticationPages = poManager.getAuthenticationPages();
            await authenticatedPage2.goto('/');
            await navBar.searchItem("wireless headphones");
            await productsListAndFilter.addFirstItemToTheCard()
            // Verify cart count
            await navBar.verifyCartCount(1);
            // Logout
            await authenticationPages.signOut();
            await navBar.verifyCartCount(0);
            // Login
            await authenticationPages.goToLoginPage();
            await authenticationPages.login(process.env.REGULAR_USER4, process.env.PASSWORD);
            await navBar.verifyCartCount(1);
        });
});