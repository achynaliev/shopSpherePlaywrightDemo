import { expect } from '@playwright/test';

export class CartAndCheckoutPages {
    constructor(page) {
        this.page = page;
        this.checkoutBtn = page.getByRole('button', { name: 'Proceed to checkout' })
        this.streetAddressInput = page.getByPlaceholder('Street address or P.O. Box');;
        this.cityInput = page.getByRole('textbox', { name: 'City' })
        this.stateInput = page.getByRole('textbox', { name: 'State / Region' })
        this.zipCodeInput = page.getByRole('textbox', { name: 'ZIP / Postal code' })
        this.phoneInput = page.getByRole('textbox', { name: 'Phone (optional)' })
        this.cardNumber = page.getByRole('textbox', { name: 'Card number' })
        this.cardExpiry = page.getByRole('textbox', { name: 'Expiry (MM/YY)' })
        this.cvc = page.getByRole('textbox', { name: 'Security code' })
        this.placeOrderButton = page.getByRole('button', { name: 'Place your order' })

        this.quantityDropdown = page.getByLabel('Qty:');

        this.orderSummary = page.locator('.card.summary');
        this.shippingNote = this.orderSummary.locator('.ship-note');
        this.summaryLines = this.orderSummary.locator('.summary-lines');
        this.itemsPrice = this.summaryLines.locator('dd').nth(0);
        this.shippingPrice = this.summaryLines.locator('dd').nth(1);
        this.estimatedTax = this.summaryLines.locator('dd').nth(2);
        this.orderTotal = this.summaryLines.locator('dd.summary-total');
        this.proceedToCheckoutBtn = this.orderSummary.getByRole('button', {
            name: 'Proceed to checkout'
        });
    }

    async checkout() {
        await this.checkoutBtn.click()
    }

    async fillShippingAddress(street, city, state, zipcode, phone) {
        await this.streetAddressInput.fill(street)
        await this.cityInput.fill(city)
        await this.stateInput.fill(state)
        await this.zipCodeInput.fill(zipcode)
        await this.phoneInput.fill(phone)
    }

    async fillCardInformation(cardNumber, CardExpiry, cvc) {
        await this.cardNumber.fill(cardNumber)
        await this.cardExpiry.fill(CardExpiry)
        await this.cvc.fill(cvc)
    }

    async placeOrder() {
        await this.placeOrderButton.click()
    }

    async selectQuantity(quantity) {
        await this.quantityDropdown.selectOption(String(quantity));
    }

    async verifySelectedQuantity(quantity) {
        await expect(this.quantityDropdown).toHaveValue(String(quantity));
    }

    async clearCart() {
        await this.page.goto('/cart');
        const deleteButtons = this.page.getByRole('button', { name: 'Delete' });
        const emptyMessage = this.page.getByText('Your ShopSphere cart is empty.');
        // Wait for the cart to load, then delete items until it's empty
        await expect(deleteButtons.first().or(emptyMessage)).toBeVisible();
        while (await deleteButtons.count() > 0) {
            const count = await deleteButtons.count();
            await deleteButtons.first().click();
            await expect(deleteButtons).toHaveCount(count - 1);
        }
        await expect(emptyMessage).toBeVisible();
    }

    async verifyOrderSummary(expected) {
        await expect(this.orderSummary).toBeVisible();

        await expect(this.shippingNote).toHaveText(
            '✓ Your order qualifies for FREE delivery.'
        );

        await expect(this.itemsPrice).toHaveText(expected.items);
        await expect(this.shippingPrice).toHaveText(expected.shipping);
        await expect(this.estimatedTax).toHaveText(expected.tax);
        await expect(this.orderTotal).toHaveText(expected.total);

        await expect(this.proceedToCheckoutBtn).toBeVisible();
        await expect(this.proceedToCheckoutBtn).toBeEnabled();
    }
}