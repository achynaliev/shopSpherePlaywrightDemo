import { POManager } from '../../page-objects/POManager.js';
import { authenticatedTest as test, expect } from '../../fixtures/auth.fixture.js';

test.describe('Product cart tests as a guest', () => {

    test('Add items as guest | Stored in `localStorage` , survives reload', { tag: ['@p0', '@smoke', '@regression'] },
        async ({ page }) => {
            const poManager = new POManager(page);
            const navBar = poManager.getNavBar();
            const productsListAndFilter = poManager.getProductsAndFilter();
            await page.goto('/');
            await navBar.searchItem("wireless headphones");
            await productsListAndFilter.addFirstItemToTheCard()
            // Verify cart count
            await navBar.verifyCartCount(1);

            // Reload page
            await page.reload();

            // Verify cart count persists
            await navBar.verifyCartCount(1);

            // Verify guest cart storage
            const guestCart = await page.evaluate(() => {
                return JSON.parse(localStorage.getItem('ss_guest_cart') || '[]');
            });

            expect(guestCart).toHaveLength(1);
            expect(guestCart[0].quantity).toBe(1);
        });

    test('Change qty / delete line | Updates storage, totals and badge; toast "Removed from cart', { tag: ['@p0', '@smoke', '@regression'] },
        async ({ page }) => {
            const poManager = new POManager(page);
            const cartAndCheckout = poManager.getCartAndCheckoutPages();
            const navBar = poManager.getNavBar();
            const productsListAndFilter = poManager.getProductsAndFilter();
            await page.goto('/');
            await navBar.searchItem("wireless headphones");
            await productsListAndFilter.addFirstItemToTheCard()
            // Verify cart count
            await navBar.verifyCartCount(1);
            // Go to cart
            await navBar.goToCartPage();
            await cartAndCheckout.selectQuantity(2);
            await cartAndCheckout.verifySelectedQuantity(2);
            await navBar.verifyCartCount(2);
            const guestCart = await page.evaluate(() => {
                return JSON.parse(localStorage.getItem('ss_guest_cart') || '[]');
            });

            expect(guestCart).toHaveLength(1);
            expect(guestCart[0].quantity).toBe(2);

            // Delete item
            await page.getByRole('button', { name: 'Delete' }).click();
            await navBar.verifyCartCount(0);
            await expect(page.getByText('✅ Removed from cart')).toBeVisible();
            const updatedGuestCart = await page.evaluate(() => {
                return JSON.parse(localStorage.getItem('ss_guest_cart') || '[]');
            });

            expect(updatedGuestCart).toHaveLength(0);
            await expect(page.getByText('Your ShopSphere cart is empty.')).toBeVisible();
            await expect(page.getByRole('link', { name: 'Continue shopping' })).toBeVisible();
        });

    test('Add item as guest and it persist when user logs in', { tag: ['@p0', '@smoke', '@regression'] },
        async ({ page, workerUsers }) => {
            const poManager = new POManager(page);
            const navBar = poManager.getNavBar();
            const authenticationPages = poManager.getAuthenticationPages();
            const productsListAndFilter = poManager.getProductsAndFilter();
            const cartAndCheckout = poManager.getCartAndCheckoutPages();

            // Start with an empty account cart, so leftovers from earlier runs don't add up
            await page.goto('/');
            await authenticationPages.goToLoginPage();
            await authenticationPages.login(workerUsers.REGULAR_USER3, process.env.PASSWORD);
            await expect(page.getByRole('button', { name: /Hello, Atai/i })).toBeVisible();
            await cartAndCheckout.clearCart();
            await authenticationPages.signOut();
            await navBar.verifyCartCount(0);

            await page.goto('/');
            await navBar.searchItem("wireless headphones");
            await productsListAndFilter.addFirstItemToTheCard()
            // Verify cart count
            await navBar.verifyCartCount(1);

            // Verify guest cart storage
            const guestCart = await page.evaluate(() => {
                return JSON.parse(localStorage.getItem('ss_guest_cart') || '[]');
            });

            expect(guestCart).toHaveLength(1);
            expect(guestCart[0].quantity).toBe(1);

            // Log in
            await authenticationPages.goToLoginPage();
            await authenticationPages.login(workerUsers.REGULAR_USER3, process.env.PASSWORD);
            // The count is already 1 before the merge (it's the guest item), so it can't tell us the
            // merge finished. Poll until the app has moved the guest cart into the account and cleared it.
            await expect.poll(() => page.evaluate(() =>
                JSON.parse(localStorage.getItem('ss_guest_cart') || '[]').length
            ), { message: 'guest cart should be cleared after it merges into the account' }).toBe(0);
            await navBar.verifyCartCount(1);
            await cartAndCheckout.clearCart();
        });
});