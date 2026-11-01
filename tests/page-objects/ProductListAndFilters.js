export class ProductsListAndFilter {
    constructor(page) {
        this.page = page;
        this.productList = page.locator('.product-grid')
        this.productCard = page.locator('.product-card')
        this.productCardTitle = page.locator('.product-card-title')
        this.shelves = page.locator('.shelves .shelf');

        this.resultsSection = page.locator('.results');
        this.resultsHeading = page.locator('.results-heading');
        this.productGrid = this.resultsSection.locator('.product-grid');

        this.activePageButton = page.locator('.pagination button[aria-current="page"]');
        this.nextPageButton = page.getByRole('button', { name: 'Next ›' });
        this.previousPageButton = page.getByRole('button', { name: '‹ Previous' });

        this.departmentFilter = page.locator('.filter-group').filter({
            has: page.getByRole('heading', { name: 'Department' })
        });
        this.departmentOptions = this.departmentFilter.locator('.filter-link');
        this.activeDepartment = this.departmentFilter.locator('.filter-link.active');

        this.emptyState = page.locator('.results .empty');
        this.emptyStateHeading = this.emptyState.locator('h3');
        this.emptyStateMessage = this.emptyState.locator('p');
        this.browseAllProductsLink = this.emptyState.getByRole('link', {
            name: 'Browse all products'
        });

        this.newArrivalsShelf = page.locator('.shelf').filter({
            has: page.getByRole('heading', { name: 'New arrivals' })
        });
        this.topRatedShelf = page.locator('.shelf').filter({
            has: page.getByRole('heading', { name: 'Top rated' })
        });
        this.featuredDealsSection = page.locator('section').filter({
            has: page.getByRole('heading', { name: "Today's featured deals" })
        });
        this.featuredDealCards = this.featuredDealsSection.locator('.product-card');
    }

    async addFirstItemToTheCard() {
        await this.productCard.first().locator('button').click()
    }
}