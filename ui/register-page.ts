import type { Account } from '../core/models';
import { BasePage } from './base-page';
import { AddressForm } from './address-form';

export class RegisterPage extends BasePage {
  async register(account: Account) {
    await this.navigate('/auth/register');
    await this.control('first-name').waitVisible();
    await this.checkCaptcha();
    await this.control('first-name').fill(account.firstName);
    await this.control('last-name').fill(account.lastName);
    await this.control('dob').fill(account.dob);
    await new AddressForm(this.page, this.log).fill(account);
    await this.control('phone').fill(account.phone);
    await this.control('email').fill(account.email);
    await this.control('password').fill(account.password);
    await this.control('register-submit').click();
    await this.page.waitForURL('**/auth/login');
    await this.control('login-submit').waitVisible();
  }
}
