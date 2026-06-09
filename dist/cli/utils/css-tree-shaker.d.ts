/**
 * CSS Tree Shaker Utility
 * Removes unused CSS rules based on classes found in source files
 * Works as a post-processor after Sass compilation
 */
interface CSSRule {
    selector: string;
    declarations: string;
    media?: string;
}
interface TreeShakeStats {
    originalSize: number;
    newSize: number;
    reduction: number;
    reductionPercent: string;
}
/**
 * Parse CSS into structured rules
 */
export declare function parseCSS(css: string): CSSRule[];
/**
 * Extract class selectors from a CSS selector
 */
export declare function extractClassesFromSelector(selector: string): string[];
/**
 * Check if a selector should be kept based on used classes
 */
export declare function shouldKeepSelector(selector: string, usedClasses: Set<string>): boolean;
/**
 * Tree-shake CSS by removing unused rules
 */
export declare function treeShakeCSS(css: string, usedClasses: Set<string>): string;
/**
 * Get used classes from source directories
 */
export declare function getUsedClasses(directories: string[]): Promise<Set<string>>;
/**
 * Tree-shake a CSS file
 */
export declare function treeShakeFile(inputPath: string, outputPath: string, usedClasses: Set<string>): Promise<TreeShakeStats>;
/**
 * Format bytes to human readable string
 */
export declare function formatBytes(bytes: number): string;
export {};
//# sourceMappingURL=css-tree-shaker.d.ts.map