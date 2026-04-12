/**
 * Framework detection utility
 * Detects which framework the user's project is using
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Framework definitions with their detection criteria
 */
export const FRAMEWORKS = {
  next: {
    name: 'Next.js',
    detect: pkg => pkg.dependencies?.next || pkg.devDependencies?.next,
    entryFiles: ['src/app/globals.css', 'app/globals.css', 'src/styles/globals.css', 'styles/globals.css'],
    importStatement: "@import 'apexcss';\n",
    cssConfig:
      "// Add to globals.css:\n@import 'apexcss/base';\n@import 'apexcss/utilities';\n@import 'apexcss/themes';\n",
    configFile: 'next.config.js',
    fallbackFile: 'src/app/globals.css'
  },
  nuxt: {
    name: 'Nuxt',
    detect: pkg => pkg.dependencies?.nuxt || pkg.devDependencies?.nuxt,
    entryFiles: ['nuxt.config.ts', 'nuxt.config.js'],
    cssConfig: "css: ['~/apexcss/apex.css']",
    importStatement: null // Nuxt uses CSS config in nuxt.config
  },
  react: {
    name: 'React',
    detect: pkg => pkg.dependencies?.react && !pkg.dependencies?.next,
    entryFiles: ['src/index.css', 'src/main.css', 'src/styles.css'],
    importStatement: "@import 'apexcss';\n",
    fallbackFile: 'src/index.css'
  },
  vue: {
    name: 'Vue',
    detect: pkg => pkg.dependencies?.vue && !pkg.dependencies?.nuxt,
    entryFiles: ['src/style.css', 'src/styles.css', 'src/main.css'],
    importStatement: "@import 'apexcss';\n",
    fallbackFile: 'src/style.css'
  },
  angular: {
    name: 'Angular',
    detect: pkg => pkg.dependencies?.['@angular/core'],
    entryFiles: ['src/styles.css', 'src/styles.scss', 'angular.json'],
    importStatement: "@import 'apexcss';\n",
    configFile: 'angular.json',
    fallbackFile: 'src/styles.css'
  },
  svelte: {
    name: 'Svelte',
    detect: pkg => pkg.dependencies?.svelte || pkg.devDependencies?.svelte,
    entryFiles: ['src/app.css', 'src/style.css', 'src/styles.css'],
    importStatement: "@import 'apexcss';\n",
    fallbackFile: 'src/app.css'
  },
  astro: {
    name: 'Astro',
    detect: pkg => pkg.dependencies?.astro || pkg.devDependencies?.astro,
    entryFiles: ['src/styles/global.css', 'src/style.css', 'src/layouts/Layout.astro'],
    importStatement: "@import 'apexcss';\n",
    fallbackFile: 'src/styles/global.css'
  },
  vanilla: {
    name: 'Vanilla/Vite',
    detect: () => true, // Fallback
    entryFiles: ['src/style.css', 'src/styles.css', 'style.css', 'styles.css'],
    importStatement: "@import 'apexcss';\n",
    fallbackFile: 'src/style.css'
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
  const frameworkOrder = ['next', 'nuxt', 'angular', 'svelte', 'astro', 'react', 'vue', 'vanilla'];

  for (const frameworkId of frameworkOrder) {
    const framework = FRAMEWORKS[frameworkId];
    if (framework.detect(pkg)) {
      // Find the actual entry file that exists
      const existingEntry = framework.entryFiles.find(file => existsSync(resolve(cwd, file)));

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
    { id: 'astro', name: 'Astro' },
    { id: 'vanilla', name: 'Vanilla/Vite' }
  ];
}

/**
 * Get the default output directory for CSS builds
 * @param {string} [_frameworkId] - Framework identifier (unused - kept for API compatibility)
 * @returns {string} - Recommended output directory
 */
export function getRecommendedOutputDir(_frameworkId) {
  // All frameworks output to node_modules/apexcss/dist by default
  // This aligns with where the CSS source files reside (node_modules/apexcss/src)
  return 'node_modules/apexcss/dist';
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
    astro: { type: 'import', supportsCSSImport: true },
    vanilla: { type: 'import', supportsCSSImport: true }
  };

  return approaches[frameworkId] || { type: 'import' };
}
