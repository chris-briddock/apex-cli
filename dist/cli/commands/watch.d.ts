/**
 * Watch command - Watch for config changes and rebuild automatically
 */
import { loadConfig } from '../utils/config-loader.js';
import { logger } from '../utils/logger.js';
import { buildCommand } from './build.js';
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
export declare class WatchBuildState {
    isBuilding: boolean;
    pendingBuild: boolean;
    /**
     * Check if a build can start
     */
    canStartBuild(): boolean;
    /**
     * Mark build as started
     */
    startBuild(): void;
    /**
     * Mark build as completed
     * @returns True if another build is pending
     */
    finishBuild(): boolean;
}
/**
 * Perform a single build in watch mode
 */
export declare function performWatchBuild(options: WatchOptions, state: WatchBuildState, deps?: WatchDependencies): Promise<boolean>;
/**
 * Watch for changes and rebuild
 */
export declare function watchCommand(options: WatchOptions): Promise<void>;
export {};
//# sourceMappingURL=watch.d.ts.map