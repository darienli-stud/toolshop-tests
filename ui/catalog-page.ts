import { BasePage } from './base-page';

export function usdToCents(text: string) {
  const value = Number(text.replace(/[^\d.]/g, ''));
  if (!/\d/.test(text) || !Number.isFinite(value)) throw new Error('Цена товара имеет неверный формат');
  return Math.round(value * 100);
}

export class CatalogPage extends BasePage {
  get cards() { return this.page.locator('a.card'); }

  async open() {
    await this.navigate('/');
    await this.cards.first().waitFor();
    await this.checkCaptcha();
  }

  async search(query: string) {
    await this.control('search-query').fill(query);
    await this.control('search-submit').click();
    await this.page.locator('[data-test="search_completed"]').waitFor();
  }

  async sortByAscendingPrice() {
    await this.control('sort').select('price,asc');
    await this.page.locator('[data-test="sorting_completed"]').waitFor();
  }

  async names() {
    return (await this.cards.locator('[data-test="product-name"]').allTextContents()).map(value => value.trim());
  }

  async prices() {
    return (await this.cards.locator('[data-test="product-price"]').allTextContents()).map(usdToCents);
  }

  card(name: string) {
    return this.cards.filter({ has: this.page.locator('[data-test="product-name"]').filter({ hasText: name }) });
  }

  async openProduct(name: string) {
    const product = this.card(name);
    const href = await product.getAttribute('href');
    if (!href) throw new Error('У выбранного товара отсутствует ссылка на карточку');
    await product.click();
    await this.page.waitForURL(`**${href}`);
    await this.control('unit-price').waitVisible();
    return href;
  }

  async cardPrice(name: string) {
    return usdToCents(await this.card(name).locator('[data-test="product-price"]').innerText());
  }
}
