import { expect, test } from '@playwright/test';

test('форма контактов завершает отправку в тестовом режиме', async ({ page }) => {
  await page.goto('/contacts');

  await page.getByLabel('Имя').fill('Тестовый пользователь');
  await page.getByLabel('Email').fill(`qa+${Date.now()}@example.com`);
  await page.getByLabel('Телефон').fill('+1 234 567 890');
  await page.getByLabel('Сообщение').fill('Это автоматическая проверка формы обратной связи.');
  await page.getByLabel('Я согласен на обработку персональных данных').check();
  await page.getByRole('button', { name: /Отправить|Send/ }).click();
  await expect(page.getByText('Спасибо! Ваше сообщение отправлено.')).toBeVisible();
});
