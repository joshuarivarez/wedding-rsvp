import { test, expect } from '@playwright/test';

for (const viewport of [{ width: 1440, height: 800 }, { width: 390, height: 844 }]) {
  test(`header remains sticky at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const header = page.locator('.header');
    await expect(header).toHaveCSS('position', 'sticky');
    await page.locator('#gallery').scrollIntoViewIfNeeded();
    await expect.poll(async () => Math.round((await header.boundingBox())!.y)).toBe(0);
    await expect(header).toBeVisible();
  });
}
