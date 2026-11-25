import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import main from '../playwright.config';

export default defineConfig({
  ...main,
  testDir: path.resolve(__dirname, '../diagnostics'),
  outputDir: path.resolve(__dirname, '../diagnostic-results'),
  workers: 1,
  reporter: [
    [path.resolve(__dirname, 'privacy-reporter.ts')],
    ['allure-playwright', { resultsDir: 'allure-diagnostics', detail: false }],
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
