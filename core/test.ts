import { randomBytes } from 'node:crypto';
import { test as base, expect, type Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { config, shopData } from './config';
import type { Account } from './models';
import { createLogger, type Logger } from './logger';
import { registerSecrets, readSecrets, sanitize } from './privacy';
import { RegisterPage } from '../ui/register-page';
import { LoginPage } from '../ui/login-page';
import { AccountPage } from '../ui/account-page';
import { CatalogPage } from '../ui/catalog-page';
import { ProductPage } from '../ui/product-page';
import { CheckoutPage } from '../ui/checkout-page';
import { InvoicesPage } from '../ui/invoices-page';

export async function maskedScreenshot(page: Page) {
  await page.locator('body *').evaluateAll((elements, secrets) => {
    for (const element of elements) {
      const ownText = Array.from(element.childNodes).filter(node => node.nodeType === Node.TEXT_NODE)
        .map(node => node.textContent ?? '').join('');
      if (secrets.some(value => ownText.includes(value))) {
        element.setAttribute('data-private-test', 'true');
      }
    }
  }, readSecrets());
  return page.screenshot({
    mask: [page.locator('input, textarea, nav, [data-private-test="true"], [data-test="totp-secret"]')],
    timeout: 8000,
  });
}

type Fixtures = {
  log: Logger;
  account: Account;
  pages: {
    login: LoginPage;
    account: AccountPage;
    catalog: CatalogPage;
    product: ProductPage;
    checkout: CheckoutPage;
    invoices: InvoicesPage;
  };
};

export const test = base.extend<Fixtures>({
  log: [async ({ page }, use, testInfo) => {
    const logger = createLogger();
    const caseId = testInfo.title.match(/^(AUTH-\d+|E2E-\d+|DIAG-\d+)/)?.[0] ?? testInfo.title;
    await allure.allureId(caseId);
    await allure.parentSuite('Toolshop');
    await allure.parameter('Браузер', testInfo.project.name);
    await allure.parameter('ID кейса', caseId);
    logger.log.info(`Запуск ${caseId}, браузер ${testInfo.project.name}`);
    page.on('response', async response => {
      if (response.status() < 400) return;
      const url = new URL(response.url());
      if (!url.hostname.endsWith('practicesoftwaretesting.com')) return;
      logger.log.warn(`HTTP ${response.status()} ${response.request().method()} ${url.pathname}`);
      try {
        const body = await response.json();
        if (body.errors) logger.log.warn(`Поля с ошибками: ${Object.keys(body.errors).join(', ')}`);
        if (typeof body.message === 'string') logger.log.warn(sanitize(body.message));
      } catch { logger.log.debug('Ответ ошибки содержит нетекстовые данные'); }
    });
    try {
      await use(logger.log);
    } finally {
      if (testInfo.status !== testInfo.expectedStatus) {
        logger.log.error(`Сбой ${caseId}, статус ${testInfo.status}`);
        for (const error of testInfo.errors) logger.log.error(sanitize(error.message ?? 'Ошибка без текста'));
        try {
          if (page.isClosed()) throw new Error('Страница закрыта');
          const contacts = await page.locator('input[data-test]').evaluateAll(elements => elements
            .filter(element => /^(first-name|last-name|dob|email|phone|street|city|state|postal_code|password)$/.test(element.getAttribute('data-test') ?? ''))
            .map(element => (element as HTMLInputElement).value));
          registerSecrets(contacts);
          await testInfo.attach('Скриншот при падении', { body: await maskedScreenshot(page), contentType: 'image/png' });
        } catch (error) {
          logger.log.warn(`Скриншот недоступен: ${error instanceof Error ? sanitize(error.message) : 'неизвестная причина'}`);
        }
      }
      logger.log.info(`Завершение ${caseId}, статус ${testInfo.status}`);
      await testInfo.attach('Лог выполнения', { body: logger.text(), contentType: 'text/plain' });
    }
  }, { auto: true }],

  account: async ({ page, log }, use) => {
    const account: Account = {
      ...shopData.customer,
      email: `qa-${randomBytes(10).toString('hex')}@example.com`,
      password: randomBytes(12).toString('base64url') + 'Qa1!',
    };
    if (config.accountSource === 'env') {
      if (!process.env.TEST_EMAIL || !process.env.TEST_PASSWORD) throw new Error('Для TEST_ACCOUNT_SOURCE=env заполните TEST_EMAIL и TEST_PASSWORD');
      account.email = process.env.TEST_EMAIL;
      account.password = process.env.TEST_PASSWORD;
    }
    registerSecrets(Object.values(account));
    if (config.accountSource === 'generated') {
      await test.step('Подготовить отдельный учебный аккаунт через регистрацию', async () => {
        log.info('Подготовка аккаунта и новой браузерной сессии');
        await new RegisterPage(page, log).register(account);
      });
    }
    await use(account);
  },

  pages: async ({ page, log }, use) => {
    await use({
      login: new LoginPage(page, log),
      account: new AccountPage(page, log),
      catalog: new CatalogPage(page, log),
      product: new ProductPage(page, log),
      checkout: new CheckoutPage(page, log),
      invoices: new InvoicesPage(page, log),
    });
  },
});

export { expect };
