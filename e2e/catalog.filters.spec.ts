import { expect, test } from '@playwright/test';

test('каталог реагирует на фильтры', async ({ page }) => {
  await page.goto('/catalog');

  const resetLink = page.getByRole('link', { name: 'Сбросить' });
  if (await resetLink.isVisible()) {
    await resetLink.click();
    await expect(page).toHaveURL(/\/catalog\b/);
  }

  const cards = page.getByTestId('catalog-item');
  const initialCount = await cards.count();
  expect(initialCount).toBeGreaterThan(0);

  const firstCheckbox = page.getByTestId('catalog-filter-checkbox').first();
  const applyFilters = page.getByRole('button', { name: 'Применить фильтры' });

  await firstCheckbox.check();
  await applyFilters.click();

  await expect(page).toHaveURL(/\?/);
  await expect
    .poll(async () => cards.count(), { timeout: 15000 })
    .not.toBe(initialCount);

  const filteredCount = await cards.count();
  expect(filteredCount).not.toBe(initialCount);
});

test('фильтры применяются повторно после изменения выбора', async ({ page }) => {
  await page.goto('/catalog');

  const resetLink = page.getByRole('link', { name: 'Сбросить' });
  if (await resetLink.isVisible()) {
    await resetLink.click();
    await expect(page).toHaveURL(/\/catalog\b/);
  }

  const cards = page.getByTestId('catalog-item');
  const initialCount = await cards.count();
  expect(initialCount).toBeGreaterThan(0);

  const firstCheckbox = page.getByTestId('catalog-filter-checkbox').first();
  const applyFilters = page.getByRole('button', { name: 'Применить фильтры' });

  await firstCheckbox.check();
  await applyFilters.click();

  await expect.poll(async () => cards.count(), { timeout: 15000 }).not.toBe(initialCount);

  const filteredCount = await cards.count();

  await firstCheckbox.uncheck();
  await applyFilters.click();

  await expect.poll(async () => cards.count(), { timeout: 15000 }).toBe(initialCount);
  expect(await cards.count()).toBe(initialCount);
  expect(filteredCount).not.toBe(initialCount);
});