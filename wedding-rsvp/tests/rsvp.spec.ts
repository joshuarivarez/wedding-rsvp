import { test, expect, Page } from '@playwright/test';

const storageKey = 'wedding-rsvp:mock:v1';

test('mobile RSVP text fields use a font size that prevents browser zoom', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#rsvp');
  await expect(page.getByLabel('Name on your invitation')).toHaveCSS('font-size', '16px');
});

async function findInvitation(page: Page, name = 'Juan & Maria Dela Cruz') {
  await page.goto('/#rsvp');
  await page.getByLabel('Name on your invitation').fill(name);
  await page.getByRole('button', { name: 'Find invitation', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Matching invitations' })).toBeVisible();
  await page.locator('.invitation-match').first().click();
  await expect(page.getByRole('heading', { name: 'Is this your invitation?' })).toBeVisible();
}

async function accept(page: Page, name?: string) {
  await findInvitation(page, name);
  await page.getByRole('button', { name: /Yes, that’s/ }).click();
  await page.getByRole('radio', { name: /Joyfully accepts/ }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.locator('.guest-checklist input[type="checkbox"]').first().check();
}

test('pressing Enter does not search invitations', async ({ page }) => {
  await page.goto('/#rsvp');
  await page.getByLabel('Name on your invitation').fill('Ju');
  await page.getByLabel('Name on your invitation').press('Enter');
  await expect(page.getByRole('heading', { name: 'Find your invitation' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: 'Find invitation', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('at least 3 letters');
});

test('search validates input, handles unknown names, and disambiguates matches', async ({ page }) => {
  await page.goto('/#rsvp');
  await page.getByRole('button', { name: 'Find invitation', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('at least 3 letters');
  await page.getByLabel('Name on your invitation').fill('Uninvited Person');
  await page.getByRole('button', { name: 'Find invitation', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('couldn’t find your invitation');
  await expect(page.getByRole('button', { name: 'Confirm RSVP', exact: true })).toHaveCount(0);
  await page.getByLabel('Name on your invitation').fill('Juan');
  await page.getByRole('button', { name: 'Find invitation', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Matching invitations' })).toBeVisible();
  await expect(page.locator('.invitation-match')).toHaveCount(2);
  await page.getByRole('button', { name: /Juan Mendoza/ }).click();
  await expect(page.locator('.invitation-card')).toContainText('1 guest');
  await page.getByRole('button', { name: /Search for a different/ }).click();
  await page.getByLabel('Name on your invitation').fill('  MARÍA   dela CRUZ ');
  await page.getByRole('button', { name: 'Find invitation', exact: true }).click();
  await expect(page.locator('.invitation-match')).toHaveCount(1);
  await page.locator('.invitation-match').click();
  await expect(page.locator('.invitation-card h4')).toHaveText('Juan & Maria Dela Cruz');
});

test('requires identity and attendance, saves only listed guests with optional details', async ({ page }) => {
  await findInvitation(page);
  await expect(page.getByRole('radio')).toHaveCount(0);
  await expect(page.locator('.invitation-card')).toContainText('2 guests');
  await page.getByRole('button', { name: 'Yes, that’s us' }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('whether you can join');
  await page.getByRole('radio', { name: /Joyfully accepts/ }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('.guest-checklist input[type="checkbox"]')).toHaveCount(2);
  await expect(page.locator('.guest-checklist input[type="checkbox"]:checked')).toHaveCount(0);
  await expect(page.locator('.guest-instructions')).toContainText('Check each invited person');
  await expect(page.locator('.guest-checklist')).toContainText('Spouse');
  await page.getByRole('checkbox', { name: /Juan Dela Cruz/ }).check();
  await page.getByRole('checkbox', { name: 'Have + 1' }).check();
  await expect(page.getByRole('checkbox', { name: /Maria Dela Cruz/ }).locator('xpath=..')).toContainText('Not attending');
  await page.getByLabel('A short message for the couple').fill('So happy for you both!');
  await page.getByRole('button', { name: 'Confirm RSVP', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Thank you, Juan & Maria!' })).toBeVisible();
  await expect(page.locator('.confirmation-summary')).toContainText('2 guests attending');
  await expect(page.locator('.rsvp-confirmation')).toContainText('Nothing has been sent to the couple');
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), storageKey);
  expect(saved['demo-dela-cruz']).toMatchObject({
    invitationId: 'demo-dela-cruz', attendance: 'accepts', guestIds: ['demo-juan-dela-cruz'],
    plusOneGuestIds: ['demo-juan-dela-cruz'], message: 'So happy for you both!',
  });
});

test('accepting requires at least one named guest; edits replace the same response', async ({ page }) => {
  await accept(page);
  for (const checkbox of await page.locator('.guest-checklist input[type="checkbox"]').all()) await checkbox.uncheck();
  await page.getByRole('button', { name: 'Confirm RSVP', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('at least one guest');
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();
  await page.getByRole('checkbox', { name: /Juan Dela Cruz/ }).check();
  await page.getByRole('button', { name: 'Confirm RSVP', exact: true }).click();
  await page.getByRole('button', { name: 'Edit RSVP', exact: true }).click();
  await page.getByRole('radio', { name: /Regretfully declines/ }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await expect(page.getByLabel('Food allergies')).toHaveCount(0);
  await page.getByLabel('A short message for the couple').fill('Celebrating with you in spirit.');
  await page.getByRole('button', { name: 'Confirm RSVP', exact: true }).click();
  await expect(page.locator('.rsvp-confirmation')).toContainText('We’ll miss you');
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), storageKey);
  expect(Object.keys(saved)).toEqual(['demo-dela-cruz']);
  expect(saved['demo-dela-cruz']).toMatchObject({attendance: 'declines', guestIds: []});
});

test('storage failure preserves selections and does not show a false confirmation', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('Storage unavailable'); }; });
  await accept(page, 'Sofia Reyes');
  await page.getByRole('button', { name: 'Confirm RSVP', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('couldn’t save');
  await expect(page.getByRole('checkbox', { name: /Sofia Reyes/ })).toBeChecked();
  await expect(page.locator('.rsvp-confirmation')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Confirm RSVP', exact: true })).toBeEnabled();
});

test('single and family invitations keep their own reserved guest counts on mobile', async ({ page }) => {
  await page.setViewportSize({width: 320, height: 844});
  await accept(page, 'Sofia Reyes');
  await expect(page.getByRole('checkbox')).toHaveCount(1);
  await page.getByRole('button', { name: 'Confirm RSVP', exact: true }).click();
  await page.getByRole('button', { name: 'Find another invitation' }).click();
  await page.getByLabel('Name on your invitation').fill('The Santos Family');
  await page.getByRole('button', { name: 'Find invitation', exact: true }).click();
  await page.getByRole('button', { name: 'Yes, that’s us' }).click();
  await page.getByRole('radio', { name: /Joyfully accepts/ }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('checkbox')).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.getByRole('button', { name: 'Confirm RSVP', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Thank you, the Santos family!' })).toBeVisible();
});
