import { test, expect } from '@playwright/test';

test('uses an elegant terracotta SVG ampersand in the hero and footer', async ({ page }) => {
  await page.goto('/');
  const ampersands = page.locator('elegant-ampersand');
  await expect(ampersands).toHaveCount(2);
  await expect(page.locator('.hero-copy elegant-ampersand svg')).toHaveAttribute('aria-label', 'and');
  await expect(page.locator('footer elegant-ampersand svg')).toHaveAttribute('viewBox', '0 0 116 126');
  await expect(page.locator('elegant-ampersand text')).toHaveCount(0);
  await expect(page.locator('elegant-ampersand .heart-stroke')).toHaveCount(2);

  const terracotta = await page.locator('html').evaluate(element => {
    const probe = document.createElement('span');
    probe.style.color = getComputedStyle(element).getPropertyValue('--terracotta');
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  for (const ampersand of await ampersands.all()) {
    await expect(ampersand.locator('.heart-stroke')).toHaveCSS('stroke', terracotta);
  }
});
