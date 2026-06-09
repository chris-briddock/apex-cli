/**
 * Purge Analyzer Utility
 * Scans project files and extracts CSS class names
 */
/**
 * File extensions to scan for CSS classes
 */
export declare const SCAN_EXTENSIONS: Set<string>;
/**
 * Directories to ignore during scanning
 */
export declare const IGNORED_DIRECTORIES: Set<string>;
/**
 * Extract class names from a single content string using all patterns
 */
export declare function extractClassNames(content: string): Set<string>;
/**
 * Check if a file should be scanned based on extension
 */
export declare function shouldScanFile(filePath: string): boolean;
/**
 * Check if a directory should be ignored
 */
export declare function shouldIgnoreDirectory(dirName: string): boolean;
/**
 * Recursively get all scan-able files in a directory
 */
export declare function getFilesToScan(dirPath: string, files?: string[]): Promise<string[]>;
interface ScanResult {
    file: string;
    classes: Set<string>;
    error?: string;
}
/**
 * Scan a single file and extract class names
 */
export declare function scanFile(filePath: string): Promise<ScanResult>;
interface ScanOptions {
    onProgress?: (total: number, current: number, filePath: string) => void;
}
interface ScanDirectoriesResult {
    classes: Set<string>;
    files: number;
    errors: string[];
}
/**
 * Scan multiple directories and extract all class names
 */
export declare function scanDirectories(directories: string[], options?: ScanOptions): Promise<ScanDirectoriesResult>;
interface ClassStatistics {
    total: number;
    withModifiers: number;
    responsive: number;
    darkMode: number;
    hover: number;
    focus: number;
    byPrefix: Map<string, number>;
    topPrefixes: Array<[string, number]>;
}
/**
 * Get statistics about detected classes
 */
export declare function getClassStatistics(classes: Set<string>): ClassStatistics;
/**
 * Suggest directories to scan based on framework detection
 */
export declare function suggestDirectories(frameworkId: string, _cwd?: string): string[];
export {};
//# sourceMappingURL=purge-analyzer.d.ts.map