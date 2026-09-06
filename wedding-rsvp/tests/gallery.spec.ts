import { test, expect } from '@playwright/test';

test('gallery is linked from navigation and opens an accessible photo viewer', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Gallery' })).toHaveAttribute('href', '#gallery');
  await expect(page.locator('#gallery .gallery-item')).toHaveCount(6);

  await page.locator('#gallery .gallery-item').first().click();
  const viewer = page.getByRole('dialog', { name: 'Photo viewer' });
  await expect(viewer).toBeVisible();
  await expect(viewer.locator('figcaption')).toContainText('01 / 06');
  await page.keyboard.press('ArrowRight');
  await expect(viewer.locator('figcaption')).toContainText('02 / 06');
  await page.keyboard.press('ArrowLeft');
  await expect(viewer.locator('figcaption')).toContainText('01 / 06');
  await page.keyboard.press('Escape');
  await expect(viewer).toBeHidden();
  await expect(page.locator('#gallery .gallery-item').first()).toBeFocused();
});

test('gallery remains within a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/#gallery');
  await expect(page.locator('#gallery .gallery-item')).toHaveCount(6);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.locator('#gallery .gallery-item').nth(5).click();
  await expect(page.getByRole('dialog', { name: 'Photo viewer' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
