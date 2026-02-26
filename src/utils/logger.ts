type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface Logger {
  trace(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  fatal(message: string, meta?: Record<string, unknown>): void;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5,
};

class ConsoleLogger implements Logger {
  private level: LogLevel;

  constructor(level: LogLevel = 'info') {
    this.level = level;
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.level]) return;

    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'trace':
      case 'debug':
        console.log(`${prefix} ${message}${metaStr}`);
        break;
      case 'info':
        console.log(`${prefix} ${message}${metaStr}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}${metaStr}`);
        break;
      case 'error':
      case 'fatal':
        console.error(`${prefix} ${message}${metaStr}`);
        break;
    }
  }

  trace(message: string, meta?: Record<string, unknown>): void {
    this.log('trace', message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log('error', message, meta);
  }

  fatal(message: string, meta?: Record<string, unknown>): void {
    this.log('fatal', message, meta);
  }
}

export const logger = new ConsoleLogger(
  (process.env.LOG_LEVEL as LogLevel) || 'info'
);

export type { Logger, LogLevel };
