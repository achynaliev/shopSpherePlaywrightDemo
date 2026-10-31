import { NavBar } from './NavBar.js';
import { ProductsListAndFilter } from './ProductListAndFilters.js'
import { CartAndCheckoutPages } from './CartAndCheckout.js'

export class POManager {
    constructor(page) {
        this.page = page
        this.navBar = new NavBar(page)
        this.productsListAndFilter = new ProductsListAndFilter(page)
        this.cartAndCheckoutPages = new CartAndCheckoutPages(page)
    }

    getNavBar() {
        return this.navBar
    }

    getProductsAndFilter() {
        return this.productsListAndFilter
    }

    getCartAndCheckoutPages() {
        return this.cartAndCheckoutPages
    }
}