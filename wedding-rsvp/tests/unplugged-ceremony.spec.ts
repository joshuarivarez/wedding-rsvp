import { test, expect } from '@playwright/test';

test('wedding details include an unplugged ceremony notice', async ({ page }) => {
  await page.goto('/#details');
  const notice = page.locator('.unplugged-notice');
  await expect(notice.getByRole('heading', { name: 'An unplugged ceremony' })).toBeVisible();
  await expect(notice).toContainText('phones and cameras remain silenced and tucked away during the ceremony');
  await expect(notice).toContainText('photographer will capture every special moment');
});

test('unplugged ceremony notice fits a narrow mobile screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/#details');
  await expect(page.locator('.unplugged-notice')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
