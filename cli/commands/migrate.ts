/**
 * Migrate Command - Upgrade apex.config.js between versions
 */

import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createBackup } from '../utils/config-modifier.ts';
import { logger } from '../utils/logger.ts';

interface MigrateOptions {
  configPath?: string;
  from?: string;
  to?: string;
  dryRun?: boolean;
  yes?: boolean;
}

interface Migration {
  from: string;
  to: string;
  description: string;
  transform: (source: string) => string;
}

/**
 * Versioned migration transforms.
 * Each migration knows how to upgrade one version step at a time.
 */
const MIGRATIONS: Migration[] = [
  {
    from: '0.1.x',
    to: '0.2.0',
    description: 'Rename "colors" option to "palette" and wrap features in "features" key',
    transform(source) {
      let out = source;
      // colors: {...} → palette: {...}
      out = out.replace(/\bcolors\s*:/g, 'palette:');
      // Wrap loose boolean feature flags under a `features` key if not already present
      if (!out.includes('features:') && !out.includes('features :')) {
        // Insert features key before the closing brace of the default export object
        out = out.replace(/}(\s*)$/, (_, ws) => `  features: {},\n}${ws}`);
      }
      return out;
    }
  },
  {
    from: '0.2.x',
    to: '0.3.0',
    description: 'Move "palette" inside "features.palette" and rename "breakpoints" to "screens"',
    transform(source) {
      let out = source;
      out = out.replace(/\bpalette\s*:/g, 'features: { palette:');
      out = out.replace(/\bbreakpoints\s*:/g, 'screens:');
      return out;
    }
  }
];

/**
 * Parse a loose semver string to a comparable integer (major * 1_000_000 + minor * 1000 + patch).
 */
function parseVersion(v: string): number {
  const parts = v
    .replace(/[^0-9.]/g, '')
    .split('.')
    .map(Number);
  return (parts[0] ?? 0) * 1_000_000 + (parts[1] ?? 0) * 1000 + (parts[2] ?? 0);
}

/**
 * Select applicable migrations between fromVersion and toVersion.
 */
function selectMigrations(fromVersion: string, toVersion: string): Migration[] {
  const fromNum = parseVersion(fromVersion);
  const toNum = parseVersion(toVersion);

  return MIGRATIONS.filter(m => {
    const mFrom = parseVersion(m.from);
    const mTo = parseVersion(m.to);
    return mFrom >= fromNum && mTo <= toNum;
  });
}

/**
 * Apply a series of migrations to the config source string.
 */
function applyMigrations(source: string, migrations: Migration[]): string {
  return migrations.reduce((src, m) => m.transform(src), source);
}

/**
 * Show a simple line diff between old and new content.
 */
function showDiff(oldContent: string, newContent: string): void {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const maxLen = Math.max(oldLines.length, newLines.length);

  let hasDiff = false;
  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i] ?? '';
    const newLine = newLines[i] ?? '';
    if (oldLine !== newLine) {
      if (!hasDiff) {
        logger.newline();
        logger.info('Changes:');
      }
      hasDiff = true;
      if (oldLine) console.log(`  \x1b[31m- ${oldLine}\x1b[0m`);
      if (newLine) console.log(`  \x1b[32m+ ${newLine}\x1b[0m`);
    }
  }

  if (!hasDiff) {
    logger.info('No changes needed');
  }

  logger.newline();
}

/**
 * Prompt for confirmation using inquirer.
 */
async function confirmApply(configPath: string): Promise<boolean> {
  try {
    const { default: inquirer } = await import('inquirer');
    const { apply } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'apply',
        message: `Apply migration to ${configPath}?`,
        default: true
      }
    ]);
    return apply as boolean;
  } catch {
    logger.warn('Interactive prompts not available — use --yes to apply automatically');
    return false;
  }
}

/**
 * Run the migrate command.
 */
export async function migrateCommand(options: MigrateOptions): Promise<void> {
  const cwd = process.cwd();
  const configPath = resolve(cwd, options.configPath ?? './apex.config.js');

  logger.header('ApexCSS Config Migration');
  logger.newline();

  if (!existsSync(configPath)) {
    logger.error(`Config file not found: ${configPath}`);
    logger.info('Run "npx apexcss init" to create a config file');
    process.exit(1);
  }

  const fromVersion = options.from ?? '0.1.x';
  const toVersion = options.to ?? '0.3.0';

  logger.info(`Migrating: ${fromVersion} → ${toVersion}`);

  const migrations = selectMigrations(fromVersion, toVersion);

  if (migrations.length === 0) {
    logger.success('No migrations needed for this version range');
    return;
  }

  logger.info(`Found ${migrations.length} migration(s) to apply:`);
  for (const m of migrations) {
    logger.info(`  • [${m.from} → ${m.to}] ${m.description}`);
  }

  const source = await readFile(configPath, 'utf-8');
  const migrated = applyMigrations(source, migrations);

  showDiff(source, migrated);

  if (source === migrated) {
    logger.success('Config is already up to date — no changes needed');
    return;
  }

  if (options.dryRun) {
    logger.info('Dry run — no changes written');
    return;
  }

  const shouldApply = options.yes || (await confirmApply(configPath));

  if (!shouldApply) {
    logger.info('Migration cancelled');
    return;
  }

  // Backup before writing
  try {
    const backupPath = await createBackup(configPath);
    logger.info(`Backup created: ${backupPath}`);
  } catch (error) {
    logger.warn(`Could not create backup: ${(error as Error).message}`);
  }

  await writeFile(configPath, migrated, 'utf-8');
  logger.success('Migration applied successfully');
  logger.newline();
  logger.info('Next steps:');
  logger.info('  1. Review the updated config file');
  logger.info('  2. Run "npx apexcss build" to verify the build succeeds');
}
