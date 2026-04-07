/**
 * Framework detection utility
 * Detects which framework the user's project is using
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Framework definitions with their detection criteria
 */
const FRAMEWORKS = {
  next: {
    name: 'Next.js',
    detect: (pkg) => pkg.dependencies?.next || pkg.devDependencies?.next,
    entryFiles: ['app/globals.css', 'styles/globals.css', 'src/app/globals.css'],
    importStatement: '@import \'apexcss\';\n',
    configFile: 'next.config.js'
  },
  nuxt: {
    name: 'Nuxt',
    detect: (pkg) => pkg.dependencies?.nuxt || pkg.devDependencies?.nuxt,
    entryFiles: ['nuxt.config.ts', 'nuxt.config.js'],
    cssConfig: 'css: [\'~/apexcss/apex.css\']',
    importStatement: null // Nuxt uses CSS config in nuxt.config
  },
  react: {
    name: 'React',
    detect: (pkg) => pkg.dependencies?.react && !pkg.dependencies?.next,
    entryFiles: ['src/main.tsx', 'src/main.jsx', 'src/index.tsx', 'src/index.jsx', 'main.tsx', 'main.jsx'],
    importStatement: 'import \'apexcss\';\n',
    fallbackFile: 'src/main.tsx'
  },
  vue: {
    name: 'Vue',
    detect: (pkg) => pkg.dependencies?.vue && !pkg.dependencies?.nuxt,
    entryFiles: ['src/main.ts', 'src/main.js', 'main.ts', 'main.js'],
    importStatement: 'import \'apexcss\';\n',
    fallbackFile: 'src/main.ts'
  },
  angular: {
    name: 'Angular',
    detect: (pkg) => pkg.dependencies?.['@angular/core'],
    entryFiles: ['src/styles.css', 'src/styles.scss', 'angular.json'],
    importStatement: '@import \'apexcss\';\n',
    configFile: 'angular.json'
  },
  svelte: {
    name: 'Svelte',
    detect: (pkg) => pkg.dependencies?.svelte || pkg.devDependencies?.svelte,
    entryFiles: ['src/main.ts', 'src/main.js', 'src/App.svelte', 'src/routes/+layout.svelte'],
    importStatement: 'import \'apexcss\';\n',
    fallbackFile: 'src/main.ts'
  },
  vanilla: {
    name: 'Vanilla/Vite',
    detect: () => true, // Fallback
    entryFiles: ['main.js', 'main.ts', 'index.js', 'index.ts', 'src/main.js', 'src/main.ts'],
    importStatement: 'import \'apexcss\';\n',
    fallbackFile: 'main.js'
  }
};

/**
 * Detect the framework being used in the current project
 * @param {string} cwd - Current working directory
 * @returns {object} - Detected framework info
 */
export function detectFramework(cwd = process.cwd()) {
  // Read package.json
  const packageJsonPath = resolve(cwd, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return {
      id: 'vanilla',
      ...FRAMEWORKS.vanilla,
      detected: false,
      hasPackageJson: false
    };
  }

  let pkg;
  try {
    pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  } catch {
    return {
      id: 'vanilla',
      ...FRAMEWORKS.vanilla,
      detected: false,
      hasPackageJson: true,
      parseError: true
    };
  }

  // Check each framework in order (more specific first)
  const frameworkOrder = ['next', 'nuxt', 'angular', 'svelte', 'react', 'vue', 'vanilla'];

  for (const frameworkId of frameworkOrder) {
    const framework = FRAMEWORKS[frameworkId];
    if (framework.detect(pkg)) {
      // Find the actual entry file that exists
      const existingEntry = framework.entryFiles.find(file =>
        existsSync(resolve(cwd, file))
      );

      return {
        id: frameworkId,
        ...framework,
        detected: frameworkId !== 'vanilla',
        hasPackageJson: true,
        entryFile: existingEntry || framework.fallbackFile,
        packageJson: pkg
      };
    }
  }

  // Should not reach here due to vanilla fallback
  return {
    id: 'vanilla',
    ...FRAMEWORKS.vanilla,
    detected: false,
    hasPackageJson: true
  };
}

/**
 * Get all available frameworks for selection
 * @returns {Array} - List of framework options
 */
export function getAvailableFrameworks() {
  return [
    { id: 'next', name: 'Next.js' },
    { id: 'nuxt', name: 'Nuxt' },
    { id: 'react', name: 'React (Vite)' },
    { id: 'vue', name: 'Vue (Vite)' },
    { id: 'angular', name: 'Angular' },
    { id: 'svelte', name: 'Svelte (Vite)' },
    { id: 'vanilla', name: 'Vanilla/Vite' }
  ];
}

/**
 * Get framework-specific output directory recommendation
 * @param {string} frameworkId - Framework identifier
 * @returns {string} - Recommended output directory
 */
export function getRecommendedOutputDir(frameworkId) {
  const recommendations = {
    next: './dist/',
    nuxt: './dist/',
    react: './dist/',
    vue: './dist/',
    angular: './dist/',
    svelte: './dist/',
    vanilla: './dist/'
  };

  return recommendations[frameworkId] || './dist/';
}

/**
 * Check if a framework uses a specific configuration approach
 * @param {string} frameworkId - Framework identifier
 * @returns {object} - Configuration approach
 */
export function getFrameworkConfigApproach(frameworkId) {
  const approaches = {
    next: { type: 'import', supportsCSSImport: true },
    nuxt: { type: 'config', configKey: 'css' },
    react: { type: 'import', supportsCSSImport: true },
    vue: { type: 'import', supportsCSSImport: true },
    angular: { type: 'styles', supportsGlobalStyles: true },
    svelte: { type: 'import', supportsCSSImport: true },
    vanilla: { type: 'import', supportsCSSImport: true }
  };

  return approaches[frameworkId] || { type: 'import' };
}
