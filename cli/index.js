import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { buildCommand } from './commands/build.js';
import { doctorCommand } from './commands/doctor.js';
import { initCommand } from './commands/init.js';
import { purgeCommand } from './commands/purge.js';
import { watchCommand } from './commands/watch.js';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
let version = '0.0.0';
const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
version = packageJson.version;

/**
 * Main CLI entry point
 * @param {string[]} args - Command line arguments
 */
export function cli(args) {
  const program = new Command();

  program
    .name('apexcss')
    .description('ApexCSS CLI - Build and customize your CSS framework')
    .version(version, '-v, --version');

  // Global options
  program
    .option('-c, --config <path>', 'path to config file', './apex.config.js')
    .option('-o, --output <dir>', 'output directory', 'node_modules/apexcss/dist')
    .option('--minify', 'minify output CSS', false)
    .option('--sourcemap', 'generate source maps', false);

  // Init command
  program
    .command('init')
    .description('Initialize ApexCSS configuration in your project')
    .option('-f, --framework <name>', 'specify framework (react, vue, angular, svelte, astro, next, nuxt, vanilla)')
    .option('--no-import', 'skip adding imports to entry files')
    .action(async options => {
      try {
        await initCommand({
          configPath: program.opts().config,
          outputDir: program.opts().output,
          framework: options.framework,
          addImport: options.import
        });
      } catch (error) {
        logger.error(error.message);
        process.exit(1);
      }
    });

  // Build command
  program
    .command('build')
    .description('Build custom CSS from configuration')
    .option('--format <format>', 'output format (css, scss, both)', 'css')
    .option(
      '-l, --layer <layers>',
      'build specific layers (base, utilities, themes, all). Comma-separated for multiple',
      'all'
    )
    .action(async options => {
      try {
        await buildCommand({
          configPath: program.opts().config,
          outputDir: program.opts().output,
          minify: program.opts().minify,
          sourcemap: program.opts().sourcemap,
          format: options.format,
          layers: options.layer
        });
      } catch (error) {
        logger.error(error.message);
        process.exit(1);
      }
    });

  // Watch command
  program
    .command('watch')
    .description('Watch for config changes and rebuild automatically')
    .action(async () => {
      try {
        await watchCommand({
          configPath: program.opts().config,
          outputDir: program.opts().output,
          minify: program.opts().minify,
          sourcemap: program.opts().sourcemap
        });
      } catch (error) {
        logger.error(error.message);
        process.exit(1);
      }
    });

  // Doctor command
  program
    .command('doctor')
    .description('Check system setup and diagnose issues')
    .action(async () => {
      try {
        await doctorCommand();
      } catch (error) {
        logger.error(error.message);
        process.exit(1);
      }
    });

  // Purge command
  program
    .command('purge')
    .description('Analyze project and optimize ApexCSS configuration by removing unused features')
    .option('--src <dirs>', 'comma-separated source directories to scan (default: auto-detect)')
    .option('--dry-run', 'show changes without applying them')
    .option('-y, --yes', 'skip confirmation and apply changes automatically')
    .option('--backup', 'create backup before modifying config')
    .option('-v, --verbose', 'show detailed class usage statistics')
    .action(async options => {
      try {
        await purgeCommand({
          configPath: program.opts().config,
          src: options.src,
          dryRun: options.dryRun,
          yes: options.yes,
          backup: options.backup,
          verbose: options.verbose
        });
      } catch (error) {
        logger.error(error.message);
        process.exit(1);
      }
    });

  // Handle unknown commands
  program.on('command:*', operands => {
    logger.error(`Unknown command: ${operands[0]}`);
    logger.info('Run "apexcss --help" for available commands');
    process.exit(1);
  });

  // Parse arguments
  program.parse(args);

  // Show help if no command provided
  if (!program.args.length) {
    program.help();
  }
}
