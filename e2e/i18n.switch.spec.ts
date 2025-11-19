import { expect, test } from '@playwright/test';

test('переключение языка на английский', async ({ page }) => {
  await page.goto('/');
  const switchToEnglish = page.locator('a[href^="/en"]').first();
  await Promise.all([
    page.waitForURL('**/en*'),
    switchToEnglish.click(),
  ]);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
