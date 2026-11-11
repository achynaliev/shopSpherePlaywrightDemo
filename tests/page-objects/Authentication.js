// The server checks passwords with bcrypt (deliberately slow). With many parallel workers hitting
// one server (the Azure run), a login can take well over the default 5s expect timeout, so wait
// for the server's answer explicitly with a longer timeout.
export const AUTH_RESPONSE_TIMEOUT = 30_000;

// Clicks `submit` and waits until the server has answered the auth request (success or error).
export async function submitAndWaitForAuth(page, submit, endpoint = '/api/auth/login') {
    const response = page.waitForResponse(
        (res) => res.url().includes(endpoint) && res.request().method() === 'POST',
        { timeout: AUTH_RESPONSE_TIMEOUT },
    );
    await submit.click();
    return response;
}

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
        await submitAndWaitForAuth(this.page, this.signInButton);
    }

    async signOut() {
        await this.accountButton.click()
        await this.singOutButton.click()
    }
}