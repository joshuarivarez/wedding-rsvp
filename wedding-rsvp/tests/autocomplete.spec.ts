import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#rsvp');
});

test('shows matching invitations while typing and supports keyboard selection', async ({ page }) => {
  const search = page.getByRole('combobox', { name: 'Name on your invitation' });
  await search.fill('Juan');

  const listbox = page.getByRole('listbox', { name: 'Matching invitations' });
  await expect(listbox).toBeVisible();
  await expect(listbox.getByRole('option')).toHaveCount(2);
  await expect(search).toHaveAttribute('aria-expanded', 'true');
  await expect(listbox.getByRole('option').first()).toHaveAttribute('aria-selected', 'true');

  await search.press('ArrowDown');
  await expect(listbox.getByRole('option').nth(1)).toHaveAttribute('aria-selected', 'true');
  await search.press('Enter');

  await expect(page.getByRole('heading', { name: 'Is this your invitation?' })).toBeVisible();
  await expect(page.locator('.invitation-card h4')).toHaveText('Juan Mendoza');
});

test('supports mouse selection and ignores stale suggestions', async ({ page }) => {
  const search = page.getByRole('combobox', { name: 'Name on your invitation' });
  await search.fill('Juan');
  await search.fill('Sof');

  const listbox = page.getByRole('listbox', { name: 'Matching invitations' });
  await expect(listbox).toBeVisible();
  await expect(listbox.getByRole('option')).toHaveCount(1);
  await expect(listbox).toContainText('Sofia Reyes');
  await expect(listbox).not.toContainText('Juan');
  await listbox.getByRole('option').click();

  await expect(page.locator('.invitation-card h4')).toHaveText('Sofia Reyes');
});

test('Escape closes suggestions without selecting an invitation', async ({ page }) => {
  const search = page.getByRole('combobox', { name: 'Name on your invitation' });
  await search.fill('Santos');
  await expect(page.getByRole('listbox', { name: 'Matching invitations' })).toBeVisible();
  await search.press('Escape');
  await expect(page.getByRole('listbox', { name: 'Matching invitations' })).toBeHidden();
  await expect(search).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('heading', { name: 'Is this your invitation?' })).toHaveCount(0);
});
