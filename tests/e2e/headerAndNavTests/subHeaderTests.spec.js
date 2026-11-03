import { test } from '@playwright/test';
import { headerSubnavLinks } from '../../test-data/navigationData';
import { POManager } from '../../page-objects/POManager';

test('all header subnavigation links navigate correctly', { tag: ['@p1', '@regression'] },
    async ({ page }) => {

        const poManager = new POManager(page);
        const navBar = poManager.getNavBar();

        await page.goto('/');

        await navBar.verifySubnavLinks(headerSubnavLinks);
    });