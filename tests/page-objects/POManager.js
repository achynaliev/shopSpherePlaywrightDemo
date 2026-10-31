import { NavBar } from './NavBar.js';

export class POManager {
    constructor(page) {
        this.page = page
        this.navBar = new NavBar(page)
    }

    getNavBar() {
        return this.navBar
    }
}