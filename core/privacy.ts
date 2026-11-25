import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { config } from './config';

export function registerSecrets(values: string[]) {
  mkdirSync(config.privateDir, { recursive: true, mode: 0o700 });
  const file = path.join(config.privateDir, `${process.pid}.json`);
  const previous: string[] = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
  const secrets = [...new Set([...previous, ...values].filter(value => value.length >= 4))];
  writeFileSync(file + '.tmp', JSON.stringify(secrets), { mode: 0o600 });
  renameSync(file + '.tmp', file);
}

export function readSecrets(): string[] {
  if (!existsSync(config.privateDir)) return [];
  return readdirSync(config.privateDir).filter(file => file.endsWith('.json')).flatMap(file =>
    JSON.parse(readFileSync(path.join(config.privateDir, file), 'utf8')) as string[]);
}

export function sanitize(text: string) {
  let result = text;
  for (const value of readSecrets().sort((a, b) => b.length - a.length)) result = result.replaceAll(value, '[REDACTED]');
  return result
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[EMAIL]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[TOKEN]')
    .replace(/((?:authorization|cookie|set-cookie):\s*)[^\r\n]+/gi, '$1[REDACTED]');
}
