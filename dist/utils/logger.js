const LOG_LEVELS = {
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
    fatal: 5,
};
class ConsoleLogger {
    level;
    constructor(level = 'info') {
        this.level = level;
    }
    log(level, message, meta) {
        if (LOG_LEVELS[level] < LOG_LEVELS[this.level])
            return;
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
    trace(message, meta) {
        this.log('trace', message, meta);
    }
    debug(message, meta) {
        this.log('debug', message, meta);
    }
    info(message, meta) {
        this.log('info', message, meta);
    }
    warn(message, meta) {
        this.log('warn', message, meta);
    }
    error(message, meta) {
        this.log('error', message, meta);
    }
    fatal(message, meta) {
        this.log('fatal', message, meta);
    }
}
export const logger = new ConsoleLogger(process.env.LOG_LEVEL || 'info');
//# sourceMappingURL=logger.js.map