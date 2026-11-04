import { POManager } from '../../page-objects/POManager.js';
import { authenticatedTest } from '../../fixtures/auth.fixture.js';
import { expect } from '@playwright/test';

authenticatedTest('complete a full order e2e', { tag: ['@p0', '@smoke', '@regression'] },
    async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/');

        const poManager = new POManager(authenticatedPage);
        const navBar = poManager.getNavBar();
        const productsListAndFilter = poManager.getProductsAndFilter();
        const cartAndCheckoutPages = poManager.getCartAndCheckoutPages()
        const ordersPage = poManager.getOrdersPage();

        await navBar.searchItem("wireless headphones");
        await productsListAndFilter.addFirstItemToTheCard()
        await navBar.goToCartPage()
        await cartAndCheckoutPages.checkout()

        await cartAndCheckoutPages.fillShippingAddress('1234 lala street', 'San Mateo', 'California', '94403', '6504343442')
        await cartAndCheckoutPages.fillCardInformation('4242424242424242', '1230', '234')

        await cartAndCheckoutPages.placeOrder()
        await expect(authenticatedPage.getByRole('heading', { name: '✅ Order placed, thank you!' })).toBeVisible()

        //getting order-id and matching it on order history page
        const orderText = await authenticatedPage.locator('p.muted').innerText();
        const orderId = orderText.match(/Order #\s*(\d{3}-\d{7}-\d{7})/)?.[1];
        expect(orderId).toBeTruthy();
        await navBar.goToOrdersPage();

        const orderIdFromOrdersPage = await ordersPage.getOrderId();
        expect(orderIdFromOrdersPage).toBe(orderId);
    });