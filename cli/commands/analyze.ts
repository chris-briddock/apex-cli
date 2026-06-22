/**
 * Analyze Command - CSS stats report for generated ApexCSS output
 */

import { existsSync } from 'node:fs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { createGzip } from 'node:zlib';
import { formatBytes } from '../utils/css-tree-shaker.ts';
import { logger } from '../utils/logger.ts';

interface AnalyzeOptions {
  outputDir?: string;
  json?: boolean;
  reportPath?: string;
}

interface LayerStats {
  file: string;
  size: number;
  gzipSize: number;
  rules: number;
  selectors: number;
  declarations: number;
  mediaQueries: number;
  layers: number;
}

interface AnalysisReport {
  timestamp: string;
  outputDir: string;
  totalSize: number;
  totalGzipSize: number;
  totalRules: number;
  files: LayerStats[];
  topProperties: Array<{ property: string; count: number }>;
}

/**
 * Compress a string with gzip and return the byte length.
 */
function gzipSize(content: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const gzip = createGzip();
    const chunks: Buffer[] = [];
    gzip.on('data', (chunk: Buffer) => chunks.push(chunk));
    gzip.on('end', () => resolve(Buffer.concat(chunks).byteLength));
    gzip.on('error', reject);
    gzip.end(Buffer.from(content, 'utf-8'));
  });
}

/**
 * Count CSS declarations within a block.
 */
