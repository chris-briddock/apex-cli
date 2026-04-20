/**
 * Config Modifier Utility
 * Handles reading, diffing, and modifying apex.config.js files
 */

import { constants } from 'node:fs';
import { access, copyFile, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/**
 * Read config file content
 * @param {string} configPath - Path to config file
 * @returns {Promise<string>} Config file content
 */
export async function readConfigFile(configPath) {
  const fullPath = resolve(configPath);
  return await readFile(fullPath, 'utf-8');
}

/**
 * Check if a config file exists
 * @param {string} configPath - Path to config file
 * @returns {Promise<boolean>}
 */
export async function configExists(configPath) {
  try {
    await access(resolve(configPath), constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a backup of the config file
 * @param {string} configPath - Path to config file
 * @returns {Promise<string>} Path to backup file
 */
export async function createBackup(configPath) {
  const fullPath = resolve(configPath);
  const backupPath = `${fullPath}.backup`;
  await copyFile(fullPath, backupPath);
  return backupPath;
}

/**
 * Generate a diff between current and proposed config
 * @param {object} currentConfig - Current configuration
 * @param {object} proposedConfig - Proposed configuration
 * @returns {object} Diff result
 */
export function generateDiff(currentConfig, proposedConfig) {
  const changes = [];
  const currentFeatures = currentConfig?.features || {};
  const proposedFeatures = proposedConfig?.features || {};

  for (const [feature, newValue] of Object.entries(proposedFeatures)) {
    const oldValue = currentFeatures[feature];

    if (oldValue !== newValue) {
      changes.push({
        feature,
        oldValue,
        newValue,
        action: newValue === false ? 'disable' : 'enable'
      });
    }
  }

  return {
    changes,
    totalChanges: changes.length,
    disabled: changes.filter(c => c.action === 'disable'),
    enabled: changes.filter(c => c.action === 'enable')
  };
}

/**
 * Format a diff for display
 * @param {object} diff - Diff object from generateDiff
 * @param {object} savings - Savings info from feature-mapper
 * @returns {string} Formatted diff string
 */
export function formatDiff(diff, savings) {
  const lines = [
    '',
    '╔══════════════════════════════════════════════════════════════╗',
    '║              Proposed Configuration Changes                   ║',
    '╚══════════════════════════════════════════════════════════════╝',
    ''
  ];

  if (diff.disabled.length > 0) {
    lines.push('📦 Features to DISABLE (not detected in codebase):', '');

    for (const change of diff.disabled) {
      const size = savings?.featureSizes?.[change.feature] || 0;
      const sizeText = size > 0 ? ` (~${size}KB)` : '';
      lines.push(`   • ${change.feature}${sizeText}`);
    }

    lines.push('');
  }

  if (diff.enabled.length > 0) {
    lines.push('✅ Features to ENABLE:', '');

    for (const change of diff.enabled) {
      lines.push(`   • ${change.feature}`);
    }

    lines.push('');
  }

  if (diff.totalChanges === 0) {
    lines.push('✨ No changes needed - configuration is already optimized!', '');
  } else {
    const totalSavings = savings?.total || 0;
    if (totalSavings > 0) {
      lines.push(`📊 Estimated bundle size reduction: ~${totalSavings}KB`, '');
    }
  }

  return lines.join('\n');
}

/**
 * Update config file with new feature values
 * Preserves original formatting and comments as much as possible
 * @param {string} configPath - Path to config file
 * @param {object} currentConfig - Current config object
 * @param {object} newFeatures - New features object
 * @returns {Promise<void>}
 */
export async function updateConfigFile(configPath, currentConfig, newFeatures) {
  const content = await readConfigFile(configPath);

  // Create a new features section
  const updatedContent = updateFeaturesInContent(content, currentConfig.features, newFeatures);

  await writeFile(resolve(configPath), updatedContent, 'utf-8');
}

/**
 * Update features section in config content
 * Uses regex replacement to preserve formatting
 * @param {string} content - Original file content
 * @param {object} oldFeatures - Old features
 * @param {object} newFeatures - New features
 * @returns {string} Updated content
 */
function updateFeaturesInContent(content, oldFeatures, newFeatures) {
  let updatedContent = content;

  // Replace each feature value
  for (const [feature, newValue] of Object.entries(newFeatures)) {
    const oldValue = oldFeatures[feature];

    if (oldValue !== newValue) {
      // Determine the string representation of the old value
      let oldValueStr;
      if (oldValue === true) {
        oldValueStr = 'true';
      } else if (oldValue === false) {
        oldValueStr = 'false';
      } else {
        oldValueStr = String(oldValue);
      }

      // Match the feature key followed by colon and the old value
      // Handle both: `feature: true,` and `feature: true`
      const pattern = new RegExp(String.raw`(${feature}\s*:\s*)(${oldValueStr})(\s*,?)`, 'g');

      const replacement = `$1${newValue === true ? 'true' : 'false'}$3`;
      updatedContent = updatedContent.replace(pattern, replacement);
    }
  }

  return updatedContent;
}

/**
 * Build a complete config object with updated features
 * @param {object} currentConfig - Current config object
 * @param {string[]} featuresToDisable - Features to set to false
 * @returns {object} New config object
 */
export function buildUpdatedConfig(currentConfig, featuresToDisable) {
  const updatedConfig = structuredClone(currentConfig);

  if (!updatedConfig.features) {
    updatedConfig.features = {};
  }

  for (const feature of featuresToDisable) {
    updatedConfig.features[feature] = false;
  }

  return updatedConfig;
}

/**
 * Generate a summary of changes
 * @param {object} diff - Diff object
 * @param {number} savings - Estimated savings in KB
 * @returns {string} Summary string
 */
export function generateSummary(diff, savings) {
  const parts = [];

  if (diff.disabled.length > 0) {
    parts.push(`Disabled ${diff.disabled.length} unused feature(s)`);
  }

  if (diff.enabled.length > 0) {
    parts.push(`Enabled ${diff.enabled.length} feature(s)`);
  }

  if (savings > 0) {
    parts.push(`Saved ~${savings}KB`);
  }

  return parts.join(', ') || 'No changes made';
}

/**
 * Validate that proposed changes are safe
 * @param {object} diff - Diff object
 * @returns {object} Validation result
 */
export function validateChanges(diff) {
  const warnings = [];
  const errors = [];

  // Warn about disabling critical features
  const criticalFeatures = new Set(['display', 'spacing', 'typography']);
  for (const change of diff.disabled) {
    if (criticalFeatures.has(change.feature)) {
      warnings.push(`Disabling ${change.feature} may break basic styling`);
    }
  }

  // Error if trying to disable all features
  if (diff.disabled.length > 0 && diff.enabled.length === 0) {
    const allDisabled = diff.disabled.length >= 10;
    if (allDisabled) {
      warnings.push('Many features will be disabled - ensure this is intentional');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Parse a JavaScript config file to extract the features object
 * Note: This is a simplified parser that works with the standard apex.config.js format
 * @param {string} configPath - Path to config file
 * @returns {Promise<object>} Parsed config object
 */
export async function parseConfigFile(configPath) {
  const content = await readConfigFile(configPath);

  // Try to extract features object using regex
  const featuresRegex = /features\s*:\s*\{([^}]*)\}/s;
  const featuresMatch = featuresRegex.exec(content);

  if (!featuresMatch) {
    throw new Error('Could not find features object in config file');
  }

  const featuresContent = featuresMatch[1];
  const features = {};

  // Extract individual feature values
  const featurePattern = /(\w+)\s*:\s*(true|false)/g;
  let match;

  while ((match = featurePattern.exec(featuresContent)) !== null) {
    const [, key, value] = match;
    features[key] = value === 'true';
  }

  return { features };
}

/**
 * Generate a new config file content with all features enabled
 * Used for creating a fresh config
 * @param {object} features - Features object
 * @returns {string} Config file content
 */
export function generateConfigContent(features) {
  const featureLines = Object.entries(features)
    .map(([key, value]) => `    ${key}: ${value},`)
    .join('\n');

  return `/**
 * ApexCSS Configuration File
 *
 * This file controls which features are included in your CSS build.
 * Set features to false to exclude them and reduce bundle size.
 */

export default {
  features: {
${featureLines}
  },

  // Add other configuration options here
  // breakpoints: { ... },
  // colors: { ... },
  // spacing: { ... },
};
`;
}
