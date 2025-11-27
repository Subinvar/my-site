import { expect, test } from '@playwright/test';

test('каталог реагирует на фильтры', async ({ page }) => {
  await page.goto('/catalog');

  const cards = page.getByTestId('catalog-item');
  const initialCount = await cards.count();
  expect(initialCount).toBeGreaterThan(0);

  const firstCheckbox = page.getByTestId('catalog-filter-checkbox').first();
  await firstCheckbox.check();

  await expect(page).toHaveURL(/\?/);
  await expect
    .poll(async () => page.getByTestId('catalog-item').count(), { timeout: 15000 })
    .not.toBe(initialCount);

  const filteredCount = await page.getByTestId('catalog-item').count();
  expect(filteredCount).not.toBe(initialCount);
});

test('фильтры применяются повторно после изменения выбора', async ({ page }) => {
  await page.goto('/catalog');

  const cards = page.getByTestId('catalog-item');
  const initialCount = await cards.count();
  expect(initialCount).toBeGreaterThan(0);

  const firstCheckbox = page.getByTestId('catalog-filter-checkbox').first();

  await firstCheckbox.check();

  await expect
    .poll(async () => page.getByTestId('catalog-item').count(), { timeout: 15000 })
    .not.toBe(initialCount);

  await firstCheckbox.uncheck();

  await expect
    .poll(async () => page.getByTestId('catalog-item').count(), { timeout: 15000 })
    .toBe(initialCount);
});