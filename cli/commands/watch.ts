/**
 * Watch command - Watch for config changes and rebuild automatically
 */

import { watchFile } from 'node:fs';
import { resolve } from 'node:path';
import { loadConfig } from '../utils/config-loader.ts';
import { logger } from '../utils/logger.ts';
import { buildCommand } from './build.ts';

interface WatchOptions {
  configPath: string;
  outputDir: string;
  minify?: boolean;
  sourcemap?: boolean;
}

interface WatchDependencies {
  loadConfig: typeof loadConfig;
  buildCommand: typeof buildCommand;
  logger: typeof logger;
}

/**
 * Build state manager for watch mode
 */
export class WatchBuildState {
  isBuilding = false;
  pendingBuild = false;

  /**
   * Check if a build can start
   */
  canStartBuild(): boolean {
    if (this.isBuilding) {
      this.pendingBuild = true;
      return false;
    }
    return true;
  }

  /**
   * Mark build as started
   */
  startBuild(): void {
    this.isBuilding = true;
  }

  /**
   * Mark build as completed
   * @returns True if another build is pending
   */
  finishBuild(): boolean {
    this.isBuilding = false;
    const hasPending = this.pendingBuild;
    this.pendingBuild = false;
    return hasPending;
  }
}

/**
 * Perform a single build in watch mode
 */
export async function performWatchBuild(
  options: WatchOptions,
  state: WatchBuildState,
  deps?: WatchDependencies
): Promise<boolean> {
  const dependencies = deps || { loadConfig, buildCommand, logger };
  if (!state.canStartBuild()) {
    return false;
  }

  state.startBuild();
  dependencies.logger.info('Config changed, rebuilding...');
  dependencies.logger.newline();

  let success = false;
  try {
    // Reload config to validate it
    dependencies.loadConfig(options.configPath);

    // Build
    await dependencies.buildCommand(options);
    success = true;
  } catch (error) {
    dependencies.logger.error(`Build failed: ${(error as Error).message}`);
  }

  dependencies.logger.newline();
  dependencies.logger.info('Waiting for changes... (Press Ctrl+C to stop)');
  dependencies.logger.newline();

  const hasPending = state.finishBuild();

  // If another change occurred during build, rebuild
  if (hasPending) {
    return performWatchBuild(options, state, dependencies);
  }

  return success;
}

/**
 * Watch for changes and rebuild
 */
export async function watchCommand(options: WatchOptions): Promise<void> {
  const cwd = process.cwd();
  const configPath = resolve(cwd, options.configPath);

  logger.header('ApexCSS Watch Mode');
  logger.newline();
  logger.info(`Watching: ${logger.path(options.configPath)}`);
  logger.info(`Output: ${logger.path(options.outputDir)}`);
  logger.newline();

  // Perform initial build
  try {
    await buildCommand(options);
    logger.newline();
    logger.info('Waiting for changes... (Press Ctrl+C to stop)');
    logger.newline();
  } catch (error) {
    logger.error(`Initial build failed: ${(error as Error).message}`);
    logger.info('Continuing to watch for changes...');
    logger.newline();
  }

  // Watch the config file
  const state = new WatchBuildState();

  // Use fs.watchFile for polling (works across all platforms)
  watchFile(configPath, { interval: 500 }, async () => {
    await performWatchBuild(options, state);
  });

  // Keep the process alive
  process.stdin.resume();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    logger.newline();
    logger.info('Stopping watch mode...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.newline();
    logger.info('Stopping watch mode...');
    process.exit(0);
  });
}
