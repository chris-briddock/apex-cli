/**
 * Build command - Generate custom CSS from configuration
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as sass from 'sass';
import { cacheGet, cacheSet, computeCacheKey } from '../utils/cache.ts';
import { generateSCSS } from '../utils/config-builder.ts';
import { loadConfig } from '../utils/config-loader.ts';
import { logger } from '../utils/logger.ts';
import { scanDirectories } from '../utils/purge-analyzer.ts';
import { determineSourceDirectories, pruneBuiltCss } from './purge.ts';

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
  noCache?: boolean;
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
 * Try to minify CSS with LightningCSS; falls back to the Sass-compiled output on failure.
 */
async function applyLightningCSS(css: string): Promise<string> {
  try {
    // Dynamic import so LightningCSS is optional — not listed in hard dependencies
    const { transform } = (await import('lightningcss')) as typeof import('lightningcss');
    const result = transform({
      filename: 'output.css',
      code: Buffer.from(css),
      minify: true,
      targets: { chrome: 95 << 16 } // reasonable modern target
    });
    return result.code.toString();
  } catch {
    // LightningCSS not installed — silently fall back to Sass compressed output
    return css;
  }
}

/**
 * Compile a single SCSS file. If minify is true and LightningCSS is available,
 * post-process with it for better compression. The Sass style is always 'expanded'
 * when LightningCSS handles minification; 'compressed' otherwise.
 */
async function compileSassFile(
  entryFile: string,
  outputPath: string,
  compileOptions: sass.Options<'sync'>,
  useLightning: boolean
): Promise<ReturnType<typeof sass.compile>> {
  const sassOptions = useLightning ? { ...compileOptions, style: 'expanded' as const } : compileOptions;

  const result = sass.compile(entryFile, sassOptions);

  if (useLightning) {
    const minified = await applyLightningCSS(result.css);
    writeFileSync(outputPath, minified);
    return { ...result, css: minified };
  }

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
function writeSourceMap(
  outputDir: string,
  filename: string,
  sourceMap: ReturnType<typeof sass.compile>['sourceMap'] | undefined,
  enabled: boolean | undefined
): void {
  if (enabled && sourceMap) {
    writeFileSync(resolve(outputDir, `${filename}.css.map`), JSON.stringify(sourceMap));
  }
}

/**
 * Detect whether LightningCSS is available in the project.
 */
async function isLightningCSSAvailable(): Promise<boolean> {
  try {
    await import('lightningcss');
    return true;
  } catch {
    return false;
  }
}

/**
 * Run Sass build using the entry files from node_modules.
 * When --minify is set, uses LightningCSS post-processing if available.
 */
async function runSassBuild(
  sourceDir: string,
  options: BuildOptions,
  outputDir: string,
  layers: string[]
): Promise<void> {
  const useLightning = options.minify ? await isLightningCSSAvailable() : false;
  if (useLightning) {
    logger.verbose('LightningCSS detected — using it for minification');
  }

  const compileOptions: sass.Options<'sync'> = {
    loadPaths: [sourceDir],
    sourceMap: options.sourcemap,
    // When LightningCSS handles minification, compile expanded first
    style: options.minify && !useLightning ? 'compressed' : 'expanded'
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

    const result = await compileSassFile(entryFile, resolve(outputDir, `${layer}.css`), compileOptions, useLightning);
    logBuildSuccess(`${layer}.css`, result.css, `${layer} layer`);
    writeSourceMap(outputDir, layer, result.sourceMap, options.sourcemap);
  }

  // Build complete framework if all layers requested
  if (layers.length === 3) {
    const mainFile = resolve(sourceDir, 'main.scss');
    if (existsSync(mainFile)) {
      const result = await compileSassFile(mainFile, resolve(outputDir, 'apex.css'), compileOptions, useLightning);
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

  // Check build cache
  const configAbsPath = resolve(cwd, options.configPath);
  if (!options.noCache) {
    try {
      const cacheKey = await computeCacheKey({
        configPath: configAbsPath,
        sourceDir,
        layers,
        minify: options.minify,
        sourcemap: options.sourcemap
      });
      const hit = await cacheGet(cacheKey, outputDir, cwd);
      if (hit) {
        const duration = Date.now() - startTime;
        logger.success(`Cache hit — skipping compilation (${duration}ms)`);
        logger.info(`Output directory: ${logger.path(options.outputDir)}`);
        return;
      }

      // Write custom config to source directory (node_modules/apexcss/src/config)
      logger.info('Writing configuration...');
      writeConfigFiles(scssContent, sourceDir);

      // Build using Sass compiler on the entry files
      logger.info('Compiling CSS...');
      logger.newline();

      await runSassBuild(sourceDir, options, outputDir, layers);

      // Store result in cache
      const outputFiles = [...layers.map(l => `${l}.css`), ...(layers.length === 3 ? ['apex.css'] : [])];
      cacheSet(cacheKey, outputFiles, outputDir, cwd);
    } catch (error) {
      logger.error(`Build failed: ${(error as Error).message}`);
      throw error;
    }
  } else {
    // No-cache path
    logger.info('Writing configuration...');
    writeConfigFiles(scssContent, sourceDir);
    logger.info('Compiling CSS...');
    logger.newline();
    try {
      await runSassBuild(sourceDir, options, outputDir, layers);
    } catch (error) {
      logger.error(`Build failed: ${(error as Error).message}`);
      throw error;
    }
  }

  const duration = Date.now() - startTime;
  logger.newline();
  logger.success(`Build completed in ${duration}ms`);
  logger.newline();
  logger.info(`Output directory: ${logger.path(options.outputDir)}`);
}

/**
 * Tree-shake the CSS a build just produced, using the project's own source files
 * to determine which classes are actually in use. Used by `apex build --purge` to
 * combine building and pruning into a single, CI-friendly step. This only prunes
 * CSS in place — it never modifies apex.config.js (that remains `apex purge`'s job).
 */
export async function runPostBuildPurge(cwd: string, outputDir: string): Promise<void> {
  const srcDirs = determineSourceDirectories({}, cwd);

  if (srcDirs.length === 0) {
    logger.newline();
    logger.warn('No source directories found to scan — skipping CSS purge');
    logger.info('Specify directories your project uses, or run "apex purge --src=..." manually');
    return;
  }

  logger.newline();
  logger.info(`Scanning directories: ${srcDirs.join(', ')}`);

  const scanResult = await scanDirectories(srcDirs.map(dir => resolve(cwd, dir)));
  logger.success(`Scanned ${scanResult.files} files, found ${scanResult.classes.size} unique classes`);

  await pruneBuiltCss(outputDir, outputDir, scanResult.classes, false);
}
