import { expect, test } from '@playwright/test';

test('домашняя страница на русском загружается', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.locator('h1').first()).toBeVisible();
});
