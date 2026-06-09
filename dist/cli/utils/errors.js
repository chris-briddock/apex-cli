/**
 * Centralized error handler with contextual suggestions
 */
import { logger } from './logger.js';
const ERROR_PATTERNS = [
    {
        pattern: /config file not found|cannot find module.*config/i,
        message: 'Config file not found',
        suggestion: 'Run "npx apexcss init" to create a config file'
    },
    {
        pattern: /could not find apexcss source files|apexcss is not installed/i,
        message: 'ApexCSS source files not found',
        suggestion: 'Install the core framework: npm install apexcss'
    },
    {
        pattern: /invalid layer\(s\)/i,
        message: 'Invalid layer specified',
        suggestion: 'Valid layers: base, utilities, themes, all'
    },
    {
        pattern: /sass compilation error|error compiling sass/i,
        message: 'Sass compilation failed',
        suggestion: 'Check your SCSS syntax and ensure all imports resolve correctly'
    },
    {
        pattern: /no source directories found/i,
        message: 'No source directories found',
        suggestion: 'Specify directories with: --src=./src,./components'
    },
    {
        pattern: /unknown command/i,
        message: 'Unknown command',
        suggestion: 'Run "apexcss --help" for available commands'
    },
    {
        pattern: /package\.json not found/i,
        message: 'No package.json found',
        suggestion: 'Run "npm init" to create a project'
    },
    {
        pattern: /entry file not found/i,
        message: 'Framework entry file not found',
        suggestion: 'Manually add the CSS import to your main entry file'
    }
];
/**
 * Find a matching error pattern
 */
function findErrorPattern(errorMessage) {
    for (const pattern of ERROR_PATTERNS) {
        if (pattern.pattern.test(errorMessage)) {
            return { message: pattern.message, suggestion: pattern.suggestion };
        }
    }
    return undefined;
}
/**
 * Format an error with context and suggestions
 */
export function formatError(error, showDebug = false) {
    const errorMessage = error.message || String(error);
    const pattern = findErrorPattern(errorMessage);
    let output = '';
    if (pattern) {
        output += `${pattern.message}\n`;
        output += `  ${logger.path('→')} ${pattern.suggestion}`;
    }
    else {
        output += errorMessage;
    }
    if (showDebug && error.stack) {
        output += `\n\n${logger.path('Stack trace:')}\n${error.stack}`;
    }
    return output;
}
/**
 * Handle an error with contextual output and exit
 */
export function handleError(error, showDebug = false) {
    const formatted = formatError(error, showDebug);
    logger.error(formatted);
    process.exit(1);
}
//# sourceMappingURL=errors.js.map