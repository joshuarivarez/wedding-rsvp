import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('preview serves the exact uploaded wedding logo', async ({ request }) => {
  const response = await request.get('/assets/wedding-logo.png');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/png');
  expect(await response.body()).toEqual(await readFile('public/assets/wedding-logo.png'));
});

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  test(`header and footer show the uploaded image at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.locator('wedding-logo')).toHaveCount(2);
    for (const region of ['header', 'footer']) {
      const logo = page.locator(`${region} wedding-logo img`);
      await expect(logo).toHaveAttribute('src', 'assets/wedding-logo.png');
      await expect.poll(() => logo.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBe(2000);
      await expect(logo).toHaveCSS('opacity', '1');
      await expect(page.locator(`${region} .logo-fallback`)).toBeHidden();
      const bounds = await logo.boundingBox();
      expect(bounds?.width).toBeGreaterThanOrEqual(64);
      expect(bounds?.width).toBe(bounds?.height);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  });
}