function countDeclarations(block: string): number {
  // Match property: value; pairs
  const matches = block.match(/[\w-]+\s*:[^;{]+;/g);
  return matches ? matches.length : 0;
}

/**
 * Analyze a CSS file and return stats.
 */
async function analyzeFile(filePath: string, fileName: string): Promise<LayerStats> {
  const content = await readFile(filePath, 'utf-8');
  const size = Buffer.byteLength(content, 'utf-8');
  const gz = await gzipSize(content);

  // Count @media query blocks
  const mediaMatches = content.match(/@media[^{]+\{/g);
  const mediaCount = mediaMatches ? mediaMatches.length : 0;

  // Count @layer blocks
  const layerMatches = content.match(/@layer[^{]+\{/g);
  const layerCount = layerMatches ? layerMatches.length : 0;

  // Count rule blocks — match selector + block
  const ruleMatches = content.match(/[^@{}][^{]*\{[^{}]*\}/g);
  const ruleCount = ruleMatches ? ruleMatches.length : 0;

  // Count selectors (comma-separated within each rule)
  let selectorCount = 0;
  if (ruleMatches) {
    for (const rule of ruleMatches) {
      const selectorPart = rule.slice(0, rule.indexOf('{')).trim();
      selectorCount += selectorPart.split(',').length;
    }
  }

  // Count declarations
  let declCount = 0;
  if (ruleMatches) {
    for (const rule of ruleMatches) {
      const body = rule.slice(rule.indexOf('{') + 1, rule.lastIndexOf('}'));
      declCount += countDeclarations(body);
    }
  }

  return {
    file: fileName,
    size,
    gzipSize: gz,
    rules: ruleCount,
    selectors: selectorCount,
    declarations: declCount,
    mediaQueries: mediaCount,
    layers: layerCount
  };
}

/**
 * Extract CSS property names from content for frequency analysis.
 */
function extractProperties(content: string): string[] {
  const matches = content.match(/^\s*([\w-]+)\s*:/gm);
  return matches ? matches.map(m => m.trim().replace(/:$/, '').trim()) : [];
}

/**
 * Build a top-N property frequency map across all CSS files.
 */
function topProperties(contents: string[], limit = 10): Array<{ property: string; count: number }> {
  const freq = new Map<string, number>();
  for (const content of contents) {
    for (const prop of extractProperties(content)) {
      freq.set(prop, (freq.get(prop) ?? 0) + 1);
    }
  }
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([property, count]) => ({ property, count }));
}

/**
 * Format a stats table row.
 */
function pad(str: string, width: number): string {
  return str.length >= width ? str.slice(0, width) : str + ' '.repeat(width - str.length);
}

/**
 * Print a human-readable stats table.
 */
function printTable(report: AnalysisReport): void {
  const cols = {
    file: 18,
    size: 10,
    gzip: 10,
    rules: 7,
    selectors: 11,
    declarations: 14,
    media: 7
  };

  const header =
    pad('File', cols.file) +
    pad('Size', cols.size) +
    pad('Gzip', cols.gzip) +
    pad('Rules', cols.rules) +
    pad('Selectors', cols.selectors) +
    pad('Declarations', cols.declarations) +
    'Media';

  logger.newline();
  logger.header('CSS Analysis');
  logger.newline();
  console.log(header);
  console.log('─'.repeat(header.length));

  for (const f of report.files) {
    console.log(
      pad(f.file, cols.file) +
        pad(formatBytes(f.size), cols.size) +
        pad(formatBytes(f.gzipSize), cols.gzip) +
        pad(String(f.rules), cols.rules) +
        pad(String(f.selectors), cols.selectors) +
        pad(String(f.declarations), cols.declarations) +
        String(f.mediaQueries)
    );
  }

  console.log('─'.repeat(header.length));
  console.log(
    pad('TOTAL', cols.file) +
      pad(formatBytes(report.totalSize), cols.size) +
      pad(formatBytes(report.totalGzipSize), cols.gzip) +
      pad(String(report.totalRules), cols.rules)
  );
  logger.newline();

  if (report.topProperties.length > 0) {
    logger.info('Top CSS properties:');
    for (const { property, count } of report.topProperties) {
      logger.info(`  ${pad(property, 24)} ${count}x`);
    }
  }
  logger.newline();
}

/**
 * Run the analyze command.
 */
export async function analyzeCommand(options: AnalyzeOptions): Promise<void> {
  const cwd = process.cwd();
  const outputDir = resolve(cwd, options.outputDir ?? 'node_modules/apexcss/dist');

  if (!existsSync(outputDir)) {
    logger.error(`CSS output directory not found: ${outputDir}`);
    logger.info('Run "npx apexcss build" first to generate CSS files');
    process.exit(1);
  }

  let entries: string[];
  try {
    entries = await readdir(outputDir);
  } catch (error) {
    logger.error(`Failed to read output directory: ${(error as Error).message}`);
    process.exit(1);
  }

  const cssFiles = entries.filter(f => extname(f) === '.css');

  if (cssFiles.length === 0) {
    logger.error(`No CSS files found in ${outputDir}`);
    logger.info('Run "npx apexcss build" first');
    process.exit(1);
  }

  const fileStats: LayerStats[] = [];
  const allContents: string[] = [];

  for (const file of cssFiles.sort()) {
    const filePath = resolve(outputDir, file);
    const stats = await analyzeFile(filePath, file);
    fileStats.push(stats);
    allContents.push(await readFile(filePath, 'utf-8'));
  }

  const report: AnalysisReport = {
    timestamp: new Date().toISOString(),
    outputDir,
    totalSize: fileStats.reduce((s, f) => s + f.size, 0),
    totalGzipSize: fileStats.reduce((s, f) => s + f.gzipSize, 0),
    totalRules: fileStats.reduce((s, f) => s + f.rules, 0),
    files: fileStats,
    topProperties: topProperties(allContents)
  };

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printTable(report);
    logger.success(`Analyzed ${cssFiles.length} file(s) in ${outputDir}`);
  }

  if (options.reportPath) {
    try {
      await writeFile(resolve(options.reportPath), JSON.stringify(report, null, 2), 'utf-8');
      logger.info(`Report saved to ${options.reportPath}`);
    } catch (error) {
      logger.warn(`Failed to write report: ${(error as Error).message}`);
    }
  }
}
