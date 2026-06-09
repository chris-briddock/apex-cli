/**
 * Configuration loader utility
 * Loads and validates user configuration files
 */
/**
 * Default configuration
 */
export declare const defaultConfig: Record<string, unknown>;
interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * Load configuration from file
 */
export declare function loadConfig(configPath: string): Record<string, unknown>;
/**
 * Deep merge configuration objects
 */
export declare function mergeConfig(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown>;
/**
 * Check if value is a plain object
 */
export declare function isObject(item: unknown): item is Record<string, unknown>;
/**
 * Validates that all feature values are booleans
 */
export declare function validateFeatures(features: Record<string, unknown>, errors: string[]): void;
/**
 * Validates that all breakpoints are valid CSS lengths
 */
export declare function validateBreakpoints(breakpoints: Record<string, unknown>, errors: string[]): void;
/**
 * Validates that all color configurations are valid
 */
export declare function validateColors(colors: Record<string, unknown>, errors: string[]): void;
/**
 * Validates a color's hue value
 */
export declare function validateColorHue(colorConfig: Record<string, unknown>, colorName: string, errors: string[]): void;
/**
 * Validates a color's chroma value
 */
export declare function validateColorChroma(colorConfig: Record<string, unknown>, colorName: string, errors: string[]): void;
/**
 * Validate configuration
 */
export declare function validateConfig(config: Record<string, unknown>): ValidationResult;
/**
 * Generate a sample configuration file content
 */
export declare function generateSampleConfig(): string;
export {};
//# sourceMappingURL=config-loader.d.ts.map