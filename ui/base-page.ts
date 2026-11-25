import type { Page } from '@playwright/test';
import type { Logger } from '../core/logger';
import { BaseElement } from './base-element';

export class BasePage {
  constructor(protected readonly page: Page, protected readonly log: Logger) {}

  protected control(id: string, label = id) {
    return new BaseElement(this.page.locator(`[data-test="${id}"]:visible`), label, this.log);
  }

  protected async navigate(route: string) {
    this.log.debug(`Открытие страницы ${route}`);
    await this.page.goto(route, { waitUntil: 'domcontentloaded' });
  }

  async checkCaptcha() {
    const count = await this.page.locator(
      'script[src*="captcha" i], iframe[src*="captcha" i], script[src*="turnstile" i], input[name*="captcha" i]',
    ).count();
    if (count > 0) throw new Error('Обнаружена CAPTCHA. Требуется пересмотреть выбор среды по разделу 01 ТЗ');
    this.log.debug('Компоненты CAPTCHA на текущей странице отсутствуют');
  }
}
