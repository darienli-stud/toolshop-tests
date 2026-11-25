const { spawnSync } = require('node:child_process');
const { rmSync } = require('node:fs');
const { randomUUID } = require('node:crypto');
const path = require('node:path');

process.chdir(path.resolve(__dirname, '..'));
rmSync('allure-results', { recursive: true, force: true });
const cli = require.resolve('@playwright/test/cli');
const result = spawnSync(process.execPath, [cli, 'test', ...process.argv.slice(2)], {
  stdio: 'inherit', env: { ...process.env, RUN_ID: randomUUID() },
});
process.exit(result.status ?? 1);
