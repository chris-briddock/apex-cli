/**
 * Build command - Generate custom CSS from configuration
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as sass from 'sass';
// Import the config builder
import { generateSCSS } from '../utils/config-builder.ts';
import { loadConfig } from '../utils/config-loader.ts';
import { logger } from '../utils/logger.ts';

/**
 * Valid layer names
 */
const VALID_LAYERS = ['base', 'utilities', 'themes'];

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
export function parseLayers(layersOption?: string): string[] {
  if (!layersOption || layersOption === 'all') {
    return ['base', 'utilities', 'themes'];
  }

  const requested = layersOption.split(',').map(l => l.trim().toLowerCase());
  const invalid = requested.filter(l => !VALID_LAYERS.includes(l));

  if (invalid.length > 0) {
    throw new Error(`Invalid layer(s): ${invalid.join(', ')}. Valid options: ${VALID_LAYERS.join(', ')}`);
  }

  return requested;
}

/**
 * Determine source directory
 */
export function determineSourceDir(cwd: string): string {
  // Look for apexcss source in user's node_modules
  const nodeModulesSrcDir = resolve(cwd, 'node_modules', 'apexcss', 'src');

  if (!existsSync(nodeModulesSrcDir)) {
    throw new Error(
      'Could not find ApexCSS source files. ' + 'Please ensure apexcss is installed: npm install apexcss'
    );
  }

  return nodeModulesSrcDir;
}

/**
 * Write configuration files
 */
export function writeConfigFiles(scssContent: string, sourceDir: string): void {
  // Write _custom-config.scss to node_modules/apexcss/src/config (the actual source location)
  const sourceConfigDir = resolve(sourceDir, 'config');
  if (existsSync(sourceConfigDir)) {
    writeFileSync(resolve(sourceConfigDir, '_custom-config.scss'), scssContent);
  }
}

/**
 * Get entry file for a layer
 */
function getEntryFile(layer: string): string {
  switch (layer) {
    case 'base':
      return 'entry-base.scss';
    case 'utilities':
      return 'entry-utilities.scss';
    case 'themes':
      return 'entry-themes.scss';
    default:
      return 'main.scss';
  }
}

/**
 * Compile a single SCSS file
 */
function compileSassFile(entryFile: string, outputPath: string, compileOptions: sass.Options<'sync'>): ReturnType<typeof sass.compile> {
  const result = sass.compile(entryFile, compileOptions);
  writeFileSync(outputPath, result.css);
  return result;
}

/**
 * Log successful build with file size
 */
function logBuildSuccess(filename: string, css: string, description: string): void {
  const contentBytes = Buffer.byteLength(css, 'utf8');
  const sizeKB = (contentBytes / 1024).toFixed(2);
  logger.success(`Built: ${logger.path(filename)} (${sizeKB} KB) [${description}]`);
}

/**
 * Write source map file if enabled
 */
function writeSourceMap(outputDir: string, filename: string, sourceMap: ReturnType<typeof sass.compile>['sourceMap'] | undefined, enabled: boolean | undefined): void {
  if (enabled && sourceMap) {
    writeFileSync(resolve(outputDir, `${filename}.css.map`), JSON.stringify(sourceMap));
  }
}

/**
 * Run Sass build using the entry files from node_modules
 */
async function runSassBuild(sourceDir: string, options: BuildOptions, outputDir: string, layers: string[]): Promise<void> {
  const compileOptions: sass.Options<'sync'> = {
    loadPaths: [sourceDir],
    sourceMap: options.sourcemap,
    style: options.minify ? 'compressed' : 'expanded'
  };

  // Build individual layer files
  const layerFiles = ['base', 'utilities', 'themes'];

  for (const layer of layerFiles) {
    if (!layers.includes(layer)) {
      continue;
    }

    const entryFile = resolve(sourceDir, getEntryFile(layer));
    if (!existsSync(entryFile)) {
      logger.warn(`Entry file not found: ${entryFile}`);
      continue;
    }

    const result = compileSassFile(entryFile, resolve(outputDir, `${layer}.css`), compileOptions);
    logBuildSuccess(`${layer}.css`, result.css, `${layer} layer`);
    writeSourceMap(outputDir, layer, result.sourceMap, options.sourcemap);
  }

  // Build complete framework if all layers requested
  if (layers.length === 3) {
    const mainFile = resolve(sourceDir, 'main.scss');
    if (existsSync(mainFile)) {
      const result = compileSassFile(mainFile, resolve(outputDir, 'apex.css'), compileOptions);
      logBuildSuccess('apex.css', result.css, 'complete framework');
      writeSourceMap(outputDir, 'apex', result.sourceMap, options.sourcemap);
    }
  }
}

/**
 * Build CSS from configuration
 */
export async function buildCommand(options: BuildOptions): Promise<void> {
  const cwd = process.cwd();
  const startTime = Date.now();

  logger.header('Building ApexCSS');
  logger.newline();

  // Load configuration
  logger.info('Loading configuration...');
  const config = loadConfig(options.configPath);

  // Resolve output directory
  const outputDir = resolve(cwd, options.outputDir);

  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Generate SCSS from config
  logger.info('Generating SCSS configuration...');
  const scssContent = generateSCSS(config);

  // Determine source directory
  const sourceDir = determineSourceDir(cwd);

  if (!existsSync(sourceDir)) {
    throw new Error(
      'Could not find ApexCSS source files. ' + 'Please ensure apexcss is installed: npm install apexcss'
    );
  }

  // Parse layers option
  const layers = parseLayers(options.layers);
  logger.info(`Building layers: ${layers.join(', ')}`);

  // Write custom config to source directory (node_modules/apexcss/src/config)
  logger.info('Writing configuration...');
  writeConfigFiles(scssContent, sourceDir);

  // Build using Sass compiler on the entry files
  logger.info('Compiling CSS...');
  logger.newline();

  try {
    await runSassBuild(sourceDir, options, outputDir, layers);

    const duration = Date.now() - startTime;
    logger.newline();
    logger.success(`Build completed in ${duration}ms`);
    logger.newline();
    logger.info(`Output directory: ${logger.path(options.outputDir)}`);
  } catch (error) {
    logger.error(`Build failed: ${(error as Error).message}`);
    throw error;
  }
}
