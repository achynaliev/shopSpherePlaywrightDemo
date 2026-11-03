export class AuthenticationPages {
    constructor(page) {
        this.page = page;
        this.loginLink = this.page.locator('a.nav-item[href*="/login"]');
        this.emailInput = this.page.locator('input[type="email"]');
        this.passwordInput = this.page.locator('input[type="password"]');
        this.signInButton = this.page.getByRole('button', { name: 'Sign in' })
        this.accountButton = this.page.locator(".account")
        this.singOutButton = this.page.getByRole('button', { name: 'Sign Out' })
    }

    async goToLoginPage() {
        await this.loginLink.click();
    }

    async login(email, password) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.signInButton.click();
    }
}