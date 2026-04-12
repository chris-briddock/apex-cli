/**
 * Init command - Initialize ApexCSS configuration in user's project
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { generateSampleConfig } from '../utils/config-loader.js';
import { detectFramework, getAvailableFrameworks, getRecommendedOutputDir } from '../utils/framework-detector.js';
import { logger } from '../utils/logger.js';

/**
 * Prompt user for initialization options
 * @param {object} framework - Detected framework
 * @param {object} options - Current options
 * @returns {Promise<{selectedFramework: object, outputDir: string, addImport: boolean}>}
 */
async function promptForOptions(framework, options) {
  const { default: inquirer } = await import('inquirer');

  // First, ask if user wants to accept defaults
  const defaultAnswer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useDefaults',
      message: `Use default configuration?\n  Framework: ${framework.name}\n  Add imports: Yes`,
      default: true
    }
  ]);

  if (defaultAnswer.useDefaults) {
    return {
      selectedFramework: framework,
      outputDir: options.outputDir || getRecommendedOutputDir(framework.id),
      addImport: true
    };
  }

  // If not using defaults, show full prompts
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'framework',
      message: 'Select your framework:',
      default: framework.id,
      choices: getAvailableFrameworks().map(f => ({
        name: f.name,
        value: f.id
      }))
    },
    {
      type: 'confirm',
      name: 'addImport',
      message: framework.entryFile ? `Add import to ${framework.entryFile}?` : 'Add import to your main entry file?',
      default: true,
      when: () => framework.entryFile || framework.id !== 'vanilla'
    }
  ]);

  return {
    selectedFramework: { ...framework, id: answers.framework },
    outputDir: options.outputDir || getRecommendedOutputDir(framework.id),
    addImport: answers.addImport
  };
}

/**
 * Get user options (interactive)
 * @param {object} framework - Detected framework
 * @param {object} options - Command options
 * @param {string} cwd - Current working directory
 * @returns {Promise<{selectedFramework: object, outputDir: string, addImport: boolean}>}
 */
async function getUserOptions(framework, options, cwd = process.cwd()) {
  // Always use interactive mode to ask about defaults first
  let result = {
    selectedFramework: framework,
    outputDir: options.outputDir,
    addImport: options.addImport
  };

  try {
    result = await promptForOptions(framework, options);
  } catch {
    // Interactive mode failed - fallback to defaults
    logger.warn('Interactive mode not available, using defaults');
  }

  // Override with CLI framework option if provided
  if (options.framework) {
    // Update entryFile based on the new framework
    const { FRAMEWORKS, getAvailableFrameworks } = await import('../utils/framework-detector.js');
    const availableFrameworks = getAvailableFrameworks();
    const frameworkInfo = availableFrameworks.find(f => f.id === options.framework);
    const frameworkDef = FRAMEWORKS[options.framework];

    if (frameworkDef) {
      const entryFiles = frameworkDef.entryFiles || [];
      const existingEntry = entryFiles.find(file => existsSync(resolve(cwd, file)));

      result.selectedFramework = {
        ...framework,
        ...frameworkDef,
        id: options.framework,
        name: frameworkInfo?.name || options.framework,
        entryFile: existingEntry || frameworkDef.fallbackFile
      };
    }
  }

  return result;
}

/**
 * Handle existing config file
 * @param {string} configPath - Path to config file
 * @param {boolean} useInteractive - Whether interactive mode is enabled
 * @returns {Promise<boolean>} - True if should continue
 */
async function handleExistingConfig(configPath, useInteractive) {
  if (!existsSync(configPath)) {
    return true;
  }

  logger.warn(`Config file already exists at ${configPath}`);
  const { overwrite } = useInteractive ? await promptOverwrite() : { overwrite: false };

  if (!overwrite) {
    logger.info('Skipping config creation');
    return false;
  }

  return true;
}

/**
 * Setup gitignore for output directory
 * @param {string} cwd - Current working directory
 * @param {string} outputDir - Output directory
 */
function setupGitignore(cwd, outputDir) {
  const gitignorePath = resolve(cwd, '.gitignore');
  const gitignoreEntry = `# ApexCSS generated files\n${outputDir.replace(/^\.\//, '')}\n`;

  if (existsSync(gitignorePath)) {
    const gitignoreContent = readFileSync(gitignorePath, 'utf-8');
    if (!gitignoreContent.includes(outputDir)) {
      logger.info(`Add to ${logger.path('.gitignore')}: ${outputDir}`);
    }
  } else {
    writeFileSync(gitignorePath, gitignoreEntry);
    logger.success(`Created ${logger.path('.gitignore')}`);
  }
}

/**
 * Add import to framework entry file
 * @param {string} cwd - Current working directory
 * @param {object} framework - Selected framework
 * @param {string} outputDir - Output directory
 */
function addFrameworkImport(cwd, framework, outputDir) {
  if (!framework.entryFile) {
    return;
  }

  const entryFilePath = resolve(cwd, framework.entryFile);

  if (!existsSync(entryFilePath)) {
    logger.warn(`Entry file not found: ${framework.entryFile}`);
    logger.info('Manually add import to your main entry file');
    return;
  }

  const importStatement = getImportStatement(framework.id, outputDir);

  try {
    addImportToFile(entryFilePath, importStatement, framework.id);
    logger.success(`Added import to ${logger.path(framework.entryFile)}`);
  } catch (error) {
    logger.warn(`Could not add import automatically: ${error.message}`);
    logger.info(`Manually add: ${logger.cmd(importStatement.trim())}`);
  }
}

/**
 * Initialize ApexCSS in the user's project
 * @param {object} options - Command options
 */
