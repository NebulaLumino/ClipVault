import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, Logger, LogLevel } from '../../../src/utils/logger.js';

describe('Logger', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn<typeof console, 'log'>>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn<typeof console, 'warn'>>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn<typeof console, 'error'>>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Log levels', () => {
    it('should log info messages', () => {
      logger.info('Test message');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log warn messages', () => {
      logger.warn('Test warning');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      logger.error('Test error');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    // Note: debug and trace are filtered at 'info' log level, so they won't log by default
  });

  describe('Log level filtering', () => {
    it('should filter logs below current level', () => {
      // Create a logger with warn level
      const warnLogger = new (logger.constructor as { new(level?: LogLevel): Logger })('warn');
      
      // Clear previous mocks
      consoleSpy.mockClear();
      consoleWarnSpy.mockClear();
      
      warnLogger.info('This should not log');
      warnLogger.warn('This should log');
      
      expect(consoleSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('ConsoleLogger class', () => {
    it('should create logger with default level', () => {
      const testLogger = new (logger.constructor as { new(): Logger })();
      expect(testLogger).toBeDefined();
    });

    it('should create logger with custom level', () => {
      const testLogger = new (logger.constructor as { new(level?: LogLevel): Logger })('debug');
      expect(testLogger).toBeDefined();
    });
  });
});
