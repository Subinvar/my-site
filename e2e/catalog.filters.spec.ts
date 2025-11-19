import { expect, test } from '@playwright/test';

test('каталог реагирует на фильтры', async ({ page }) => {
  await page.goto('/catalog');

  const cards = page.getByTestId('catalog-item');
  const initialCount = await cards.count();
  expect(initialCount).toBeGreaterThan(0);

  const firstCheckbox = page.getByTestId('catalog-filter-checkbox').first();
  await firstCheckbox.check();
  await page.locator('form button[type="submit"]').first().click();

  await expect(page).toHaveURL(/\?/);
  await expect
    .poll(async () => page.getByTestId('catalog-item').count())
    .not.toBe(initialCount);

  const filteredCount = await page.getByTestId('catalog-item').count();
  expect(filteredCount).not.toBe(initialCount);
});
