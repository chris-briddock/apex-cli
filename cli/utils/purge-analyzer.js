/**
 * Purge Analyzer Utility
 * Scans project files and extracts CSS class names
 */

import { readdir, readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

/**
 * File extensions to scan for CSS classes
 */
export const SCAN_EXTENSIONS = new Set([
  '.html',
  '.htm',
  '.jsx',
  '.tsx',
  '.vue',
  '.svelte',
  '.astro',
  '.js',
  '.ts',
  '.mjs',
  '.cjs'
]);

/**
 * Directories to ignore during scanning
 */
export const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  'dist',
  'build',
  'out',
  'coverage',
  '.nyc_output',
  '.cache',
  '.parcel-cache',
  '.next',
  '.nuxt',
  '.output',
  'storybook-static',
  'public',
  'static',
  'assets'
]);

/**
 * Regex patterns for extracting class names
 */
const CLASS_PATTERNS = {
  // HTML class attribute: class="flex items-center"
  htmlClass: /class\s*=\s*"([^"]*)"/g,

  // HTML single quotes: class='flex items-center'
  htmlClassSingle: /class\s*=\s*'([^']*)'/g,

  // JSX className: className="flex items-center"
  jsxClassName: /className\s*=\s*"([^"]*)"/g,

  // JSX single quotes: className='flex items-center'
  jsxClassNameSingle: /className\s*=\s*'([^']*)'/g,

  // Vue/React template literals: class={`p-4 ${dynamic}`}
  templateLiteral: /className?\s*=\s*\{`([^`]*)`/g,

  // Vue dynamic class binding: :class="{ active: isActive }"
  vueDynamicClass: /:class\s*=\s*["']?\{([^}]*)\}/g,

  // Vue array syntax: :class="[activeClass, errorClass]"
  vueArrayClass: /:class\s*=\s*\[([^\]]*)\]/g,

  // Svelte class directive: class:active={isActive}
  svelteClassDirective: /class:(\w+)\s*=/g,

  // Alpine.js / Vue / React expressions in template strings
  templateExpression: /\{[^{}]*className?\s*:\s*["']([^"']*)["'][^}]*\}/g,

  // Astro class list
  astroClassList: /class:list\s*=\s*\[([^\]]*)\]/g
};

/**
 * Clean and validate a class name before adding
 * @param {string} cls - Raw class name
 * @returns {string|null} Cleaned class name or null if invalid
 */
function cleanClassName(cls) {
  // Remove template literal interpolation markers
  const cleanClass = cls.replaceAll(/\$\{[^}]*\}/g, '').trim();
  if (cleanClass && !cleanClass.includes('`') && !cleanClass.includes('{')) {
    return cleanClass;
  }
  return null;
}

/**
 * Add classes from a string to the set
 * @param {string} str - String containing class names
 * @param {Set<string>} classNames - Set to add classes to
 */
function addClasses(str, classNames) {
  if (!str) return;

  // Split by whitespace and filter out empty strings
  const classes = str
    .split(/\s+/)
    .map(c => c.trim())
    .filter(c => c.length > 0 && !c.includes('${') && !c.startsWith('{{') && !c.endsWith('}}'));

  for (const cls of classes) {
    const cleanClass = cleanClassName(cls);
    if (cleanClass) {
      classNames.add(cleanClass);
    }
  }
}

/**
 * Process a regex match based on pattern type
 * @param {string} name - Pattern name
 * @param {string} captured - Captured content
 * @param {Set<string>} classNames - Set to add classes to
 */
