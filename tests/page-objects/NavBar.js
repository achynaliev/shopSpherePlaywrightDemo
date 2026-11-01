export class NavBar {
    constructor(page) {
        this.page = page;
        this.mainLogo = page.locator('.logo-mark');
        this.categoryDropdown = page.getByRole('combobox', {
            name: 'Category'
        });
        this.searchInput = page.locator("input[type='search']");
        this.searchButton = page.getByRole('button', { name: 'Search' });
        this.ordersPage = page.locator("a[href='/orders']").first()
        this.cartPageLogo = page.locator('.cart-link')
        this.headerSub = page.locator('.header-sub');
        this.headerSubLinks = this.headerSub.locator('a');
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

    async searchItem(item) {
        await this.searchInput.fill(item);
        await this.searchButton.click()
    }

}