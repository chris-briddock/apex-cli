/**
 * Build command - Generate custom CSS from configuration
 */

import { writeFileSync, existsSync, mkdirSync, cpSync, rmSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../utils/config-loader.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the config builder
import { generateSCSS } from '../utils/config-builder.js';

/**
 * Valid layer names
 */
const VALID_LAYERS = ['base', 'utilities', 'themes'];

/**
 * Parse layers option and return array of layers to build
 * @param {string} layersOption - Comma-separated layer names or 'all'
 * @returns {string[]} - Array of layer names
 */
export function parseLayers(layersOption) {
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
 * Generate entry SCSS content based on selected layers
 * @param {string[]} layers - Array of layer names to include
 * @returns {string} - SCSS content for entry file
 */
export function generateLayerEntry(layers) {
  const lines = [
    '// ============================================================================',
    '// ApexCSS - Layered Build Entry Point',
    '// ============================================================================',
    '// Auto-generated based on --layer option',
    '// ============================================================================',
    ''
  ];

  // Always include config
  lines.push('@use \'config\';');

  // Include selected layers
  for (const layer of layers) {
    lines.push(`@use '${layer}';`);
  }

  lines.push('', '// ============================================================================', '// End of Entry Point', '// ============================================================================', '');

  return lines.join('\n');
}

/**
 * Get source directories needed for selected layers
 * @param {string[]} layers - Array of layer names
 * @returns {string[]} - Array of source directory names
 */
export function getSourceEntriesForLayers(layers) {
  const entries = new Set(['config']);

  for (const layer of layers) {
    entries.add(layer);
    switch (layer) {
    case 'utilities':
      entries.add('mixins');
      entries.add('plugins');
      break;
    case 'base':
      entries.add('mixins');
      break;
    case 'themes':
      entries.add('mixins');
      break;
    }
  }

  return Array.from(entries);
}

/**
 * Setup build environment
 * @param {string} outputDir - Output directory path
 * @returns {string} - Temp directory path
 */
export function setupBuildEnvironment(outputDir) {
  const tempDir = resolve(outputDir, '.apexcss-build');
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true });
  }
  mkdirSync(tempDir, { recursive: true });
  return tempDir;
}

/**
 * Determine source directory
 * @param {string} cwd - Current working directory
 * @returns {string} - Source directory path
 */
export function determineSourceDir(cwd) {
  // Look for apexcss source in user's node_modules
  const nodeModulesSrcDir = resolve(cwd, 'node_modules', 'apexcss', 'src');

  if (!existsSync(nodeModulesSrcDir)) {
    throw new Error(
      'Could not find ApexCSS source files. ' +
      'Please ensure apexcss is installed: npm install apexcss'
    );
  }

  return nodeModulesSrcDir;
}

/**
 * Write configuration files to temp directory
 * @param {string} tempDir - Temp directory path
 * @param {string} scssContent - SCSS content to write
 */
export function writeConfigFiles(tempDir, scssContent) {
  const configDir = resolve(tempDir, 'config');
  mkdirSync(configDir, { recursive: true });
  writeFileSync(resolve(configDir, '_custom-config.scss'), scssContent);
  writeFileSync(
    resolve(configDir, '_index.scss'),
    '// Auto-generated config entry\n@forward \'custom-config\';\n'
  );
}

/**
 * Find generated CSS file in temp directory
 * @param {string} tempDir - Temp directory path
 * @returns {string | undefined} - CSS file path or undefined
 */
export function findGeneratedCss(tempDir) {
  const candidates = ['apex.css', 'style.css'];
  for (const file of candidates) {
    const fullPath = resolve(tempDir, file);
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }
  return undefined;
}

/**
 * Copy source map if generated
 * @param {string} tempDir - Temp directory path
 * @param {string} outputDir - Output directory path
 */
export function copySourceMap(tempDir, outputDir) {
  const mapPath = resolve(tempDir, 'apex.css.map');
  if (existsSync(mapPath)) {
    const mapContent = readFileSync(mapPath, 'utf-8');
    writeFileSync(resolve(outputDir, 'apex.css.map'), mapContent);
    logger.success('Source map generated');
  }
}

/**
 * Build CSS from configuration
 * @param {object} options - Command options
 * @returns {Promise<void>}
 */
