/**
 * Logger utility for consistent CLI output with level-based filtering
 */

import type { LogLevel } from '../../types/index.d.ts';

// Simple ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
} as const;

type ColorName = keyof typeof colors;

let currentLevel: LogLevel = 'info';

/**
 * Log level priority (lower = more silent)
 */
const LEVEL_PRIORITY: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  verbose: 4,
  debug: 5
};

/**
 * Format a message with color
 */
function colorize(text: string, color: ColorName): string {
  return `${colors[color]}${text}${colors.reset}`;
}

/**
 * Check if a message at the given level should be shown
 */
function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] <= LEVEL_PRIORITY[currentLevel];
}

export const logger = {
  /**
   * Set the current log level
   */
  setLevel(level: LogLevel): void {
    if (LEVEL_PRIORITY[level] !== undefined) {
      currentLevel = level;
    }
  },

  /**
   * Get the current log level
   */
  getLevel(): LogLevel {
    return currentLevel;
  },

  /**
   * Info message
   */
  info(message: string): void {
    if (!shouldLog('info')) return;
    console.log(`${colorize('[apexcss]', 'cyan')} ${message}`);
  },

  /**
   * Success message
   */
  success(message: string): void {
    if (!shouldLog('info')) return;
    console.log(`${colorize('[apexcss]', 'green')} ${colorize('✔', 'green')} ${message}`);
  },

  /**
   * Warning message
   */
  warn(message: string): void {
    if (!shouldLog('warn')) return;
    console.warn(`${colorize('[apexcss]', 'yellow')} ${colorize('⚠', 'yellow')} ${message}`);
  },

  /**
   * Error message
   */
  error(message: string): void {
    if (!shouldLog('error')) return;
    console.error(`${colorize('[apexcss]', 'red')} ${colorize('✖', 'red')} ${message}`);
  },

  /**
   * Verbose message (only shown with verbose level)
   */
  verbose(message: string): void {
    if (!shouldLog('verbose')) return;
    console.log(`${colorize('[apexcss]', 'blue')} ${colorize('[verbose]', 'dim')} ${message}`);
  },

  /**
   * Debug message (only shown with DEBUG env var or debug level)
   */
  debug(message: string): void {
    if (!shouldLog('debug') && !process.env.DEBUG) return;
    console.log(`${colorize('[apexcss]', 'dim')} ${colorize('[debug]', 'magenta')} ${message}`);
  },

  /**
   * New line
   */
  newline(): void {
    if (currentLevel === 'silent') return;
    console.log();
  },

  /**
   * Section header
   */
  header(title: string): void {
    if (!shouldLog('info')) return;
    this.newline();
    console.log(colorize(title, 'bright'));
    console.log(colorize('═'.repeat(title.length), 'dim'));
  },

  /**
   * List items
   */
  list(items: string[]): void {
    if (!shouldLog('info')) return;
    items.forEach(item => {
      console.log(`  ${colorize('•', 'cyan')} ${item}`);
    });
  },

  /**
   * Format file path
   */
  path(filepath: string): string {
    return colorize(filepath, 'cyan');
  },

  /**
   * Format command
   */
  cmd(command: string): string {
    return colorize(command, 'yellow');
  }
};
