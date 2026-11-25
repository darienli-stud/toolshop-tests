import { BasePage } from './base-page';

export class ProductPage extends BasePage {
  get name() { return this.control('product-name'); }
  get price() { return this.control('unit-price'); }
  get description() { return this.control('product-description'); }
  get category() { return this.page.locator('[aria-label="category"]'); }
  get addButton() { return this.control('add-to-cart'); }
  get cartQuantity() { return this.control('cart-quantity'); }

  async add(quantity: number) {
    await this.control('quantity').fill(String(quantity));
    await this.addButton.click();
  }
}
