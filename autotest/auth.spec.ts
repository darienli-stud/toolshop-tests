import { randomBytes } from 'node:crypto';
import * as allure from 'allure-js-commons';
import { test, expect } from '../core/test';
import { registerSecrets } from '../core/privacy';
import cases from './data/auth-cases.json';

type AuthCase = {
  id: string;
  title: string;
  identifierType: string;
  errorClass: string;
  email: 'valid' | 'empty' | 'invalid' | 'unknown';
  password: 'valid' | 'empty' | 'wrong';
  target: 'email' | 'password' | 'login';
  expected: string;
};

test('AUTH-01 Успешная авторизация по email и паролю', async ({ page, pages, account, log }) => {
  await allure.feature('Авторизация');
  await allure.severity('critical');
  await allure.parameter('Идентификатор', 'email');
  await test.step('Открыть форму и войти с корректными данными', async () => {
    log.info('Ввод корректных данных и отправка формы входа');
    await pages.login.open();
    await pages.login.signIn(account.email, account.password);
    await pages.login.waitForAccount();
    await expect(page).toHaveURL(/\/account$/);
  });
  await test.step('Подтвердить сессию нужного пользователя через профиль', async () => {
    log.info('Проверка владельца авторизованной сессии');
    await pages.account.openProfile();
    await expect.poll(() => pages.account.emailMatches(account.email)).toBe(true);
  });
});

test.describe('Параметризованные негативные классы', () => {
  for (const scenario of cases as AuthCase[]) {
    test(`${scenario.id} ${scenario.title}`, async ({ page, pages, account, log }) => {
      await allure.feature('Авторизация');
      await allure.parameter('Идентификатор', scenario.identifierType);
      await allure.parameter('Класс ошибки', scenario.errorClass);
      await allure.parameter('Ожидаемый результат', scenario.expected);

      const identifiers = {
        valid: account.email,
        empty: '',
        invalid: 'invalid-email',
        unknown: `missing-${randomBytes(10).toString('hex')}@example.com`,
      };
      const passwords = { valid: account.password, empty: '', wrong: randomBytes(12).toString('base64url') + 'Wrong1!' };
      registerSecrets([identifiers.unknown, passwords.wrong]);
      await test.step('Отправить форму с одним ошибочным параметром', async () => {
        log.info(`Проверка класса «${scenario.errorClass}»`);
        await pages.login.open();
        await pages.login.signIn(identifiers[scenario.email], passwords[scenario.password]);
        await expect(pages.login.error(scenario.target)).toHaveText(scenario.expected);
        await expect(page).toHaveURL(/\/auth\/login(?:\?|$)/);
      });
      await test.step('Проверить отсутствие авторизованной сессии', async () => {
        log.info('Проверка отказа в доступе к защищённой странице');
        await pages.account.visitProtectedPage();
        await expect(page).toHaveURL(/\/auth\/login(?:\?|$)/);
        await expect(pages.login.submit.locator).toBeVisible();
      });
    });
  }
});
