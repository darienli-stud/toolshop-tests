const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const assert = require('node:assert/strict');

process.chdir(path.resolve(__dirname, '..'));
fs.rmSync('allure-diagnostics', { recursive: true, force: true });
const result = spawnSync(process.execPath, [require.resolve('@playwright/test/cli'), 'test', '-c', 'core/diagnostic.config.ts'], {
  encoding: 'utf8', env: { ...process.env, RUN_ID: randomUUID(), DIAGNOSTIC_RUN: '1' },
});
assert.equal(result.status, 1, 'Контролируемый тест должен завершиться падением');
const files = fs.readdirSync('allure-diagnostics');
const results = files.filter(file => file.endsWith('-result.json')).map(file =>
  JSON.parse(fs.readFileSync(path.join('allure-diagnostics', file), 'utf8')));
assert.equal(results.length, 1);
assert.equal(results[0].status, 'failed');
const message = results[0].statusDetails.message;
assert(message.includes('PRIVACY_CHECK'), 'Падение произошло до запланированной диагностической точки');
assert((message.match(/\[REDACTED\]/g) ?? []).length >= 4, 'Проверьте маскирование email, пароля, телефона и токена');
assert(files.some(file => file.endsWith('.png')), 'Нет скриншота при падении');
assert(files.some(file => file.endsWith('.txt')), 'Нет лога выполнения');
const audit = JSON.parse(fs.readFileSync('allure-diagnostics/privacy-audit.json', 'utf8'));
assert.equal(audit.remainingMatches, 0);
console.log('Диагностика пройдена: падение зарегистрировано, скриншот и лог приложены, чувствительные значения замаскированы.');
