/**
 * Init command - Initialize ApexCSS configuration in user's project
 */

import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { logger } from '../utils/logger.js';
import { generateSampleConfig } from '../utils/config-loader.js';
import { detectFramework, getRecommendedOutputDir, getAvailableFrameworks } from '../utils/framework-detector.js';

/**
 * Initialize ApexCSS in the user's project
 * @param {object} options - Command options
 */
export async function initCommand(options) {
  const cwd = process.cwd();

  logger.header('ApexCSS Initialization');
  logger.newline();

  // Detect framework
  const framework = detectFramework(cwd);

  logger.info(`Detected framework: ${framework.name}`);
  logger.newline();

  // Interactive prompts if not disabled
  let useInteractive = options.interactive;
  let selectedFramework = framework;
  let addImport = options.addImport;
  let outputDir = options.outputDir;

  if (useInteractive) {
    try {
      const { default: inquirer } = await import('inquirer');

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
          type: 'input',
          name: 'outputDir',
          message: 'CSS output directory:',
          default: outputDir || getRecommendedOutputDir(framework.id)
        },
        {
          type: 'confirm',
          name: 'addImport',
          message: framework.entryFile
            ? `Add import to ${framework.entryFile}?`
            : 'Add import to your main entry file?',
          default: true,
          when: () => framework.entryFile || framework.id !== 'vanilla'
        }
      ]);

      selectedFramework = { ...framework, id: answers.framework };
      outputDir = answers.outputDir;
      addImport = answers.addImport;

    } catch {
      // inquirer not available, fall back to non-interactive
      logger.warn('Interactive mode not available, using defaults');
      useInteractive = false;
    }
  }

  // Use specified framework if provided via CLI
  if (options.framework) {
    selectedFramework = { ...framework, id: options.framework };
  }

  // Ensure output directory exists
  const outputPath = resolve(cwd, outputDir);
  await mkdir(outputPath, { recursive: true });

  // Create config file
  const configPath = resolve(cwd, options.configPath);

  if (existsSync(configPath)) {
    logger.warn(`Config file already exists at ${options.configPath}`);
    const { overwrite } = useInteractive ? await promptOverwrite() : { overwrite: false };

    if (!overwrite) {
      logger.info('Skipping config creation');
      return;
    }
  }

  // Generate and write config
  const configContent = generateSampleConfig();
  writeFileSync(configPath, configContent);
  logger.success(`Created config file: ${logger.path(options.configPath)}`);

  // Create .gitignore suggestion
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

  // Add import to entry file if requested
  if (addImport && selectedFramework.entryFile) {
    const entryFilePath = resolve(cwd, selectedFramework.entryFile);

    if (existsSync(entryFilePath)) {
      const importStatement = getImportStatement(selectedFramework.id, outputDir);

      try {
        addImportToFile(entryFilePath, importStatement, selectedFramework.id);
        logger.success(`Added import to ${logger.path(selectedFramework.entryFile)}`);
      } catch (error) {
        logger.warn(`Could not add import automatically: ${error.message}`);
        logger.info(`Manually add: ${logger.cmd(importStatement.trim())}`);
      }
    } else {
      logger.warn(`Entry file not found: ${selectedFramework.entryFile}`);
      logger.info('Manually add import to your main entry file');
    }
  }

  logger.newline();
  logger.success('ApexCSS initialized successfully!');
  logger.newline();
  logger.info('Next steps:');
  logger.list([
    `Edit ${logger.path(options.configPath)} to customize your configuration`,
    `Run ${logger.cmd('npx apexcss build')} to generate your CSS`,
    `Run ${logger.cmd('npx apexcss watch')} during development`
  ]);
  logger.newline();
}

/**
 * Prompt for overwrite confirmation
 */
export async function promptOverwrite() {
  try {
    const { default: inquirer } = await import('inquirer');
    return await inquirer.prompt([{
      type: 'confirm',
      name: 'overwrite',
      message: 'Overwrite existing config file?',
      default: false
    }]);
  } catch {
    return { overwrite: false };
  }
}

/**
 * Get the appropriate import statement for the framework
 * @param {string} frameworkId - Framework identifier
 * @param {string} outputDir - Output directory
 * @returns {string} - Import statement
 */
export function getImportStatement(frameworkId, outputDir) {
  // Remove leading ./ for cleaner imports
  const cleanPath = outputDir.replace(/^\.\//, '');

  switch (frameworkId) {
  case 'next':
    return `import '${cleanPath}/apex.css';\n`;
  case 'react':
  case 'vue':
  case 'svelte':
  case 'vanilla':
    return `import './${cleanPath}/apex.css';\n`;
  case 'angular':
    return `@import '${cleanPath}/apex.css';\n`;
  case 'nuxt':
    return `// Add to nuxt.config.ts:\n// css: ['${cleanPath}/apex.css']\n`;
  default:
    return `import '${cleanPath}/apex.css';\n`;
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

  switch (frameworkId) {
  case 'react':
  case 'vue':
  case 'svelte':
  case 'vanilla': {
    // Add after other imports, before code
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
    break;
  }

  case 'angular': {
    // Add to the top of styles file
    newContent = importStatement + content;
    break;
  }

  default:
    newContent = importStatement + content;
  }

  writeFileSync(filePath, newContent);
}
