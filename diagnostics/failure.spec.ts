import { randomBytes } from 'node:crypto';
import { test } from '../core/test';
import { registerSecrets } from '../core/privacy';

test('DIAG-01 Контролируемый сбой для проверки скриншота и маскирования', async ({ pages, account }) => {
  await pages.login.open();
  await pages.login.signIn(account.email, account.password);
  await pages.login.waitForAccount();
  await pages.account.openProfile();
  const token = randomBytes(30).toString('hex');
  registerSecrets([token]);
  throw new Error(`PRIVACY_CHECK ${account.email} ${account.password} ${account.phone} ${token}`);
});
