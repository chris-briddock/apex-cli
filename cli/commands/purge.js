/**
 * Purge Command - Analyze project and optimize ApexCSS configuration
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadConfig } from '../utils/config-loader.js';
import {
  configExists,
  createBackup,
  formatDiff,
  generateDiff,
  generateSummary,
  updateConfigFile,
  validateChanges
} from '../utils/config-modifier.js';
import { analyzeFeatureUsage, FEATURE_MAPPINGS } from '../utils/feature-mapper.js';
import { detectFramework } from '../utils/framework-detector.js';
import { logger } from '../utils/logger.js';
import { getClassStatistics, scanDirectories, suggestDirectories } from '../utils/purge-analyzer.js';

/**
 * Default source directories to scan
 */
const DEFAULT_SRC_DIRS = ['src', 'components', 'pages', 'app'];

/**
 * Determine source directories to scan based on options and framework
 * @param {object} options - Command options
 * @param {string} cwd - Current working directory
 * @returns {string[]} Array of source directories
 */
function determineSourceDirectories(options, cwd) {
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
 * Create progress callback for verbose mode
 * @param {boolean} isVerbose - Whether verbose mode is enabled
 * @returns {Function|undefined} Progress callback or undefined
 */
function createProgressCallback(isVerbose) {
  if (!isVerbose) {
    return undefined;
  }

  return (total, current, file) => {
    logger.info(`  [${current}/${total}] ${file}`);
  };
}

/**
 * Display class statistics in verbose mode
 * @param {Set<string>} classes - Set of class names
 */
function displayClassStatistics(classes) {
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
 * @param {string[]} enabledUnused - Array of enabled but unused features
 * @returns {object} Feature sizes mapping
 */
function calculateFeatureSizes(enabledUnused) {
  const featureSizes = {};
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
 * @param {string} configPath - Path to config file
 * @returns {Promise<boolean>} Whether to apply changes
 */
async function promptForConfirmation(configPath) {
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
 * @param {string} configPath - Path to config file
 * @param {object} currentConfig - Current configuration
 * @param {object} proposedConfig - Proposed configuration
 * @param {boolean} shouldBackup - Whether to create a backup
 * @returns {Promise<void>}
 */
async function applyConfigurationChanges(configPath, currentConfig, proposedConfig, shouldBackup) {
  if (shouldBackup) {
    try {
      const backupPath = await createBackup(configPath);
      logger.info(`Backup created: ${backupPath}`);
    } catch (error) {
      logger.warn(`Failed to create backup: ${error.message}`);
    }
  }

  try {
    await updateConfigFile(configPath, currentConfig, proposedConfig.features);
    logger.success('Configuration updated successfully');
  } catch (error) {
    logger.error(`Failed to update config: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Run the purge command
 * @param {object} options - Command options
 * @param {string} options.configPath - Path to config file
 * @param {string} options.src - Comma-separated source directories
 * @param {boolean} options.dryRun - Show changes without applying
 * @param {boolean} options.yes - Skip confirmation
 * @param {boolean} options.backup - Create backup before modifying
 * @param {boolean} options.verbose - Show detailed output
 * @returns {Promise<void>}
 */
export async function purgeCommand(options) {
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

  if (srcDirs.length === 0) {
    logger.error('No source directories found to scan');
    logger.info('Specify directories with: --src=./src,./components');
    process.exit(1);
  }

  logger.info(`Scanning directories: ${srcDirs.join(', ')}`);

  // Scan files and extract class names
  let scanResult;
  try {
    scanResult = await scanDirectories(
      srcDirs.map(d => resolve(cwd, d)),
      { onProgress: createProgressCallback(options.verbose) }
    );
  } catch (error) {
    logger.error(`Scan failed: ${error.message}`);
    process.exit(1);
  }

  logger.success(`Scanned ${scanResult.files} files, found ${scanResult.classes.size} unique classes`);
  logger.newline();

  // Show class statistics in verbose mode
  if (options.verbose) {
    displayClassStatistics(scanResult.classes);
  }

  // Analyze feature usage
  logger.info('Analyzing feature usage...');
  const analysis = analyzeFeatureUsage(scanResult.classes, currentConfig);

  if (analysis.usedFeatures.length === 0) {
    logger.warn('No ApexCSS classes detected in your project');
    logger.info('Make sure you are scanning the correct directories');
    process.exit(0);
  }

  logger.success(
    `Found ${analysis.usedFeatures.length} used features, ${analysis.unusedFeatures.length} unused features`
  );
  logger.newline();

  // Calculate potential savings
  const featureSizes = calculateFeatureSizes(analysis.enabledUnused);
  const savings = {
    total: analysis.potentialSavings,
    featureSizes
  };

  // Build proposed config (disable unused features)
  const featuresToDisable = analysis.enabledUnused;
  const proposedConfig = {
    ...currentConfig,
    features: {
      ...currentConfig.features,
      ...Object.fromEntries(featuresToDisable.map(f => [f, false]))
    }
  };

  // Generate and display diff
  const diff = generateDiff(currentConfig, proposedConfig);
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

  // Handle no changes or dry run
  if (diff.totalChanges === 0) {
    logger.success('Your configuration is already optimized!');
    return;
  }

  if (options.dryRun) {
    logger.info('Dry run - no changes made');
    return;
  }

  // Confirm changes (unless --yes flag)
  const shouldApply = options.yes || (await promptForConfirmation(configPath));

  if (!shouldApply) {
    logger.info('Changes cancelled');
    return;
  }

  // Apply changes
  logger.info('Applying changes...');
  await applyConfigurationChanges(configPath, currentConfig, proposedConfig, options.backup);

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
    `  3. If issues occur, restore from backup: cp ${options.configPath || './apex.config.js'}.backup ${options.configPath || './apex.config.js'}`
  );

  const duration = Date.now() - startTime;
  logger.newline();
  logger.success(`Purge completed in ${duration}ms`);
}
