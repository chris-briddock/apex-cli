/**
 * Framework detection utility
 * Detects which framework the user's project is using
 */
interface PackageJson {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
}
interface FrameworkDefinition {
    name: string;
    detect: (pkg: PackageJson) => boolean;
    entryFiles: string[];
    importStatement?: string | null;
    cssConfig?: string;
    configFile?: string;
    fallbackFile?: string;
}
export interface FrameworkInfo {
    id: string;
    name: string;
    detect: (pkg: PackageJson) => boolean;
    entryFiles: string[];
    importStatement?: string | null;
    cssConfig?: string;
    configFile?: string;
    fallbackFile?: string;
    detected: boolean;
    hasPackageJson: boolean;
    entryFile?: string;
    packageJson?: PackageJson;
    parseError?: boolean;
}
/**
 * Framework definitions with their detection criteria
 */
export declare const FRAMEWORKS: Record<string, FrameworkDefinition>;
/**
 * Detect the framework being used in the current project
 */
export declare function detectFramework(cwd?: string): FrameworkInfo;
/**
 * Get all available frameworks for selection
 */
export declare function getAvailableFrameworks(): Array<{
    id: string;
    name: string;
}>;
/**
 * Get the default output directory for CSS builds
 */
export declare function getRecommendedOutputDir(_frameworkId?: string): string;
interface ConfigApproach {
    type: string;
    supportsCSSImport?: boolean;
    configKey?: string;
    supportsGlobalStyles?: boolean;
}
/**
 * Check if a framework uses a specific configuration approach
 */
export declare function getFrameworkConfigApproach(frameworkId: string): ConfigApproach;
export {};
//# sourceMappingURL=framework-detector.d.ts.map