export class OrdersPage {
    constructor(page) {
        this.page = page;
        this.orderCards = page.locator('.order-card');
        this.orderNumber = this.orderCards.locator('.order-card-num .label');
        this.orderDate = this.orderCards.locator('.order-card-head > div').nth(0);
        this.orderTotal = this.orderCards.locator('.order-card-head > div').nth(1);
        this.orderCustomer = this.orderCards.locator('.order-card-head > div').nth(2);
        this.orderStatus = this.orderCards.locator('.order-card-body .status');
        this.orderProduct = this.orderCards.locator('.checkout-item > div a');
    }

    async getOrderId() {
        const orderNumberText = await this.orderNumber.first().innerText();
        return orderNumberText.match(/\d{3}-\d{7}-\d{7}/)?.[0];
    }
}