export async function initCommand(options) {
  const cwd = process.cwd();

  logger.header('ApexCSS Initialization');
  logger.newline();

  const framework = detectFramework(cwd);
  logger.info(`Detected framework: ${framework.name}`);
  logger.newline();

  const { selectedFramework, outputDir, addImport } = await getUserOptions(framework, options, cwd);

  const outputPath = resolve(cwd, outputDir);
  await mkdir(outputPath, { recursive: true });

  const configPath = resolve(cwd, options.configPath);
  const shouldContinue = await handleExistingConfig(configPath, options.interactive);

  if (!shouldContinue) {
    return;
  }

  const configContent = generateSampleConfig();
  writeFileSync(configPath, configContent);
  logger.success(`Created config file: ${logger.path(options.configPath)}`);

  setupGitignore(cwd, outputDir);

  if (addImport) {
    addFrameworkImport(cwd, selectedFramework, outputDir);
  }

  // Add npm scripts to package.json
  setupPackageJsonScripts(cwd);

  logger.newline();
  logger.success('ApexCSS initialized successfully!');
  logger.newline();
  logger.info('Next steps:');
  logger.list([
    `Edit ${logger.path(options.configPath)} to customize your configuration`,
    `Run ${logger.cmd('npm run apexcss:build')} to generate your CSS`,
    `Run ${logger.cmd('npm run apexcss:watch')} during development`
  ]);
  logger.newline();
}

/**
 * Add npm scripts for ApexCSS to package.json
 * @param {string} cwd - Current working directory
 */
function setupPackageJsonScripts(cwd) {
  const packageJsonPath = resolve(cwd, 'package.json');

  if (!existsSync(packageJsonPath)) {
    logger.warn('No package.json found. Skipping npm scripts setup.');
    logger.info('To create one, run: npm init');
    return;
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    // Ensure scripts object exists
    packageJson.scripts = packageJson.scripts || {};

    // Add ApexCSS scripts if they don't exist
    const scripts = {
      'apexcss:build': 'npx apexcss build',
      'apexcss:watch': 'npx apexcss watch'
    };

    let scriptsAdded = false;
    for (const [name, command] of Object.entries(scripts)) {
      if (!packageJson.scripts[name]) {
        packageJson.scripts[name] = command;
        scriptsAdded = true;
      }
    }

    if (scriptsAdded) {
      writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
      logger.success('Added npm scripts to package.json:');
      logger.list([
        `${logger.cmd('npm run apexcss:build')} - Build CSS once`,
        `${logger.cmd('npm run apexcss:watch')} - Watch for changes`
      ]);
    } else {
      logger.info('ApexCSS npm scripts already exist in package.json');
    }
  } catch (error) {
    logger.warn(`Could not update package.json: ${error.message}`);
  }
}

/**
 * Prompt for overwrite confirmation
 * @returns {Promise<{overwrite: boolean}>}
 */
export async function promptOverwrite() {
  try {
    const { default: inquirer } = await import('inquirer');
    return await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Overwrite existing config file?',
        default: false
      }
    ]);
  } catch {
    // Inquirer not available - default to not overwriting
    return { overwrite: false };
  }
}

/**
 * CSS cascade layers import statement for all frameworks
 * This uses the standard apexcss package imports with cascade layers
 */
const CASCADE_LAYER_IMPORTS = `@layer base, utilities, themes;

@import 'apexcss/base' layer(base);
@import 'apexcss/utilities' layer(utilities);
@import 'apexcss/themes' layer(themes);
`;

/**
 * Get the appropriate import statement for the framework
 * @param {string} frameworkId - Framework identifier
 * @param {string} [_outputDir] - Output directory (unused - kept for API compatibility)
 * @returns {string} - Import statement
 */
export function getImportStatement(frameworkId, _outputDir) {
  // All CSS-based frameworks now use cascade layers with node_modules imports
  switch (frameworkId) {
    case 'angular':
    case 'react':
    case 'vue':
    case 'svelte':
    case 'vanilla':
    case 'astro':
    case 'next':
      // Next.js uses globals.css for global styles with cascade layers
      return CASCADE_LAYER_IMPORTS;
    case 'nuxt':
      return "// Add to nuxt.config.ts:\n// css: ['apexcss/base', 'apexcss/utilities', 'apexcss/themes']\n";
    default:
      return CASCADE_LAYER_IMPORTS;
  }
}

/**
 * Add import statement to a file
 * @param {string} filePath - Path to the file
 * @param {string} importStatement - Import statement to add
 * @param {string} frameworkId - Framework identifier
 */
export function addImportToFile(filePath, importStatement, frameworkId) {
  const content = readFileSync(filePath, 'utf-8');

  // Check if already imported
  if (content.includes('apexcss') || content.includes('apex.css')) {
    return; // Already has import
  }

  let newContent;

  // Check if this is a CSS file (for CSS cascade layer imports)
  const isCSSFile = filePath.endsWith('.css') || filePath.endsWith('.scss');

  if (isCSSFile) {
    // For CSS files, add cascade layer imports at the top
    newContent = importStatement + content;
  } else if (
    frameworkId === 'react' ||
    frameworkId === 'vue' ||
    frameworkId === 'svelte' ||
    frameworkId === 'astro' ||
    frameworkId === 'vanilla'
  ) {
    // Add after other JS imports, before code
    const lines = content.split('\n');
    let lastImportIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('require(')) {
        lastImportIndex = i;
      }
    }

    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, importStatement.trim());
      newContent = lines.join('\n');
    } else {
      newContent = importStatement + content;
    }
  } else {
    // Default: add at the top
    newContent = importStatement + content;
  }

  writeFileSync(filePath, newContent);
}