export async function buildCommand(options) {
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
      'Could not find ApexCSS source files. ' +
      'Please ensure apexcss is installed: npm install apexcss'
    );
  }

  // Parse layers option
  const layers = parseLayers(options.layers);
  logger.info(`Building layers: ${layers.join(', ')}`);

  // Setup build environment
  const tempDir = setupBuildEnvironment(outputDir);

  // Copy source files to temp directory based on selected layers
  logger.info('Preparing build environment...');
  copySourceFiles(sourceDir, tempDir, layers);

  // Write custom config
  writeConfigFiles(tempDir, scssContent);

  // Generate layer-specific entry file
  const entryContent = generateLayerEntry(layers);
  writeFileSync(resolve(tempDir, 'apex-entry.scss'), entryContent);

  // Build using Vite programmatically
  logger.info('Compiling CSS...');

  try {
    await runViteBuild(tempDir, options, outputDir, layers, scssContent);

    const duration = Date.now() - startTime;
    logger.newline();
    logger.success(`Build completed in ${duration}ms`);

  } catch (error) {
    // Clean up temp directory on error
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true });
    }
    throw error;
  }
}

/**
 * Run Vite build
 * @param {string} tempDir - Temp directory path
 * @param {object} options - Build options
 * @param {string} outputDir - Output directory path
 * @param {string[]} layers - Array of layer names
 * @param {string} scssContent - SCSS content
 * @returns {Promise<void>}
 */
async function runViteBuild(tempDir, options, outputDir, layers, scssContent) {
  const { build } = await import('vite');
  const cwd = process.cwd();

  // Look for postcss config in user's project
  const userPostcssConfig = resolve(cwd, 'postcss.config.js');
  const apexcssPostcssConfig = resolve(cwd, 'node_modules', 'apexcss', 'postcss.config.js');

  let postcssConfig;
  if (existsSync(userPostcssConfig)) {
    postcssConfig = userPostcssConfig;
  } else if (existsSync(apexcssPostcssConfig)) {
    postcssConfig = apexcssPostcssConfig;
  } else {
    postcssConfig = undefined;
  }

  await build({
    configFile: false,
    css: {
      postcss: postcssConfig
    },
    build: {
      cssCodeSplit: false,
      sourcemap: options.sourcemap,
      minify: options.minify ? 'esbuild' : false,
      outDir: tempDir,
      rollupOptions: {
        input: {
          apex: resolve(tempDir, 'apex-entry.scss')
        },
        output: {
          entryFileNames: '[name].js',
          assetFileNames: () => '[name][extname]'
        }
      }
    }
  });

  // Get output filenames based on layers
  const { filename, description } = getOutputFilenames(layers);

  // Copy CSS from temp to output
  const generatedCssPath = findGeneratedCss(tempDir);
  const finalCssPath = resolve(outputDir, `${filename}.css`);

  if (!generatedCssPath) {
    throw new Error('CSS file was not generated');
  }

  const cssContent = readFileSync(generatedCssPath, 'utf-8');
  writeFileSync(finalCssPath, cssContent);

  // Calculate file size
  const contentBytes = Buffer.byteLength(cssContent, 'utf8');
  const sizeKB = (contentBytes / 1024).toFixed(2);

  const filePath = logger.path(`${filename}.css`);
  logger.success(`Built: ${filePath} (${sizeKB} KB) [${description}]`);

  // Copy source map if generated
  if (options.sourcemap) {
    const mapSource = resolve(tempDir, 'apex.css.map');
    const mapDest = resolve(outputDir, `${filename}.css.map`);
    if (existsSync(mapSource)) {
      const mapContent = readFileSync(mapSource, 'utf-8');
      writeFileSync(mapDest, mapContent);
      logger.success('Source map generated');
    }
  }

  // Output SCSS if requested
  if (options.format === 'scss' || options.format === 'both') {
    writeFileSync(resolve(outputDir, `${filename}.scss`), scssContent);
    const scssPath = logger.path(`${filename}.scss`);
    logger.success(`Generated: ${scssPath}`);
  }

  // Clean up temp directory
  rmSync(tempDir, { recursive: true });
}

/**
 * Copy source files to temp directory
 * @param {string} sourceDir - Source directory
 * @param {string} tempDir - Temp directory
 * @param {string[]} layers - Array of layer names to include
 */
function copySourceFiles(sourceDir, tempDir, layers) {
  const entries = getSourceEntriesForLayers(layers);

  for (const entry of entries) {
    const sourcePath = resolve(sourceDir, entry);
    const destPath = resolve(tempDir, entry);

    if (existsSync(sourcePath)) {
      cpSync(sourcePath, destPath, { recursive: true });
    }
  }
}

/**
 * Generate filenames based on selected layers
 * @param {string[]} layers - Array of layer names
 * @returns {object} - Object with filename and description
 */
function getOutputFilenames(layers) {
  if (layers.length === 3) {
    return { filename: 'apex', description: 'complete framework' };
  }

  if (layers.length === 1) {
    return { filename: layers[0], description: `${layers[0]} layer` };
  }

  const layerSuffix = layers.join('-');
  return { filename: layerSuffix, description: `${layers.join(' + ')} layers` };
}
