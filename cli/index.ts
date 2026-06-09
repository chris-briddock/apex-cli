import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { buildCommand } from './commands/build.ts';
import { completionCommand } from './commands/completion.ts';
import { doctorCommand } from './commands/doctor.ts';
import { initCommand } from './commands/init.ts';
import { purgeCommand } from './commands/purge.ts';
import { watchCommand } from './commands/watch.ts';
import { handleError } from './utils/errors.ts';
import { logger } from './utils/logger.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
let version = '0.0.0';
const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as { version: string };
version = packageJson.version;

/**
 * Set log level based on CLI flags
 */
function configureLogLevel(opts: { verbose?: boolean; quiet?: boolean }): void {
  if (opts.quiet) {
    logger.setLevel('error');
  } else if (opts.verbose) {
    logger.setLevel('verbose');
  }
}

/**
 * Main CLI entry point
 */
export function cli(args: string[]): void {
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
    .option('--sourcemap', 'generate source maps', false)
    .option('-V, --verbose', 'show verbose output', false)
    .option('-q, --quiet', 'suppress non-error output', false);

  // Init command
  program
    .command('init')
    .description('Initialize ApexCSS configuration in your project')
    .option('-f, --framework <name>', 'specify framework (react, vue, angular, svelte, astro, next, nuxt, vanilla)')
    .option('--no-import', 'skip adding imports to entry files')
    .action(async options => {
      try {
        configureLogLevel(program.opts());
        await initCommand({
          configPath: program.opts().config,
          outputDir: program.opts().output,
          framework: options.framework,
          addImport: options.import,
          interactive: true
        });
      } catch (error) {
        handleError(error as Error, program.opts().verbose);
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
        configureLogLevel(program.opts());
        await buildCommand({
          configPath: program.opts().config,
          outputDir: program.opts().output,
          minify: program.opts().minify,
          sourcemap: program.opts().sourcemap,
          format: options.format,
          layers: options.layer
        });
      } catch (error) {
        handleError(error as Error, program.opts().verbose);
      }
    });

  // Watch command
  program
    .command('watch')
    .description('Watch for config changes and rebuild automatically')
    .action(async () => {
      try {
        configureLogLevel(program.opts());
        await watchCommand({
          configPath: program.opts().config,
          outputDir: program.opts().output,
          minify: program.opts().minify,
          sourcemap: program.opts().sourcemap
        });
      } catch (error) {
        handleError(error as Error, program.opts().verbose);
      }
    });

  // Doctor command
  program
    .command('doctor')
    .description('Check system setup and diagnose issues')
    .action(async () => {
      try {
        configureLogLevel(program.opts());
        await doctorCommand();
      } catch (error) {
        handleError(error as Error, program.opts().verbose);
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
    .option('--verbose-stats', 'show detailed class usage statistics')
    .action(async options => {
      try {
        configureLogLevel(program.opts());
        await purgeCommand({
          configPath: program.opts().config,
          src: options.src,
          dryRun: options.dryRun,
          yes: options.yes,
          backup: options.backup,
          verbose: options.verboseStats || program.opts().verbose
        });
      } catch (error) {
        handleError(error as Error, program.opts().verbose);
      }
    });

  // Completion command
  program
    .command('completion')
    .description('Generate shell completion script')
    .argument('<shell>', 'shell type (bash, zsh, fish)')
    .action(async shell => {
      try {
        await completionCommand({ shell });
      } catch (error) {
        handleError(error as Error, program.opts().verbose);
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
