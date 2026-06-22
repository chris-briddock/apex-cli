/**
 * Purge Command - Analyze project and optimize ApexCSS configuration
 */

import { existsSync } from 'node:fs';
import { readdir, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { loadConfig } from '../utils/config-loader.ts';
import {
  configExists,
  createBackup,
  formatDiff,
  generateDiff,
  generateSummary,
  updateConfigFile,
  validateChanges
} from '../utils/config-modifier.ts';
import { formatBytes, treeShakeFile } from '../utils/css-tree-shaker.ts';
import { analyzeFeatureUsage, FEATURE_MAPPINGS } from '../utils/feature-mapper.ts';
import { detectFramework } from '../utils/framework-detector.ts';
import { logger } from '../utils/logger.ts';
import { getClassStatistics, scanDirectories, suggestDirectories } from '../utils/purge-analyzer.ts';

interface PurgeOptions {
  configPath?: string;
  src?: string;
  exclude?: string;
  dryRun?: boolean;
  yes?: boolean;
  backup?: boolean;
  verbose?: boolean;
  report?: string;
  pruneCss?: boolean;
  cssDir?: string;
  cssOut?: string;
}

interface SavingsInfo {
  total: number;
  featureSizes: Record<string, number>;
}

interface PurgeReport {
  timestamp: string;
  config: string;
  scannedDirectories: string[];
  scannedFiles: number;
  uniqueClasses: number;
  scanErrors: number;
  analysis: {
    totalFeatures: number;
    usedFeatures: string[];
    unusedFeatures: string[];
    enabledUnused: string[];
    alreadyDisabled: string[];
    potentialSavingsKb: number;
    coveragePercent: number;
  };
  changes: {
    disabled: string[];
    enabled: string[];
    applied: boolean;
  };
}

/**
 * Default source directories to scan
 */
const DEFAULT_SRC_DIRS = ['src', 'components', 'pages', 'app'];

/**
 * Determine source directories to scan based on options and framework
 */
function determineSourceDirectories(options: PurgeOptions, cwd: string): string[] {
  if (options.src) {
    // Filter provided directories to only those that exist
    return options.src
      .split(',')
      .map(d => d.trim())
      .filter(dir => existsSync(resolve(cwd, dir)));
  }

  const framework = detectFramework(cwd);
  const suggestedDirs = suggestDirectories(framework.id, cwd);

  // Use suggested directories that exist
  const existingDirs = suggestedDirs.filter(dir => existsSync(resolve(cwd, dir)));

  // Fallback to default if none found
  if (existingDirs.length === 0) {
    return DEFAULT_SRC_DIRS.filter(dir => existsSync(resolve(cwd, dir)));
  }

  return existingDirs;
}

/**
 * Resolve exclude option to absolute paths
 */
function resolveExcludeDirs(exclude: string | undefined, cwd: string): string[] {
  if (!exclude) return [];
  return exclude
    .split(',')
    .map(d => resolve(cwd, d.trim()))
    .filter(Boolean);
}

/**
 * Create progress callback for verbose mode
 */
function createProgressCallback(
  isVerbose: boolean | undefined
): ((total: number, current: number, file: string) => void) | undefined {
  if (!isVerbose) {
    return undefined;
  }

  return (total: number, current: number, file: string) => {
    logger.info(`  [${current}/${total}] ${file}`);
  };
}

/**
 * Display class statistics in verbose mode
 */
function displayClassStatistics(classes: Set<string>): void {
  const stats = getClassStatistics(classes);
  logger.info('Class statistics:');
  logger.info(`  Total classes: ${stats.total}`);
  logger.info(`  With modifiers: ${stats.withModifiers}`);
  logger.info(`  Dark mode variants: ${stats.darkMode}`);
  logger.info(`  Hover variants: ${stats.hover}`);
  logger.info(`  Focus variants: ${stats.focus}`);
  logger.info(`  Responsive variants: ${stats.responsive}`);

  if (stats.topPrefixes.length > 0) {
    logger.info('  Most used prefixes:');
    for (const [prefix, count] of stats.topPrefixes) {
      logger.info(`    ${prefix}: ${count}`);
    }
  }
  logger.newline();
}

/**
 * Calculate feature sizes for enabled unused features
 */
function calculateFeatureSizes(enabledUnused: string[]): Record<string, number> {
  const featureSizes: Record<string, number> = {};
  for (const feature of enabledUnused) {
    const mapping = FEATURE_MAPPINGS[feature];
    const estimatedSize = mapping?.estimatedSize;
    if (estimatedSize) {
      featureSizes[feature] = estimatedSize;
    }
  }
  return featureSizes;
}

/**
 * Prompt user for confirmation
 */
async function promptForConfirmation(configPath: string): Promise<boolean> {
  try {
    // Dynamic import for inquirer to avoid loading when not needed
    const { default: inquirer } = await import('inquirer');

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'apply',
        message: `Apply these changes to ${configPath}?`,
        default: true
      }
    ]);

    return answers.apply;
  } catch {
    // Fallback if inquirer not available
    logger.warn('Interactive prompts not available');
    logger.info('Use --yes flag to apply changes without confirmation');
    return false;
  }
}

