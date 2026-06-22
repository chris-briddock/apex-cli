/**
 * Init command - Initialize ApexCSS configuration in user's project
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { generateSampleConfig } from '../utils/config-loader.ts';
import {
  detectFramework,
  FRAMEWORKS,
  type FrameworkInfo,
  getAvailableFrameworks,
  getRecommendedOutputDir
} from '../utils/framework-detector.ts';
import { logger } from '../utils/logger.ts';

interface InitOptions {
  configPath: string;
  outputDir: string;
  framework?: string;
  addImport?: boolean;
  interactive?: boolean;
}

interface PromptResult {
  selectedFramework: FrameworkInfo;
  outputDir: string;
  addImport: boolean;
}

/**
 * Prompt user for initialization options
 */
async function promptForOptions(framework: FrameworkInfo, options: InitOptions): Promise<PromptResult> {
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
      when: () => !!(framework.entryFile || framework.id !== 'vanilla')
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
 */
async function getUserOptions(
  framework: FrameworkInfo,
  options: InitOptions,
  cwd = process.cwd()
): Promise<PromptResult> {
  // Always use interactive mode to ask about defaults first
  let result: PromptResult = {
    selectedFramework: framework,
    outputDir: options.outputDir,
    addImport: options.addImport ?? true
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
 */
async function handleExistingConfig(configPath: string, useInteractive: boolean): Promise<boolean> {
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
 */
function setupGitignore(cwd: string, outputDir: string): void {
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
 */
function addFrameworkImport(cwd: string, framework: FrameworkInfo, outputDir: string): void {
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
    logger.warn(`Could not add import automatically: ${(error as Error).message}`);
    logger.info(`Manually add: ${logger.cmd(importStatement.trim())}`);
  }
}

/**
 * Initialize ApexCSS in the user's project
 */
export async function initCommand(options: InitOptions): Promise<void> {
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
  const shouldContinue = await handleExistingConfig(configPath, options.interactive ?? true);

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
 */
function setupPackageJsonScripts(cwd: string): void {
  const packageJsonPath = resolve(cwd, 'package.json');

  if (!existsSync(packageJsonPath)) {
    logger.warn('No package.json found. Skipping npm scripts setup.');
    logger.info('To create one, run: npm init');
    return;
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as { scripts?: Record<string, string> };

    // Ensure scripts object exists
    packageJson.scripts = packageJson.scripts || {};

    // Add ApexCSS scripts if they don't exist
    const scripts: Record<string, string> = {
      'apexcss:build': 'npx apexcss-cli build',
      'apexcss:watch': 'npx apexcss-cli watch'
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
    logger.warn(`Could not update package.json: ${(error as Error).message}`);
  }
}

/**
 * Prompt for overwrite confirmation
 */
export async function promptOverwrite(): Promise<{ overwrite: boolean }> {
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
 */
const CASCADE_LAYER_IMPORTS = `@layer base, utilities, themes;

@import 'apexcss/base' layer(base);
@import 'apexcss/utilities' layer(utilities);
@import 'apexcss/themes' layer(themes);
`;

/**
 * Get the appropriate import statement for the framework
 */
export function getImportStatement(frameworkId: string, _outputDir?: string): string {
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
 * Find the insertion point for an import statement in JS content
 */
export function insertJsImport(content: string, importStatement: string): string {
  const lines = content.split('\n');
  let lastImportIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();
    if (trimmedLine.startsWith('import ') || trimmedLine.includes('require(')) {
      lastImportIndex = i;
    }
  }

  if (lastImportIndex >= 0) {
    lines.splice(lastImportIndex + 1, 0, importStatement.trim());
    return lines.join('\n');
  }

  return importStatement + content;
}

/**
 * Add import statement to a file
 */
export function addImportToFile(filePath: string, importStatement: string, frameworkId: string): void {
  const content = readFileSync(filePath, 'utf-8');

  // Check if already imported
  if (content.includes('apexcss') || content.includes('apex.css')) {
    return; // Already has import
  }

  let newContent: string;

  // Check if this is a CSS file (for CSS cascade layer imports)
  const isCSSFile = filePath.endsWith('.css') || filePath.endsWith('.scss');

  if (isCSSFile) {
    // For CSS files, add cascade layer imports at the top
    newContent = importStatement + content;
  } else {
    switch (frameworkId) {
      case 'react':
      case 'vue':
      case 'svelte':
      case 'astro':
      case 'vanilla': {
        newContent = insertJsImport(content, importStatement);
        break;
      }
      default: {
        // Default: add at the top
        newContent = importStatement + content;
      }
    }
  }

  writeFileSync(filePath, newContent);
}
