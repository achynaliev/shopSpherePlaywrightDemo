import { POManager } from '../../page-objects/POManager.js';
import { authenticatedTest } from '../../fixtures/auth.fixture.js';
import { expect } from '@playwright/test';

authenticatedTest.describe('Product Search tests', () => {

    authenticatedTest('Clicking main logo goes to home page `/`', { tag: ['@p1', '@regression'] },
        async ({ authenticatedPage }) => {
            const poManager = new POManager(authenticatedPage);
            const navBar = poManager.getNavBar();
            await authenticatedPage.goto('/');
            await expect(authenticatedPage).toHaveURL('/');
            await navBar.goToOrdersPage();
            await expect(authenticatedPage).toHaveURL('/orders');
            await navBar.goToCartPage();
            await expect(authenticatedPage).toHaveURL('/cart');
            await navBar.mainLogo.click();
            await expect(authenticatedPage).toHaveURL('/');
        });

    authenticatedTest('Header search: type term, submit (Enter and button) | `/search?q=term`', { tag: ['@p0', '@smoke', '@regression'] },
        async ({ authenticatedPage }) => {
            const poManager = new POManager(authenticatedPage);
            const navBar = poManager.getNavBar();
            await authenticatedPage.goto('/');
            await navBar.searchItem('laptop');
            await expect(authenticatedPage).toHaveURL(/\/search\?q=laptop/);
        });

    authenticatedTest('Header category dropdown + term | `/search?q=term&category=…`', { tag: ['@p1', '@regression'] },
        async ({ authenticatedPage }) => {
            const poManager = new POManager(authenticatedPage);
            const navBar = poManager.getNavBar();
            await authenticatedPage.goto('/');
            await navBar.selectCategory('Electronics');
            await navBar.searchButton.click();
            await expect(authenticatedPage).toHaveURL(/\/search\?category=Electronics/);
        });

    authenticatedTest('Empty search submit | `/search` (all products)', { tag: ['@p1', '@regression'] },
        async ({ authenticatedPage }) => {
            const poManager = new POManager(authenticatedPage);
            const navBar = poManager.getNavBar();
            await authenticatedPage.goto('/');
            await navBar.searchItem('');
            await expect(authenticatedPage).toHaveURL('/search');
        });
});