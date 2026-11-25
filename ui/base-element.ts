import type { Locator } from '@playwright/test';
import type { Logger } from '../core/logger';

export class BaseElement {
  constructor(readonly locator: Locator, private readonly label: string, private readonly log: Logger) {}

  async click() {
    this.log.debug(`Нажатие элемента «${this.label}»`);
    await this.locator.click();
  }

  async fill(value: string) {
    this.log.debug(`Заполнение поля «${this.label}»`);
    await this.locator.fill(value);
    await this.locator.blur();
  }

  async select(value: string) {
    this.log.debug(`Выбор значения в поле «${this.label}»`);
    await this.locator.selectOption(value);
  }

  async waitVisible() {
    this.log.debug(`Ожидание элемента «${this.label}»`);
    await this.locator.waitFor({ state: 'visible' });
  }
}
