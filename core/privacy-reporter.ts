import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs';
import path from 'node:path';
import type { Reporter, TestCase, TestError, TestResult, TestStep } from '@playwright/test/reporter';
import { config } from './config';
import { sanitize, readSecrets } from './privacy';

function cleanError(error?: TestError) {
  if (!error) return;
  if (error.message) error.message = sanitize(error.message);
  if (error.stack) error.stack = sanitize(error.stack);
  if (error.value) error.value = sanitize(error.value);
  if (error.snippet) error.snippet = sanitize(error.snippet);
  if (error.cause) cleanError(error.cause);
}

function cleanAttachments(attachments: TestResult['attachments']) {
  for (const item of attachments) {
    if (!/text|json|xml/.test(item.contentType)) continue;
    if (item.body) item.body = Buffer.from(sanitize(item.body.toString('utf8')));
    if (item.path && existsSync(item.path)) writeFileSync(item.path, sanitize(readFileSync(item.path, 'utf8')));
  }
}

export default class PrivacyReporter implements Reporter {
  onStepBegin(_test: TestCase, _result: TestResult, step: TestStep) {
    step.title = sanitize(step.title);
  }

  onStepEnd(_test: TestCase, _result: TestResult, step: TestStep) {
    step.title = sanitize(step.title);
    cleanError(step.error);
    cleanAttachments(step.attachments);
  }

  onTestEnd(_test: TestCase, result: TestResult) {
    result.errors.forEach(cleanError);
    cleanError(result.error);
    cleanAttachments(result.attachments);
  }

  onError(error: TestError) { cleanError(error); }

  async onExit() {
    let checkedFiles = 0;
    const secrets = readSecrets();
    const checked: string[] = [];
    function visit(directory: string) {
      if (!existsSync(directory)) return;
      for (const name of readdirSync(directory)) {
        const file = path.join(directory, name);
        if (statSync(file).isDirectory()) visit(file);
        else if (/\.(json|txt|md|html|xml|csv)$/.test(name)) {
          writeFileSync(file, sanitize(readFileSync(file, 'utf8')));
          checkedFiles++;
          checked.push(file);
        }
      }
    }
    const resultsDir = process.env.DIAGNOSTIC_RUN ? 'allure-diagnostics' : 'allure-results';
    visit(resultsDir);
    visit(process.env.DIAGNOSTIC_RUN ? 'diagnostic-results' : 'test-results');
    const remainingMatches = checked.filter(file => secrets.some(secret => readFileSync(file, 'utf8').includes(secret))).length;
    mkdirSync(resultsDir, { recursive: true });
    writeFileSync(path.join(resultsDir, 'privacy-audit.json'), JSON.stringify({
      checkedFiles, protectedValues: secrets.length, textArtifactsSanitized: true,
      screenshotsMaskedByFixture: true, remainingMatches,
    }, null, 2));
    if (existsSync(config.privateDir)) {
      for (const name of readdirSync(config.privateDir)) unlinkSync(path.join(config.privateDir, name));
      rmdirSync(config.privateDir);
    }
    if (remainingMatches > 0) throw new Error('Обнаружены необезличенные значения в артефактах');
  }
}