/**
 * Apply configuration changes with optional backup
 */
async function applyConfigurationChanges(
  configPath: string,
  currentConfig: { features?: Record<string, boolean> },
  proposedConfig: { features?: Record<string, boolean> },
  shouldBackup: boolean | undefined
): Promise<void> {
  if (shouldBackup) {
    try {
      const backupPath = await createBackup(configPath);
      logger.info(`Backup created: ${backupPath}`);
    } catch (error) {
      logger.warn(`Failed to create backup: ${(error as Error).message}`);
    }
  }

  try {
    await updateConfigFile(configPath, currentConfig, proposedConfig.features || {});
    logger.success('Configuration updated successfully');
  } catch (error) {
    logger.error(`Failed to update config: ${(error as Error).message}`);
    process.exit(1);
  }
}

/**
 * Write a JSON report of the purge analysis to disk
 */
async function writeReport(reportPath: string, report: PurgeReport): Promise<void> {
  await writeFile(resolve(reportPath), JSON.stringify(report, null, 2), 'utf-8');
}

/**
 * Tree-shake all CSS files in cssDir and write pruned output to cssOut.
 * Reports per-file and total savings.
 */
async function pruneBuiltCss(
  cssDir: string,
  cssOut: string,
  usedClasses: Set<string>,
  isDryRun: boolean
): Promise<void> {
  logger.newline();
  logger.header('CSS Tree Shaking');
  logger.newline();

  let entries: string[];
  try {
    entries = await readdir(cssDir);
  } catch {
    logger.warn(`CSS directory not found: ${cssDir}`);
    logger.info('Run "npx apexcss build" first to generate CSS files');
    return;
  }

  const cssFiles = entries.filter(f => extname(f) === '.css');

  if (cssFiles.length === 0) {
    logger.warn(`No CSS files found in ${cssDir}`);
    return;
  }

  let totalOriginal = 0;
  let totalNew = 0;

  for (const file of cssFiles) {
    const inputPath = resolve(cssDir, file);
    const outputPath = resolve(cssOut, file);

    if (isDryRun) {
      // In dry-run, calculate but don't write
      const { readFile } = await import('node:fs/promises');
      const css = await readFile(inputPath, 'utf-8');
      const { treeShakeCSS } = await import('../utils/css-tree-shaker.ts');
      const pruned = treeShakeCSS(css, usedClasses);
      const orig = Buffer.byteLength(css, 'utf8');
      const next = Buffer.byteLength(pruned, 'utf8');
      totalOriginal += orig;
      totalNew += next;
      logger.info(
        `  ${file}: ${formatBytes(orig)} → ${formatBytes(next)} (${(((orig - next) / orig) * 100).toFixed(1)}% reduction) [dry run]`
      );
    } else {
      try {
        const stats = await treeShakeFile(inputPath, outputPath, usedClasses);
        totalOriginal += stats.originalSize;
        totalNew += stats.newSize;
        logger.success(
          `  ${file}: ${formatBytes(stats.originalSize)} → ${formatBytes(stats.newSize)} (-${stats.reductionPercent}%)`
        );
      } catch (error) {
        logger.warn(`  ${file}: failed to prune — ${(error as Error).message}`);
      }
    }
  }

  logger.newline();
  const totalReduction = totalOriginal - totalNew;
  const totalPercent = totalOriginal > 0 ? ((totalReduction / totalOriginal) * 100).toFixed(1) : '0.0';
  logger.success(
    `Total CSS: ${formatBytes(totalOriginal)} → ${formatBytes(totalNew)} (saved ${formatBytes(totalReduction)}, ${totalPercent}%)`
  );
}

