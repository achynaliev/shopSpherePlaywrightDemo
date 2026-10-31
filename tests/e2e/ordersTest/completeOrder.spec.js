import { POManager } from '../../page-objects/POManager.js';
import { authenticatedTest } from '../../fixtures/auth.fixture.js';

authenticatedTest('complete a full order e2e', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');

    const poManager = new POManager(authenticatedPage);
    const navBar = poManager.getNavBar();

    await authenticatedPage.pause();
});