import { POManager } from '../../page-objects/POManager.js';
import { authenticatedTest } from '../../fixtures/auth.fixture.js';
import { expect } from '@playwright/test';

authenticatedTest('complete a full order e2e', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');

    const poManager = new POManager(authenticatedPage);
    const navBar = poManager.getNavBar();
    const productsListAndFilter = poManager.getProductsAndFilter();
    const cartAndCheckoutPages = poManager.getCartAndCheckoutPages()

    await navBar.searchItem("wireless headphones");
    await productsListAndFilter.addFirstItemToTheCard()
    await navBar.goToCartPage()
    await cartAndCheckoutPages.checkout()

    await cartAndCheckoutPages.fillShippingAddress('1234 lala street', 'San Mateo', 'California', '94403', '6504343442')
    await cartAndCheckoutPages.fillCardInformation('4242424242424242', '1230', '234')

    await cartAndCheckoutPages.placeOrder()
    await expect(authenticatedPage.getByRole('heading', { name: '✅ Order placed, thank you!' })).toBeVisible()
});