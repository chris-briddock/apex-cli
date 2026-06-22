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
  '.ts',
  '.vue',
  '.svelte',
  '.astro',
  '.js',
  '.mjs',
  '.cjs',
  '.mts',
  '.cts'
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
 * Max concurrent file reads during parallel scanning
 */
const SCAN_CONCURRENCY = 20;

/**
 * Regex patterns for extracting class names
 */
const CLASS_PATTERNS: Record<string, RegExp> = {
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
 */
function cleanClassName(cls: string): string | null {
  // Remove template literal interpolation markers
  const cleanClass = cls.replaceAll(/\$\{[^}]*\}/g, '').trim();
  if (cleanClass && !cleanClass.includes('`') && !cleanClass.includes('{')) {
    return cleanClass;
  }
  return null;
}

/**
 * Add classes from a string to the set
 */
function addClasses(str: string, classNames: Set<string>): void {
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
 */
function processPatternMatch(name: string, captured: string, classNames: Set<string>): void {
  if (!captured) return;

  // Handle object syntax (Vue/React): { active: true, 'text-red': false }
  if (name.includes('Dynamic') || captured.includes(':')) {
    // Extract keys from object notation
    const objectPattern = /([\w-]+)\s*:/g;
    let objMatch: RegExpExecArray | null;
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
 */
function extractFromTemplateLiterals(content: string, classNames: Set<string>): void {
  const templateStringPattern = /`([^`]*)`/g;
  let templateMatch: RegExpExecArray | null;

  while ((templateMatch = templateStringPattern.exec(content)) !== null) {
    const templateContent = templateMatch[1];
    // Look for class assignments within template literals
    const assignmentPattern = /class(?:Name)?\s*[=:]\s*["']([^"']+)["']/g;
    let assignment: RegExpExecArray | null;
    while ((assignment = assignmentPattern.exec(templateContent)) !== null) {
      addClasses(assignment[1], classNames);
    }
  }
}

/**
 * Extract class names from utility function calls (clsx, cn, classnames, cva, etc.)
 * Handles nested parentheses correctly.
 */
function extractFromUtilityCalls(content: string, classNames: Set<string>): void {
  const utilityStart = /(?:clsx|classnames?|cn|cx|cva|tv|twMerge|twJoin)\s*\(/g;
  let startMatch: RegExpExecArray | null;

  while ((startMatch = utilityStart.exec(content)) !== null) {
    // Walk forward to find the matching closing paren
    let depth = 1;
    let i = startMatch.index + startMatch[0].length;

    while (i < content.length && depth > 0) {
      const ch = content[i];
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      i++;
    }

    const argsContent = content.slice(startMatch.index + startMatch[0].length, i - 1);

    // Extract string literals from arguments
    const stringPattern = /["']([^"']+)["']/g;
    let strMatch: RegExpExecArray | null;
    while ((strMatch = stringPattern.exec(argsContent)) !== null) {
      addClasses(strMatch[1], classNames);
    }
  }
}

/**
 * Extract class names from a single content string using all patterns
 */
export function extractClassNames(content: string): Set<string> {
  const classNames = new Set<string>();

  // Apply each pattern
  for (const [name, pattern] of Object.entries(CLASS_PATTERNS)) {
    let match: RegExpExecArray | null;
    const regex = new RegExp(pattern.source, pattern.flags);

    while ((match = regex.exec(content)) !== null) {
      processPatternMatch(name, match[1], classNames);
    }
  }

  // Additional pass: look for class names in template strings
  extractFromTemplateLiterals(content, classNames);

  // Additional pass: extract from utility function calls (clsx, cn, etc.)
  extractFromUtilityCalls(content, classNames);

  return classNames;
}

/**
 * Check if a file should be scanned based on extension
 */
export function shouldScanFile(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase();
  return SCAN_EXTENSIONS.has(ext);
}

/**
 * Check if a directory should be ignored
 */
export function shouldIgnoreDirectory(dirName: string): boolean {
  return IGNORED_DIRECTORIES.has(dirName);
}

interface GetFilesOptions {
  excludeDirs?: string[];
}

/**
 * Recursively get all scan-able files in a directory
 */
export async function getFilesToScan(
  dirPath: string,
  files: string[] = [],
  options?: GetFilesOptions
): Promise<string[]> {
  const resolvedPath = resolve(dirPath);

  try {
    const entries = await readdir(resolvedPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = resolve(resolvedPath, entry.name);

      if (entry.isDirectory()) {
        const isExcluded = options?.excludeDirs?.some(excl => fullPath === excl || fullPath.startsWith(`${excl}/`));
        if (!shouldIgnoreDirectory(entry.name) && !isExcluded) {
          await getFilesToScan(fullPath, files, options);
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

interface ScanResult {
  file: string;
  classes: Set<string>;
  error?: string;
}

/**
 * Scan a single file and extract class names
 */
export async function scanFile(filePath: string): Promise<ScanResult> {
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
      error: (error as Error).message
    };
  }
}

interface ScanOptions {
  onProgress?: (total: number, current: number, filePath: string) => void;
  excludeDirs?: string[];
}

interface ScanDirectoriesResult {
  classes: Set<string>;
  files: number;
  errors: string[];
}

/**
 * Collect all files to scan from multiple directories
 */
async function collectFilesToScan(directories: string[], options?: GetFilesOptions): Promise<string[]> {
  const filesToScan: string[] = [];
  for (const dir of directories) {
    const files = await getFilesToScan(dir, [], options);
    filesToScan.push(...files);
  }
  return filesToScan;
}

/**
 * Process scan results and update class set
 */
function processScanResult(result: ScanResult, allClasses: Set<string>, errors: string[], filePath: string): void {
  if (result.error) {
    errors.push(`${filePath}: ${result.error}`);
    return;
  }

  for (const cls of result.classes) {
    allClasses.add(cls);
  }
}

/**
 * Scan multiple directories and extract all class names.
 * Files are processed in parallel batches for performance.
 */
export async function scanDirectories(
  directories: string[],
  options: ScanOptions = {}
): Promise<ScanDirectoriesResult> {
  const allClasses = new Set<string>();
  const errors: string[] = [];

  // Collect all files to scan
  const filesToScan = await collectFilesToScan(directories, { excludeDirs: options.excludeDirs });

  // Scan files in parallel batches to avoid exhausting file descriptor limits
  let scannedCount = 0;

  for (let i = 0; i < filesToScan.length; i += SCAN_CONCURRENCY) {
    const batch = filesToScan.slice(i, i + SCAN_CONCURRENCY);

    const results = await Promise.all(
      batch.map(async filePath => {
        const result = await scanFile(filePath);
        scannedCount++;
        if (options.onProgress) {
          options.onProgress(filesToScan.length, scannedCount, filePath);
        }
        return { result, filePath };
      })
    );

    for (const { result, filePath } of results) {
      processScanResult(result, allClasses, errors, filePath);
    }
  }

  return {
    classes: allClasses,
    files: filesToScan.length,
    errors
  };
}

interface ModifierStats {
  hasModifier: boolean;
  isDarkMode: boolean;
  isHover: boolean;
  isFocus: boolean;
  isResponsive: boolean;
}

/**
 * Extract modifier statistics from a class name
 */
function extractModifierStats(cls: string): ModifierStats | null {
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
 */
function getClassPrefix(cls: string): string | null {
  return cls.split('-')[0] || null;
}

/**
 * Get top prefixes from a prefix count map
 */
function getTopPrefixes(prefixMap: Map<string, number>, limit: number): Array<[string, number]> {
  return Array.from(prefixMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

interface ClassStatistics {
  total: number;
  withModifiers: number;
  responsive: number;
  darkMode: number;
  hover: number;
  focus: number;
  byPrefix: Map<string, number>;
  topPrefixes: Array<[string, number]>;
}

/**
 * Get statistics about detected classes
 */
export function getClassStatistics(classes: Set<string>): ClassStatistics {
  const stats: ClassStatistics = {
    total: classes.size,
    withModifiers: 0,
    responsive: 0,
    darkMode: 0,
    hover: 0,
    focus: 0,
    byPrefix: new Map(),
    topPrefixes: []
  };

  for (const cls of classes) {
    const modifierStats = extractModifierStats(cls);
    if (modifierStats) {
      stats.withModifiers++;
      const statMappings: Array<[keyof ModifierStats, keyof ClassStatistics]> = [
        ['isDarkMode', 'darkMode'],
        ['isHover', 'hover'],
        ['isFocus', 'focus'],
        ['isResponsive', 'responsive']
      ];
      for (const [conditionKey, statKey] of statMappings) {
        if (modifierStats[conditionKey]) {
          (stats[statKey] as number)++;
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
 */
export function suggestDirectories(frameworkId: string, _cwd?: string): string[] {
  const commonDirs = ['src', 'components', 'pages', 'app', 'lib', 'utils'];

  const frameworkSpecific: Record<string, string[]> = {
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
