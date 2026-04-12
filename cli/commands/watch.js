/**
 * Watch command - Watch for config changes and rebuild automatically
 */

import { watchFile } from 'node:fs';
import { resolve } from 'node:path';
import { loadConfig } from '../utils/config-loader.js';
import { logger } from '../utils/logger.js';
import { buildCommand } from './build.js';

/**
 * Build state manager for watch mode
 */
export class WatchBuildState {
  isBuilding = false;
  pendingBuild = false;

  /**
   * Check if a build can start
   * @returns {boolean}
   */
  canStartBuild() {
    if (this.isBuilding) {
      this.pendingBuild = true;
      return false;
    }
    return true;
  }

  /**
   * Mark build as started
   */
  startBuild() {
    this.isBuilding = true;
  }

  /**
   * Mark build as completed
   * @returns {boolean} - True if another build is pending
   */
  finishBuild() {
    this.isBuilding = false;
    const hasPending = this.pendingBuild;
    this.pendingBuild = false;
    return hasPending;
  }
}

/**
 * Perform a single build in watch mode
 * @param {object} options - Build options
 * @param {WatchBuildState} state - Build state manager
 * @param {object} [deps] - Dependencies (for testing)
 * @returns {Promise<boolean>} - True if build succeeded
 */
/**
 * Perform a single build in watch mode
 * @param {object} options - Build options
 * @param {WatchBuildState} state - Build state manager
 * @param {object} [deps] - Dependencies (for testing)
 * @returns {Promise<boolean>} - True if build succeeded
 */
export async function performWatchBuild(options, state, deps) {
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
    dependencies.logger.error(`Build failed: ${error.message}`);
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
 * @param {object} options - Command options
 */
export async function watchCommand(options) {
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
    logger.error(`Initial build failed: ${error.message}`);
    logger.info('Continuing to watch for changes...');
    logger.newline();
  }

  // Watch the config file
  const state = new WatchBuildState();

  // Use fs.watchFile for polling (works across all platforms)
  watchFile(configPath, { interval: 500 }, async (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
      await performWatchBuild(options, state);
    }
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