function processPatternMatch(name, captured, classNames) {
  if (!captured) return;

  // Handle object syntax (Vue/React): { active: true, 'text-red': false }
  if (name.includes('Dynamic') || captured.includes(':')) {
    // Extract keys from object notation
    const objectPattern = /([\w-]+)\s*:/g;
    let objMatch;
    while ((objMatch = objectPattern.exec(captured)) !== null) {
      addClasses(objMatch[1], classNames);
    }
  }

  // Handle array syntax
  if (name.includes('Array') || name.includes('List')) {
    // Remove quotes and split by comma
    const cleanContent = captured.replaceAll(/['"]/g, ' ');
    addClasses(cleanContent, classNames);
  }

  // Standard class string
  addClasses(captured, classNames);
}

/**
 * Extract class names from template literals
 * @param {string} content - File content
 * @param {Set<string>} classNames - Set to add classes to
 */
function extractFromTemplateLiterals(content, classNames) {
  const templateStringPattern = /`([^`]*)`/g;
  let templateMatch;

  while ((templateMatch = templateStringPattern.exec(content)) !== null) {
    const templateContent = templateMatch[1];
    // Look for class assignments within template literals
    const assignmentPattern = /class(?:Name)?\s*[=:]\s*["']([^"']+)["']/g;
    let assignment;
    while ((assignment = assignmentPattern.exec(templateContent)) !== null) {
      addClasses(assignment[1], classNames);
    }
  }
}

/**
 * Extract class names from a single content string using all patterns
 * @param {string} content - File content to analyze
 * @returns {Set<string>} Set of extracted class names
 */
export function extractClassNames(content) {
  const classNames = new Set();

  // Apply each pattern
  for (const [name, pattern] of Object.entries(CLASS_PATTERNS)) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);

    while ((match = regex.exec(content)) !== null) {
      processPatternMatch(name, match[1], classNames);
    }
  }

  // Additional pass: look for class names in template strings
  extractFromTemplateLiterals(content, classNames);

  return classNames;
}

/**
 * Check if a file should be scanned based on extension
 * @param {string} filePath - Path to the file
 * @returns {boolean}
 */
export function shouldScanFile(filePath) {
  const ext = extname(filePath).toLowerCase();
  return SCAN_EXTENSIONS.has(ext);
}

/**
 * Check if a directory should be ignored
 * @param {string} dirName - Directory name
 * @returns {boolean}
 */
export function shouldIgnoreDirectory(dirName) {
  return IGNORED_DIRECTORIES.has(dirName);
}

/**
 * Recursively get all scan-able files in a directory
 * @param {string} dirPath - Directory to scan
 * @param {string[]} [files] - Accumulated files
 * @returns {Promise<string[]>} Array of file paths
 */
export async function getFilesToScan(dirPath, files = []) {
  const resolvedPath = resolve(dirPath);

  try {
    const entries = await readdir(resolvedPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = resolve(resolvedPath, entry.name);

      if (entry.isDirectory()) {
        if (!shouldIgnoreDirectory(entry.name)) {
          await getFilesToScan(fullPath, files);
        }
      } else if (entry.isFile() && shouldScanFile(fullPath)) {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory might not exist or be accessible - silently skip
  }

  return files;
}

/**
 * Scan a single file and extract class names
 * @param {string} filePath - Path to the file
 * @returns {Promise<{file: string, classes: Set<string>, error?: string}>}
 */
export async function scanFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    const classes = extractClassNames(content);

    return {
      file: filePath,
      classes
    };
  } catch (error) {
    return {
      file: filePath,
      classes: new Set(),
      error: error.message
    };
  }
}

/**
 * Scan multiple directories and extract all class names
 * @param {string[]} directories - Directories to scan
 * @param {object} options - Scan options
 * @param {Function} [options.onProgress] - Progress callback (fileCount, currentFile)
 * @returns {Promise<{classes: Set<string>, files: number, errors: string[]}>}
 */
/**
 * Collect all files to scan from multiple directories
 * @param {string[]} directories - Directories to scan
 * @returns {Promise<string[]>} Array of file paths
 */
async function collectFilesToScan(directories) {
  const filesToScan = [];
  for (const dir of directories) {
    const files = await getFilesToScan(dir);
    filesToScan.push(...files);
  }
  return filesToScan;
}

/**
 * Process scan results and update class set
 * @param {object} result - Scan result
 * @param {Set<string>} allClasses - Set to add classes to
 * @param {string[]} errors - Array to add errors to
 * @param {string} filePath - Path to the scanned file
 */
function processScanResult(result, allClasses, errors, filePath) {
  if (result.error) {
    errors.push(`${filePath}: ${result.error}`);
    return;
  }

  for (const cls of result.classes) {
    allClasses.add(cls);
  }
}

/**
 * Scan multiple directories and extract all class names
 * @param {string[]} directories - Directories to scan
 * @param {object} options - Scan options
 * @param {Function} [options.onProgress] - Progress callback (fileCount, currentFile)
 * @returns {Promise<{classes: Set<string>, files: number, errors: string[]}>}
 */
export async function scanDirectories(directories, options = {}) {
  const allClasses = new Set();
  const errors = [];

  // Collect all files to scan
  const filesToScan = await collectFilesToScan(directories);

  // Scan each file
  let scannedCount = 0;
  for (const filePath of filesToScan) {
    if (options.onProgress) {
      options.onProgress(filesToScan.length, scannedCount, filePath);
    }

    const result = await scanFile(filePath);
    scannedCount++;
    processScanResult(result, allClasses, errors, filePath);
  }

  return {
    classes: allClasses,
    files: filesToScan.length,
    errors
  };
}

/**
 * Extract modifier statistics from a class name
 * @param {string} cls - Class name
 * @returns {object} Modifier counts
 */
function extractModifierStats(cls) {
  if (!cls.includes(':')) {
    return null;
  }

  const responsivePrefixes = ['sm:', 'md:', 'lg:', 'xl:', '2xl:'];

  return {
    hasModifier: true,
    isDarkMode: cls.startsWith('dark:'),
    isHover: cls.startsWith('hover:'),
    isFocus: cls.startsWith('focus:'),
    isResponsive: responsivePrefixes.some(prefix => cls.includes(prefix))
  };
}

/**
 * Get the prefix from a class name
 * @param {string} cls - Class name
 * @returns {string|null} Prefix or null
 */
function getClassPrefix(cls) {
  return cls.split('-')[0] || null;
}

/**
 * Get top prefixes from a prefix count map
 * @param {Map<string, number>} prefixMap - Map of prefixes to counts
 * @param {number} limit - Maximum number of results
 * @returns {Array<[string, number]>} Sorted array of [prefix, count]
 */
function getTopPrefixes(prefixMap, limit) {
  return Array.from(prefixMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

/**
 * Get statistics about detected classes
 * @param {Set<string>} classes - Set of class names
 * @returns {object} Statistics object
 */
export function getClassStatistics(classes) {
  const stats = {
    total: classes.size,
    withModifiers: 0,
    responsive: 0,
    darkMode: 0,
    hover: 0,
    focus: 0,
    byPrefix: new Map()
  };

  for (const cls of classes) {
    const modifierStats = extractModifierStats(cls);
    if (modifierStats) {
      stats.withModifiers++;
      const statMappings = [
        ['isDarkMode', 'darkMode'],
        ['isHover', 'hover'],
        ['isFocus', 'focus'],
        ['isResponsive', 'responsive']
      ];
      for (const [conditionKey, statKey] of statMappings) {
        if (modifierStats[conditionKey]) {
          stats[statKey]++;
        }
      }
    }

    const prefix = getClassPrefix(cls);
    if (prefix) {
      stats.byPrefix.set(prefix, (stats.byPrefix.get(prefix) || 0) + 1);
    }
  }

  stats.topPrefixes = getTopPrefixes(stats.byPrefix, 10);

  return stats;
}

/**
 * Suggest directories to scan based on framework detection
 * @param {string} frameworkId - Framework identifier (next, react, vue, etc.)
 * @param {string} cwd - Current working directory
 * @returns {string[]} Suggested directories
 */
export function suggestDirectories(frameworkId, _cwd) {
  const commonDirs = ['src', 'components', 'pages', 'app', 'lib', 'utils'];

  const frameworkSpecific = {
    next: ['src', 'app', 'pages', 'components'],
    nuxt: ['src', 'components', 'pages', 'layouts'],
    react: ['src', 'components', 'pages'],
    vue: ['src', 'components', 'views', 'pages'],
    angular: ['src', 'app', 'components'],
    svelte: ['src', 'lib', 'routes', 'components'],
    astro: ['src', 'components', 'pages', 'layouts'],
    vanilla: ['src', 'js', 'components']
  };

  const suggestions = frameworkSpecific[frameworkId] || commonDirs;

  // Return directories that exist (we'll check existence later)
  return suggestions;
}
