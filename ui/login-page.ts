import { BasePage } from './base-page';

export class LoginPage extends BasePage {
  get email() { return this.control('email', 'Email'); }
  get password() { return this.control('password', 'Пароль'); }
  get submit() { return this.control('login-submit', 'Войти'); }

  error(kind: 'email' | 'password' | 'login') {
    return this.page.locator(`[data-test="${kind}-error"]`);
  }

  async open() {
    await this.navigate('/auth/login');
    await this.submit.waitVisible();
    await this.checkCaptcha();
  }

  async signIn(email: string, password: string) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }

  async waitForAccount() {
    await this.page.waitForURL('**/account');
    await this.page.locator('[data-test="page-title"]').waitFor();
  }
}
