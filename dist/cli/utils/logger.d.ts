/**
 * Logger utility for consistent CLI output with level-based filtering
 */
import type { LogLevel } from '../../types/index.d.js';
export declare const logger: {
    /**
     * Set the current log level
     */
    setLevel(level: LogLevel): void;
    /**
     * Get the current log level
     */
    getLevel(): LogLevel;
    /**
     * Info message
     */
    info(message: string): void;
    /**
     * Success message
     */
    success(message: string): void;
    /**
     * Warning message
     */
    warn(message: string): void;
    /**
     * Error message
     */
    error(message: string): void;
    /**
     * Verbose message (only shown with verbose level)
     */
    verbose(message: string): void;
    /**
     * Debug message (only shown with DEBUG env var or debug level)
     */
    debug(message: string): void;
    /**
     * New line
     */
    newline(): void;
    /**
     * Section header
     */
    header(title: string): void;
    /**
     * List items
     */
    list(items: string[]): void;
    /**
     * Format file path
     */
    path(filepath: string): string;
    /**
     * Format command
     */
    cmd(command: string): string;
};
//# sourceMappingURL=logger.d.ts.map