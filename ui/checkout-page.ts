import type { CustomerData } from '../core/models';
import { BasePage } from './base-page';
import { AddressForm } from './address-form';

export class CheckoutPage extends BasePage {
  get productName() { return this.control('product-title'); }
  get quantity() { return this.control('product-quantity'); }
  get unitPrice() { return this.control('product-price'); }
  get linePrice() { return this.control('line-price'); }
  get total() { return this.control('cart-total'); }
  get paymentSuccess() { return this.control('payment-success-message'); }
  get confirmation() { return this.page.locator('#order-confirmation'); }

  async openCart() {
    await this.control('nav-cart').click();
    await this.productName.waitVisible();
    await this.checkCaptcha();
  }

  async proceedToAddress() {
    await this.control('proceed-1').click();
    await this.control('proceed-2').click();
    await this.control('country').waitVisible();
  }

  async fillAddress(address: CustomerData) {
    await new AddressForm(this.page, this.log).fill(address);
    await this.control('proceed-3').click();
    await this.control('payment-method').waitVisible();
  }

  async checkPayment(method: string) {
    await this.control('payment-method').select(method);
    await this.control('finish').click();
    await this.paymentSuccess.waitVisible();
  }

  async confirmOrder() {
    await this.control('finish').click();
    await this.confirmation.waitFor();
    const number = (await this.confirmation.innerText()).match(/INV-[\w-]+/)?.[0];
    if (!number) throw new Error('Сайт подтвердил оформление без номера счёта');
    return number;
  }
}
