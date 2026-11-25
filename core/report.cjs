const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

process.chdir(path.resolve(__dirname, '..'));
if (fs.existsSync('.env')) process.loadEnvFile('.env');
const packageInfo = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const results = fs.readdirSync('allure-results').filter(file => file.endsWith('-result.json'))
  .map(file => JSON.parse(fs.readFileSync(path.join('allure-results', file), 'utf8')));
const browsers = [...new Set(results.flatMap(result => result.parameters
  .filter(parameter => parameter.name === 'Браузер').map(parameter => parameter.value)))];
const environment = {
  Stand: new URL(process.env.BASE_URL || 'https://practicesoftwaretesting.com').origin,
  Node: process.version,
  Playwright: packageInfo.devDependencies['@playwright/test'],
  TypeScript: packageInfo.devDependencies.typescript,
  Pino: packageInfo.devDependencies.pino,
  AllurePlaywright: packageInfo.devDependencies['allure-playwright'],
  AllureCLI: packageInfo.devDependencies['allure-commandline'],
  Browsers: browsers.join(', '),
};
fs.writeFileSync('allure-results/environment.properties', Object.entries(environment)
  .map(([key, value]) => `${key}=${value}`).join('\n') + '\n');
const single = process.argv.includes('--single');
const args = ['node_modules/allure-commandline/bin/allure', 'generate', 'allure-results', '--clean'];
if (single) args.push('--single-file');
args.push('-o', single ? 'report-single' : 'allure-report');
const run = spawnSync(process.execPath, args, { stdio: 'inherit' });
process.exit(run.status ?? 1);
