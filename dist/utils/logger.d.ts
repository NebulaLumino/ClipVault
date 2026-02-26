type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
interface Logger {
    trace(message: string, meta?: Record<string, unknown>): void;
    debug(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
    fatal(message: string, meta?: Record<string, unknown>): void;
}
declare class ConsoleLogger implements Logger {
    private level;
    constructor(level?: LogLevel);
    private log;
    trace(message: string, meta?: Record<string, unknown>): void;
    debug(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
    fatal(message: string, meta?: Record<string, unknown>): void;
}
export declare const logger: ConsoleLogger;
export type { Logger, LogLevel };
//# sourceMappingURL=logger.d.ts.map