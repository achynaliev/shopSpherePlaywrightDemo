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
}