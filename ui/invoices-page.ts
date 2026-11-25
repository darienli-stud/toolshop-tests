import { BasePage } from './base-page';

export class InvoicesPage extends BasePage {
  get number() { return this.control('invoice-number'); }
  get total() { return this.page.locator('#total'); }
  get paymentMethod() { return this.control('payment-method'); }
  get productRows() { return this.page.locator('table tbody tr'); }

  async openInvoice(number: string) {
    await this.navigate('/account/invoices');
    await this.page.locator('tr').filter({ hasText: number }).locator('a').click();
    await this.number.waitVisible();
    await this.checkCaptcha();
  }

  productRow(name: string) {
    return this.productRows.filter({ hasText: name });
  }

  async productCells(name: string) {
    return (await this.productRow(name).locator('td').allTextContents()).map(text => text.trim());
  }

  async addressMatches(address: { street: string; city: string; state: string; country: string; postalCode: string }) {
    const expected = { street: address.street, city: address.city, state: address.state, country: address.country, postal_code: address.postalCode };
    const actual = await this.page.locator('[data-test="street"], [data-test="city"], [data-test="state"], [data-test="country"], [data-test="postal_code"]').evaluateAll(elements =>
      Object.fromEntries(elements.map(element => [(element as HTMLInputElement).getAttribute('data-test'), (element as HTMLInputElement).value])));
    return Object.entries(expected).every(([key, value]) => actual[key] === value);
  }

  async screenshotProducts() { return this.page.locator('table').screenshot(); }
}
