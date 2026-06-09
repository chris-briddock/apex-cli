/**
 * Config Modifier Utility
 * Handles reading, diffing, and modifying apex.config.js files
 */
interface ConfigChange {
    feature: string;
    oldValue: boolean | unknown;
    newValue: boolean | unknown;
    action: 'disable' | 'enable';
}
interface DiffResult {
    changes: ConfigChange[];
    totalChanges: number;
    disabled: ConfigChange[];
    enabled: ConfigChange[];
}
interface SavingsInfo {
    total?: number;
    featureSizes?: Record<string, number>;
}
interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * Read config file content
 */
export declare function readConfigFile(configPath: string): Promise<string>;
/**
 * Check if a config file exists
 */
export declare function configExists(configPath: string): Promise<boolean>;
/**
 * Create a backup of the config file
 */
export declare function createBackup(configPath: string): Promise<string>;
/**
 * Generate a diff between current and proposed config
 */
export declare function generateDiff(currentConfig: {
    features?: Record<string, boolean>;
}, proposedConfig: {
    features?: Record<string, boolean>;
}): DiffResult;
/**
 * Format a diff for display
 */
export declare function formatDiff(diff: DiffResult, savings: SavingsInfo): string;
/**
 * Update config file with new feature values
 * Preserves original formatting and comments as much as possible
 */
export declare function updateConfigFile(configPath: string, currentConfig: {
    features?: Record<string, boolean>;
}, newFeatures: Record<string, boolean>): Promise<void>;
/**
 * Build a complete config object with updated features
 */
export declare function buildUpdatedConfig(currentConfig: {
    features?: Record<string, boolean>;
}, featuresToDisable: string[]): Record<string, unknown>;
/**
 * Generate a summary of changes
 */
export declare function generateSummary(diff: DiffResult, savings: number): string;
/**
 * Validate that proposed changes are safe
 */
export declare function validateChanges(diff: DiffResult): ValidationResult;
/**
 * Parse a JavaScript config file to extract the features object
 * Note: This is a simplified parser that works with the standard apex.config.js format
 */
export declare function parseConfigFile(configPath: string): Promise<{
    features: Record<string, boolean>;
}>;
/**
 * Generate a new config file content with all features enabled
 * Used for creating a fresh config
 */
export declare function generateConfigContent(features: Record<string, boolean>): string;
export {};
//# sourceMappingURL=config-modifier.d.ts.map