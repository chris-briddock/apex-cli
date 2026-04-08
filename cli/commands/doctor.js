/**
 * Doctor command - Check system setup and diagnose issues
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { logger } from '../utils/logger.js';
import { detectFramework } from '../utils/framework-detector.js';

/**
 * Run diagnostic checks
 */
export async function doctorCommand() {
  logger.header('ApexCSS Doctor');
  logger.newline();

  const cwd = process.cwd();

  // Run all checks (synchronous)
  const results = [
    checkNodeVersion(),
    checkPackageManager(),
    checkApexcssInstallation(cwd),
    checkConfigFile(cwd),
    checkFramework(cwd),
    checkVite(cwd)
  ];

  // Display results
  logger.header('Diagnostic Results');
  logger.newline();

  let hasErrors = false;
  let hasWarnings = false;

  for (const result of results) {
    if (result.status === 'ok') {
      logger.success(`${result.name}: ${result.message}`);
    } else if (result.status === 'warn') {
      hasWarnings = true;
      logger.warn(`${result.name}: ${result.message}`);
      if (result.fix) {
        logger.info(`  Fix: ${result.fix}`);
      }
    } else if (result.status === 'error') {
      hasErrors = true;
      logger.error(`${result.name}: ${result.message}`);
      if (result.fix) {
        logger.info(`  Fix: ${result.fix}`);
      }
    }
  }

  logger.newline();

  if (hasErrors) {
    logger.error('Some checks failed. Please fix the issues above.');
    process.exit(1);
  } else if (hasWarnings) {
    logger.warn('Some checks have warnings. Review the messages above.');
  } else {
    logger.success('All checks passed! Your system is ready.');
  }
}

/**
 * Check Node.js version
 * @returns {object}
 */
function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = Number.parseInt(nodeVersion.slice(1).split('.')[0], 10);

  if (majorVersion >= 18) {
    return {
      name: 'Node.js',
      status: 'ok',
      message: `v${nodeVersion} (supported)`
    };
  } else if (majorVersion >= 16) {
    return {
      name: 'Node.js',
      status: 'warn',
      message: `v${nodeVersion} (minimum recommended is v18+)`,
      fix: 'Upgrade to Node.js v18 or later'
    };
  } else {
    return {
      name: 'Node.js',
      status: 'error',
      message: `v${nodeVersion} (not supported)`,
      fix: 'Upgrade to Node.js v18 or later'
    };
  }
}

/**
 * Check package manager availability
 * @returns {object}
 */
function checkPackageManager() {
  const managers = [
    { name: 'npm', cmd: 'npm --version' },
    { name: 'pnpm', cmd: 'pnpm --version' },
    { name: 'yarn', cmd: 'yarn --version' }
  ];

  const available = [];

  for (const manager of managers) {
    try {
      const version = execSync(manager.cmd, { encoding: 'utf-8', stdio: 'pipe' }).trim();
      available.push(`${manager.name} v${version}`);
    } catch {
      // Package manager not available - expected if not installed
    }
  }

  if (available.length > 0) {
    return {
      name: 'Package Manager',
      status: 'ok',
      message: available.join(', ')
    };
  }

  return {
    name: 'Package Manager',
    status: 'error',
    message: 'None detected',
    fix: 'Install npm (comes with Node.js) or pnpm/yarn'
  };
}

/**
 * Check if ApexCSS is installed
 * @param {string} cwd
 * @returns {object}
 */
function checkApexcssInstallation(cwd) {
  const packageJsonPath = resolve(cwd, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return {
      name: 'ApexCSS Installation',
      status: 'warn',
      message: 'No package.json found',
      fix: 'Run "npm init" first, then "npm install apexcss"'
    };
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (deps.apexcss) {
      return {
        name: 'ApexCSS Installation',
        status: 'ok',
        message: `v${deps.apexcss} installed`
      };
    }

    return {
      name: 'ApexCSS Installation',
      status: 'warn',
      message: 'Not installed in this project',
      fix: 'Run "npm install apexcss"'
    };
  } catch {
    return {
      name: 'ApexCSS Installation',
      status: 'error',
      message: 'Could not parse package.json'
    };
  }
}

/**
 * Check for config file
 * @param {string} cwd
 * @returns {object}
 */
function checkConfigFile(cwd) {
  const configPath = resolve(cwd, 'apex.config.js');

  if (existsSync(configPath)) {
    return {
      name: 'Configuration File',
      status: 'ok',
      message: 'apex.config.js exists'
    };
  }

  return {
    name: 'Configuration File',
    status: 'warn',
    message: 'apex.config.js not found',
    fix: 'Run "npx apexcss init" to create a config file'
  };
}

/**
 * Check framework detection
 * @param {string} cwd
 * @returns {object}
 */
function checkFramework(cwd) {
  const framework = detectFramework(cwd);

  if (framework.detected) {
    return {
      name: 'Framework',
      status: 'ok',
      message: `${framework.name} detected`
    };
  }

  if (!framework.hasPackageJson) {
    return {
      name: 'Framework',
      status: 'warn',
      message: 'No package.json found',
      fix: 'Run "npm init" to create a project'
    };
  }

  return {
    name: 'Framework',
    status: 'warn',
    message: 'Could not detect framework (assuming vanilla)',
    fix: 'Specify framework with "npx apexcss init --framework=<name>"'
  };
}

/**
 * Check for Vite
 * @param {string} cwd
 * @returns {object}
 */
function checkVite(cwd) {
  const packageJsonPath = resolve(cwd, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return {
      name: 'Build Tool',
      status: 'warn',
      message: 'No package.json found'
    };
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (deps.vite) {
      return {
        name: 'Build Tool',
        status: 'ok',
        message: `Vite v${deps.vite} detected (recommended)`
      };
    }

    if (deps.webpack || deps['@angular/cli'] || deps.next || deps.nuxt) {
      return {
        name: 'Build Tool',
        status: 'ok',
        message: 'Build tool detected'
      };
    }

    return {
      name: 'Build Tool',
      status: 'warn',
      message: 'No build tool detected',
      fix: 'Install Vite for best experience: "npm install -D vite"'
    };
  } catch {
    return {
      name: 'Build Tool',
      status: 'warn',
      message: 'Could not check build tools'
    };
  }
}
