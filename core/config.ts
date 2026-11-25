import { existsSync, readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import type { ShopData } from './models';

if (existsSync('.env')) process.loadEnvFile('.env');
process.env.RUN_ID ||= randomUUID();

function positiveNumber(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value <= 0) throw new Error(`Проверьте положительное целое значение ${name}`);
  return value;
}

const browser = process.env.BROWSER ?? 'all';
if (!['all', 'chromium', 'firefox'].includes(browser)) throw new Error('BROWSER должен быть all, chromium или firefox');
const accountSource = process.env.TEST_ACCOUNT_SOURCE ?? 'generated';
if (!['generated', 'env'].includes(accountSource)) throw new Error('TEST_ACCOUNT_SOURCE должен быть generated или env');

export const config = {
  baseURL: process.env.BASE_URL ?? 'https://practicesoftwaretesting.com',
  browser,
  workers: positiveNumber('WORKERS', 2),
  testTimeout: positiveNumber('TEST_TIMEOUT_MS', 120_000),
  actionTimeout: positiveNumber('ACTION_TIMEOUT_MS', 20_000),
  navigationTimeout: positiveNumber('NAVIGATION_TIMEOUT_MS', 30_000),
  expectTimeout: positiveNumber('EXPECT_TIMEOUT_MS', 15_000),
  logLevel: (process.env.LOG_LEVEL ?? 'info').toLowerCase(),
  accountSource,
  privateDir: path.resolve('.private', process.env.RUN_ID.replace(/[^a-zA-Z0-9_-]/g, '')),
};

new URL(config.baseURL);
if (!['debug', 'info', 'warn', 'error'].includes(config.logLevel)) throw new Error('LOG_LEVEL должен быть debug, info, warn или error');

export const shopData: ShopData = JSON.parse(readFileSync(process.env.TEST_DATA_FILE ?? 'autotest/data/shop.json', 'utf8'));
if (!shopData.product?.name || !Number.isInteger(shopData.product.quantity) || shopData.product.quantity < 1 ||
    !Number.isFinite(shopData.product.unitPrice) || !shopData.customer?.country || !shopData.paymentMethod) {
  throw new Error('Проверьте товар, количество, цену, страну и оплату в TEST_DATA_FILE');
}
