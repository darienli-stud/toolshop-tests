import * as allure from 'allure-js-commons';
import { test, expect } from '../core/test';
import { shopData } from '../core/config';
import { usdToCents } from '../ui/catalog-page';

test('E2E-01 Вход и покупка инструмента до созданного заказа', async ({ pages, account, log }, testInfo) => {
  const data = shopData.product;
  await allure.feature('Покупка инструмента');
  await allure.severity('critical');
  await allure.parameter('Товар', data.name);
  await allure.parameter('Количество', String(data.quantity));
  await allure.parameter('Оплата', shopData.paymentMethod);

  await test.step('Войти и подтвердить владельца аккаунта', async () => {
    log.info('Начало сквозного сценария, авторизация');
    await pages.login.open();
    await pages.login.signIn(account.email, account.password);
    await pages.login.waitForAccount();
    await pages.account.openProfile();
    await expect.poll(() => pages.account.emailMatches(account.email)).toBe(true);
  });

  await test.step('Проверить сортировку видимой страницы по возрастанию цены', async () => {
    log.info('Проверка порядка текущих цен в каталоге');
    await pages.catalog.open();
    await pages.catalog.sortByAscendingPrice();
    const prices = await pages.catalog.prices();
    expect(prices.length).toBeGreaterThan(1);
    expect(new Set(prices).size).toBeGreaterThan(1);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  await test.step('Найти ожидаемую модель по названию', async () => {
    log.info('Поиск и проверка соответствия выдачи запросу');
    await pages.catalog.search(data.query);
    const names = await pages.catalog.names();
    expect(names.length).toBeGreaterThan(0);
    expect(names.every(name => name.toLowerCase().includes(data.query.toLowerCase()))).toBe(true);
    expect(names).toContain(data.name);
    await expect(pages.catalog.card(data.name)).toHaveCount(1);
    expect(await pages.catalog.cardPrice(data.name)).toBe(Math.round(data.unitPrice * 100));
  });

  await test.step('Сверить модель, категорию, описание, цену и доступность покупки', async () => {
    log.info('Проверка данных карточки товара');
    await pages.catalog.openProduct(data.name);
    await pages.product.checkCaptcha();
    await expect(pages.product.name.locator).toContainText(data.name);
    await expect(pages.product.category).toHaveText(data.category);
    await expect(pages.product.description.locator).not.toHaveText('');
    await expect(pages.product.price.locator).toHaveText(data.unitPrice.toFixed(2));
    await expect(pages.product.addButton.locator).toBeEnabled();
    await pages.product.add(1);
    await expect(pages.product.cartQuantity.locator).toHaveText('1');
  });

  await test.step('Сверить товар в корзине и пересчёт при изменении количества', async () => {
    log.info('Проверка количества, цены, суммы строки и итога корзины');
    await pages.checkout.openCart();
    await expect(pages.checkout.productName.locator).toHaveText(data.name);
    await expect(pages.checkout.quantity.locator).toHaveValue('1');
    expect(usdToCents(await pages.checkout.unitPrice.locator.innerText())).toBe(Math.round(data.unitPrice * 100));
    await pages.checkout.quantity.fill(String(data.quantity));
    await expect.poll(async () => usdToCents(await pages.checkout.linePrice.locator.innerText())).toBe(Math.round(data.subtotal * 100));
    await expect.poll(async () => usdToCents(await pages.checkout.total.locator.innerText())).toBe(Math.round(data.total * 100));
    await expect(pages.checkout.quantity.locator).toHaveValue(String(data.quantity));
  });

  await test.step('Указать обязательные данные адреса и способ оплаты', async () => {
    log.info('Заполнение адреса и проверка выбранного способа оплаты');
    await pages.checkout.proceedToAddress();
    await pages.checkout.fillAddress(account);
    await pages.checkout.checkCaptcha();
    await pages.checkout.checkPayment(shopData.paymentMethod);
    await expect(pages.checkout.paymentSuccess.locator).toHaveText('Payment was successful');
  });

  let number = '';
  await test.step('Отправить форму и получить номер созданного заказа', async () => {
    log.info('Подтверждение учебного заказа');
    number = await pages.checkout.confirmOrder();
    expect(number).toMatch(/^INV-\d+$/);
    await expect(pages.checkout.confirmation).toContainText('Thanks for your order!');
    await allure.parameter('Номер созданного счёта', number);
    log.info(`Создан учебный заказ ${number}`);
  });

  await test.step('Сверить сохранённый заказ в личном кабинете', async () => {
    log.info('Проверка сохранённых состава, количества, адреса, оплаты и итоговой суммы');
    await pages.invoices.openInvoice(number);
    await expect(pages.invoices.number.locator).toHaveValue(number);
    await expect(pages.invoices.productRows).toHaveCount(1);
    const cells = await pages.invoices.productCells(data.name);
    expect(cells[0]).toBe(String(data.quantity));
    expect(cells[1]).toContain(data.name);
    expect(usdToCents(cells[2])).toBe(Math.round(data.unitPrice * 100));
    expect(usdToCents(cells[3])).toBe(Math.round(data.subtotal * 100));
    expect(usdToCents(await pages.invoices.total.inputValue())).toBe(Math.round(data.total * 100));
    await expect.poll(() => pages.invoices.addressMatches(account)).toBe(true);
    await expect(pages.invoices.paymentMethod.locator).toHaveValue('Cash on Delivery');
    await testInfo.attach('Товары в созданном заказе', { body: await pages.invoices.screenshotProducts(), contentType: 'image/png' });
  });
});
