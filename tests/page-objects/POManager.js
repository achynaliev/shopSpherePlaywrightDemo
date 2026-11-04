import { NavBar } from './NavBar.js';
import { ProductsListAndFilter } from './ProductListAndFilters.js'
import { CartAndCheckoutPages } from './CartAndCheckout.js'
import { AuthenticationPages } from './Authentication.js'
import { OrdersPage } from './Orders.js'

export class POManager {
    constructor(page) {
        this.page = page
        this.navBar = new NavBar(page)
        this.authenticationPages = new AuthenticationPages(page)
        this.productsListAndFilter = new ProductsListAndFilter(page)
        this.cartAndCheckoutPages = new CartAndCheckoutPages(page)
        this.ordersPage = new OrdersPage(page)
    }

    getNavBar() {
        return this.navBar
    }

    getAuthenticationPages() {
        return this.authenticationPages
    }

    getProductsAndFilter() {
        return this.productsListAndFilter
    }

    getCartAndCheckoutPages() {
        return this.cartAndCheckoutPages
    }

    getOrdersPage() {
        return this.ordersPage
    }
}