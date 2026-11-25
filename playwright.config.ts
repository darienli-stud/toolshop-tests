import { defineConfig, devices } from '@playwright/test';
import { config } from './core/config';

export default defineConfig({
  testDir: './autotest',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  workers: config.workers,
  timeout: config.testTimeout,
  expect: { timeout: config.expectTimeout },
  retries: 0,
  reporter: [
    ['./core/privacy-reporter.ts'],
    ['list'],
    ['allure-playwright', { resultsDir: 'allure-results', detail: false }],
  ],
  use: {
    baseURL: config.baseURL,
    locale: 'en-US',
    actionTimeout: config.actionTimeout,
    navigationTimeout: config.navigationTimeout,
    trace: 'off',
    video: 'off',
    screenshot: 'off',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', testIgnore: '**/auth.spec.ts', use: { ...devices['Desktop Firefox'] } },
  ].filter(project => config.browser === 'all' || project.name === config.browser),
});
