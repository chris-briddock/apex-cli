/**
 * Feature Mapper Utility
 * Maps CSS class names to ApexCSS feature toggles
 */
interface FeatureMapping {
    prefixes: string[];
    patterns: RegExp[];
    estimatedSize: number;
}
/**
 * Feature to class prefix mappings
 * Each feature maps to an array of class prefixes that indicate usage
 */
export declare const FEATURE_MAPPINGS: Record<string, FeatureMapping>;
/**
 * Get all available feature names
 */
export declare function getFeatureNames(): string[];
/**
 * Check if a class name matches a feature
 */
export declare function classMatchesFeature(className: string, feature: string): boolean;
/**
 * Find which features are used by a set of class names
 */
export declare function findUsedFeatures(classNames: Set<string>): Set<string>;
/**
 * Calculate potential savings from disabling unused features
 */
export declare function calculateSavings(unusedFeatures: Set<string>): number;
interface FeatureUsageAnalysis {
    totalFeatures: number;
    usedFeatures: string[];
    unusedFeatures: string[];
    enabledUnused: string[];
    alreadyDisabled: string[];
    potentialSavings: number;
}
/**
 * Get detailed analysis of feature usage
 */
export declare function analyzeFeatureUsage(classNames: Set<string>, currentConfig: {
    features?: Record<string, boolean>;
}): FeatureUsageAnalysis;
export {};
//# sourceMappingURL=feature-mapper.d.ts.map