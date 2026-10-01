import { test, expect } from '@playwright/test';

test('shows a date at the top center of every gallery photo', async ({ page }) => {
  await page.goto('/#gallery');
  const photos = page.locator('#gallery .gallery-item');
  await expect(page.locator('#gallery .gallery-date')).toHaveCount(await photos.count());
  const sortValues = await photos.evaluateAll((elements) =>
    elements.map((element) => Number(element.getAttribute('data-sort')))
  );
  expect(sortValues).toEqual([...sortValues].sort((first, second) => first - second));
  const date = page.locator('#gallery .gallery-date').first();
  const dateBox = await date.boundingBox();
  const photoBox = await photos.first().boundingBox();
  expect(dateBox).not.toBeNull();
  expect(photoBox).not.toBeNull();
  expect(Math.abs(dateBox!.x + dateBox!.width / 2 - photoBox!.x - photoBox!.width / 2)).toBeLessThan(1);
  expect(dateBox!.y).toBeGreaterThan(photoBox!.y);
  expect(dateBox!.y).toBeLessThan(photoBox!.y + photoBox!.height / 2);
});

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
