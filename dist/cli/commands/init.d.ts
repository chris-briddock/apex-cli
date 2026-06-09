/**
 * Init command - Initialize ApexCSS configuration in user's project
 */
interface InitOptions {
    configPath: string;
    outputDir: string;
    framework?: string;
    addImport?: boolean;
    interactive?: boolean;
}
/**
 * Initialize ApexCSS in the user's project
 */
export declare function initCommand(options: InitOptions): Promise<void>;
/**
 * Prompt for overwrite confirmation
 */
export declare function promptOverwrite(): Promise<{
    overwrite: boolean;
}>;
/**
 * Get the appropriate import statement for the framework
 */
export declare function getImportStatement(frameworkId: string, _outputDir?: string): string;
/**
 * Find the insertion point for an import statement in JS content
 */
export declare function insertJsImport(content: string, importStatement: string): string;
/**
 * Add import statement to a file
 */
export declare function addImportToFile(filePath: string, importStatement: string, frameworkId: string): void;
export {};
//# sourceMappingURL=init.d.ts.map