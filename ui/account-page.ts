import { BasePage } from './base-page';

export class AccountPage extends BasePage {
  async openProfile() {
    await this.navigate('/account/profile');
    await this.control('email').waitVisible();
  }

  async emailMatches(expected: string) {
    return (await this.control('email').locator.inputValue()).toLowerCase() === expected.toLowerCase();
  }

  async visitProtectedPage() {
    await this.navigate('/account');
  }
}
