import { test, expect } from '@playwright/test';

for (const width of [1440, 1024, 768, 390, 351, 320]) {
  test(`caption interrupts the border cleanly at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const outline = await page.locator('.photo-outline').boundingBox();
    const label = page.locator('.hero-art .image-caption span');
    const caption = await label.boundingBox();
    expect(outline).not.toBeNull();
    expect(caption).not.toBeNull();
    // The label masks the border, with a visible line remaining at both ends.
    expect(Math.abs(outline!.y + outline!.height - (caption!.y + caption!.height / 2))).toBeLessThanOrEqual(1);
    expect(caption!.x).toBeGreaterThan(outline!.x + 4);
    expect(caption!.x + caption!.width).toBeLessThan(outline!.x + outline!.width - 4);
    const background = await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor);
    await expect(label).toHaveCSS('background-color', background);
    const labelIsOnTop = await label.evaluate(el => {
      const box = el.getBoundingClientRect();
      el.scrollIntoView({ block: 'center' });
      const visibleBox = el.getBoundingClientRect();
      return document.elementFromPoint(visibleBox.x + box.width / 2, visibleBox.y + box.height / 2) === el;
    });
    expect(labelIsOnTop).toBe(true);
  });
}