/**
 * Run the purge command
 */
export async function purgeCommand(options: PurgeOptions): Promise<void> {
  const cwd = process.cwd();
  const startTime = Date.now();

  logger.header('ApexCSS Purge');
  logger.newline();

  // Check for config file
  const configPath = resolve(cwd, options.configPath || './apex.config.js');

  if (!(await configExists(configPath))) {
    logger.error(`Config file not found: ${options.configPath || './apex.config.js'}`);
    logger.info('Run "npx apexcss init" to create a config file');
    process.exit(1);
  }

  // Load current configuration
  logger.info('Loading configuration...');
  const currentConfig = loadConfig(options.configPath || './apex.config.js');

  // Determine and validate source directories
  const srcDirs = determineSourceDirectories(options, cwd);
  const excludeDirs = resolveExcludeDirs(options.exclude, cwd);

  if (srcDirs.length === 0) {
    logger.error('No source directories found to scan');
    logger.info('Specify directories with: --src=./src,./components');
    process.exit(1);
  }

  const srcLabel = srcDirs.join(', ');
  logger.info(`Scanning directories: ${srcLabel}`);
  if (excludeDirs.length > 0) {
    logger.info(`Excluding: ${excludeDirs.join(', ')}`);
  }

  // Scan files and extract class names
  let scanResult: Awaited<ReturnType<typeof scanDirectories>>;
  try {
    scanResult = await scanDirectories(
      srcDirs.map(d => resolve(cwd, d)),
      {
        onProgress: createProgressCallback(options.verbose),
        excludeDirs: excludeDirs.length > 0 ? excludeDirs : undefined
      }
    );
  } catch (error) {
    logger.error(`Scan failed: ${(error as Error).message}`);
    process.exit(1);
    // This line is unreachable but helps TypeScript understand
    throw error;
  }

  // Report scan errors
  if (scanResult.errors.length > 0) {
    if (options.verbose) {
      logger.warn(`${scanResult.errors.length} file(s) could not be scanned:`);
      for (const err of scanResult.errors) {
        logger.info(`  ${err}`);
      }
    } else {
      logger.warn(`${scanResult.errors.length} file(s) could not be scanned (use --verbose for details)`);
    }
    logger.newline();
  }

  logger.success(`Scanned ${scanResult.files} files, found ${scanResult.classes.size} unique classes`);
  logger.newline();

  // Show class statistics in verbose mode
  if (options.verbose) {
    displayClassStatistics(scanResult.classes);
  }

  // Analyze feature usage
  logger.info('Analyzing feature usage...');
  const analysis = analyzeFeatureUsage(scanResult.classes, currentConfig as { features?: Record<string, boolean> });

  if (analysis.usedFeatures.length === 0) {
    logger.warn('No ApexCSS classes detected in your project');
    logger.info('Make sure you are scanning the correct directories');
    process.exit(0);
  }

  // Coverage summary
  const coveragePercent =
    analysis.totalFeatures > 0 ? Math.round((analysis.usedFeatures.length / analysis.totalFeatures) * 100) : 0;

  logger.success(
    `Found ${analysis.usedFeatures.length}/${analysis.totalFeatures} features in use (${coveragePercent}% coverage)`
  );

  if (analysis.alreadyDisabled.length > 0) {
    logger.info(
      `Already disabled: ${analysis.alreadyDisabled.length} feature(s) — ${analysis.alreadyDisabled.join(', ')}`
    );
  }

  logger.newline();

  // Calculate potential savings
  const featureSizes = calculateFeatureSizes(analysis.enabledUnused);
  const savings: SavingsInfo = {
    total: analysis.potentialSavings,
    featureSizes
  };

  // Build proposed config (disable unused features)
  const featuresToDisable = analysis.enabledUnused;
  const proposedConfig = {
    ...currentConfig,
    features: {
      ...((currentConfig.features as Record<string, boolean>) || {}),
      ...Object.fromEntries(featuresToDisable.map(f => [f, false]))
    }
  };

  // Generate and display diff
  const diff = generateDiff(
    currentConfig as { features?: Record<string, boolean> },
    proposedConfig as { features?: Record<string, boolean> }
  );
  console.log(formatDiff(diff, savings));

  // Validate changes and show warnings
  const validation = validateChanges(diff);
  if (validation.warnings.length > 0) {
    logger.newline();
    logger.warn('Warnings:');
    for (const warning of validation.warnings) {
      logger.info(`  ⚠️  ${warning}`);
    }
    logger.newline();
  }

  // Track whether changes were ultimately applied (for the report)
  let changesApplied = false;

  // Handle no changes or dry run
  if (diff.totalChanges === 0) {
    logger.success('Your configuration is already optimized!');
  } else if (options.dryRun) {
    logger.info('Dry run - no changes made');
  } else {
    // Confirm changes (unless --yes flag)
    const shouldApply = options.yes || (await promptForConfirmation(configPath));

    if (!shouldApply) {
      logger.info('Changes cancelled');
    } else {
      // Apply changes
      logger.info('Applying changes...');
      await applyConfigurationChanges(
        configPath,
        currentConfig as { features?: Record<string, boolean> },
        proposedConfig as { features?: Record<string, boolean> },
        options.backup
      );

      changesApplied = true;

      // Show summary
      logger.newline();
      const summary = generateSummary(diff, savings.total);
      logger.success(summary);

      // Show next steps
      logger.newline();
      logger.info('Next steps:');
      logger.info('  1. Run "npx apexcss build" to generate optimized CSS');
      logger.info('  2. Test your application to ensure styles work correctly');
      logger.info(
        `  3. If issues occur, restore from backup: cp ${options.configPath || './apex.config.js'}.*.backup ${options.configPath || './apex.config.js'}`
      );
    }
  }

  // CSS tree shaking — produce minimal CSS output
  if (options.pruneCss) {
    const defaultCssDir = resolve(cwd, 'node_modules', 'apexcss', 'dist');
    const cssDir = options.cssDir ? resolve(cwd, options.cssDir) : defaultCssDir;
    const cssOut = options.cssOut ? resolve(cwd, options.cssOut) : cssDir;
    await pruneBuiltCss(cssDir, cssOut, scanResult.classes, options.dryRun ?? false);
  }

  // Write JSON report if requested
  if (options.report) {
    const report: PurgeReport = {
      timestamp: new Date().toISOString(),
      config: options.configPath || './apex.config.js',
      scannedDirectories: srcDirs,
      scannedFiles: scanResult.files,
      uniqueClasses: scanResult.classes.size,
      scanErrors: scanResult.errors.length,
      analysis: {
        totalFeatures: analysis.totalFeatures,
        usedFeatures: analysis.usedFeatures,
        unusedFeatures: analysis.unusedFeatures,
        enabledUnused: analysis.enabledUnused,
        alreadyDisabled: analysis.alreadyDisabled,
        potentialSavingsKb: analysis.potentialSavings,
        coveragePercent
      },
      changes: {
        disabled: diff.disabled.map(c => c.feature),
        enabled: diff.enabled.map(c => c.feature),
        applied: changesApplied
      }
    };

    try {
      await writeReport(options.report, report);
      logger.info(`Report saved to ${options.report}`);
    } catch (error) {
      logger.warn(`Failed to write report: ${(error as Error).message}`);
    }
  }

  const duration = Date.now() - startTime;
  logger.newline();
  logger.success(`Purge completed in ${duration}ms`);
}
