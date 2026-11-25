import pino from 'pino';
import { config } from './config';
import { sanitize } from './privacy';

export type Logger = Pick<pino.Logger, 'debug' | 'info' | 'warn' | 'error'>;

export function createLogger() {
  const lines: string[] = [];
  const log = pino({
    level: config.logLevel,
    base: undefined,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: { level: label => ({ level: label.toUpperCase() }) },
    redact: { paths: ['password', 'email', 'phone', 'token', 'cookies'], censor: '[REDACTED]' },
  }, { write: message => { lines.push(sanitize(message)); } });
  return { log, text: () => lines.map(sanitize).join('') };
}
