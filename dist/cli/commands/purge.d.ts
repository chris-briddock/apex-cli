/**
 * Purge Command - Analyze project and optimize ApexCSS configuration
 */
interface PurgeOptions {
    configPath?: string;
    src?: string;
    dryRun?: boolean;
    yes?: boolean;
    backup?: boolean;
    verbose?: boolean;
}
/**
 * Run the purge command
 */
export declare function purgeCommand(options: PurgeOptions): Promise<void>;
export {};
//# sourceMappingURL=purge.d.ts.map