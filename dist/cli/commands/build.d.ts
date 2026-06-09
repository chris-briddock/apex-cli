/**
 * Build command - Generate custom CSS from configuration
 */
interface BuildOptions {
    configPath: string;
    outputDir: string;
    layers?: string;
    minify?: boolean;
    sourcemap?: boolean;
    format?: string;
}
/**
 * Parse layers option and return array of layers to build
 */
export declare function parseLayers(layersOption?: string): string[];
/**
 * Determine source directory
 */
export declare function determineSourceDir(cwd: string): string;
/**
 * Write configuration files
 */
export declare function writeConfigFiles(scssContent: string, sourceDir: string): void;
/**
 * Build CSS from configuration
 */
export declare function buildCommand(options: BuildOptions): Promise<void>;
export {};
//# sourceMappingURL=build.d.ts.map