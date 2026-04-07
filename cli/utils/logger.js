/**
 * Logger utility for consistent CLI output
 */

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
};

/**
 * Format a message with color
 * @param text
 * @param color
 */
function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

export const logger = {
  /**
   * Info message
   * @param message
   */
  info(message) {
    console.log(`${colorize('[apexcss]', 'cyan')} ${message}`);
  },

  /**
   * Success message
   * @param message
   */
  success(message) {
    console.log(`${colorize('[apexcss]', 'green')} ${colorize('✔', 'green')} ${message}`);
  },

  /**
   * Warning message
   * @param message
   */
  warn(message) {
    console.warn(`${colorize('[apexcss]', 'yellow')} ${colorize('⚠', 'yellow')} ${message}`);
  },

  /**
   * Error message
   * @param message
   */
  error(message) {
    console.error(`${colorize('[apexcss]', 'red')} ${colorize('✖', 'red')} ${message}`);
  },

  /**
   * Debug message (only shown with DEBUG env var)
   * @param message
   */
  debug(message) {
    if (process.env.DEBUG) {
      console.log(`${colorize('[apexcss]', 'dim')} ${colorize('[debug]', 'magenta')} ${message}`);
    }
  },

  /**
   * New line
   */
  newline() {
    console.log();
  },

  /**
   * Section header
   * @param title
   */
  header(title) {
    this.newline();
    console.log(colorize(title, 'bright'));
    console.log(colorize('═'.repeat(title.length), 'dim'));
  },

  /**
   * List items
   * @param items
   */
  list(items) {
    items.forEach(item => {
      console.log(`  ${colorize('•', 'cyan')} ${item}`);
    });
  },

  /**
   * Format file path
   * @param filepath
   */
  path(filepath) {
    return colorize(filepath, 'cyan');
  },

  /**
   * Format command
   * @param command
   */
  cmd(command) {
    return colorize(command, 'yellow');
  }
};
