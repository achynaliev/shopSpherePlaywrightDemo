export class ProductsListAndFilter {
    constructor(page) {
        this.page = page;
        this.productList = page.locator('.product-grid')
        this.productCard = page.locator('.product-card')
        this.productCardTitle = page.locator('.product-card-title')
    }

    async addFirstItemToTheCard() {
        await this.productCard.first().locator('button').click()
    }
}