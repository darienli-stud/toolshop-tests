import { expect, type Request } from '@playwright/test';
import { config } from '../core/config';
import type { CustomerData } from '../core/models';
import { BasePage } from './base-page';

export class AddressForm extends BasePage {
  async fill(address: CustomerData) {
    const pending = new Set<Request>();
    let lastActivity = Date.now();
    const started = (request: Request) => {
      if (new URL(request.url()).pathname.endsWith('/postcode-lookup')) {
        pending.add(request);
        lastActivity = Date.now();
      }
    };
    const finished = (request: Request) => {
      if (pending.delete(request)) lastActivity = Date.now();
    };
    this.page.on('request', started);
    this.page.on('requestfinished', finished);
    this.page.on('requestfailed', finished);
    try {
      await this.control('country').select(address.country);
      await this.control('postal_code').fill(address.postalCode);
      await this.control('house_number').fill(address.houseNumber);
      lastActivity = Date.now();
      this.log.debug('Ожидание окончания запросов автоподстановки адреса и их debounce');
      // Поля индекса и дома запускают отдельные запросы после debounce 300 мс.
      // Дожидаемся обоих ответов до ручного редактирования улицы и города.
      await expect.poll(() => pending.size === 0 && Date.now() - lastActivity >= 500, {
        timeout: config.actionTimeout,
        message: 'Ожидание завершения автоподстановки адреса',
        intervals: [100, 200],
      }).toBe(true);
      await this.control('street').fill(address.street);
      await this.control('city').fill(address.city);
      await this.control('state').fill(address.state);
    } finally {
      this.page.off('request', started);
      this.page.off('requestfinished', finished);
      this.page.off('requestfailed', finished);
    }
  }
}
