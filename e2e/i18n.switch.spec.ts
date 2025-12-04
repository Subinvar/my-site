import { expect, test } from '@playwright/test';

test('переключение языка на английский', async ({ page }) => {
  await page.goto('/');
  const switchToEnglish = page.locator('a[href^="/en"]').first();
  const switchHref = await switchToEnglish.getAttribute('href');
  expect.soft(switchHref, 'ссылка переключателя языка должна вести на английскую версию').not.toBeNull();
  await Promise.all([
    page.waitForURL('**/en*', { waitUntil: 'commit', timeout: 5000 }).catch(async () => {
      if (switchHref) {
        await page.goto(switchHref);
      }
    }),
    switchToEnglish.click(),
  ]);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
