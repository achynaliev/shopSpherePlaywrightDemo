export class NavBar {
    constructor(page) {
        this.page = page;
        this.mainLogo = page.locator('.logo-mark');
        this.categorySelect = page.getByLabel('Category');
        this.searchInput = page.locator("input[type='search']");
        this.searchButton = page.getByRole('button', { name: 'Search' });
        this.ordersPage = page.locator("a[href='/orders']").first()
        this.cartPageLogo = page.locator('.cart-link')
    }

    async selectCategory(category) {
        await this.categorySelect.selectOption(category);
    }

    async goToOrdersPage() {
        await this.ordersPage.click()
    }

    async goToCartPage() {
        await this.cartPageLogo.click()
    }

}