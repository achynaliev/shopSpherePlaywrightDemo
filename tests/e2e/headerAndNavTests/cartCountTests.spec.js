import { test } from '@playwright/test';
import { POManager } from '../../page-objects/POManager';

test('cart count updates when product is added', { tag: ['@p0', '@regression'] },
    async ({ page }) => {
        const poManager = new POManager(page);
        const productsListAndFilter = poManager.getProductsAndFilter();
        const navBar = poManager.getNavBar();

        await page.goto('/');
        await navBar.verifyCartCount(0);

        await page.goto('/search');
        await productsListAndFilter.addFirstItemToTheCard();
        await navBar.verifyCartCount(1);
    });