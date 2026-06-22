/**
 * Config Modifier Utility
 * Handles reading, diffing, and modifying apex.config.js files
 */

import { constants } from 'node:fs';
import { access, copyFile, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

interface ConfigChange {
  feature: string;
  oldValue: boolean | unknown;
  newValue: boolean | unknown;
  action: 'disable' | 'enable';
}

interface DiffResult {
  changes: ConfigChange[];
  totalChanges: number;
  disabled: ConfigChange[];
  enabled: ConfigChange[];
}

interface SavingsInfo {
  total?: number;
  featureSizes?: Record<string, number>;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Read config file content
 */
export async function readConfigFile(configPath: string): Promise<string> {
  const fullPath = resolve(configPath);
  return await readFile(fullPath, 'utf-8');
}

/**
 * Check if a config file exists
 */
export async function configExists(configPath: string): Promise<boolean> {
  try {
    await access(resolve(configPath), constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a timestamped backup of the config file so successive runs don't overwrite each other
 */
export async function createBackup(configPath: string): Promise<string> {
  const fullPath = resolve(configPath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${fullPath}.${timestamp}.backup`;
  await copyFile(fullPath, backupPath);
  return backupPath;
}

/**
 * Generate a diff between current and proposed config
 */
export function generateDiff(
  currentConfig: { features?: Record<string, boolean> },
  proposedConfig: { features?: Record<string, boolean> }
): DiffResult {
  const changes: ConfigChange[] = [];
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
 */
export function formatDiff(diff: DiffResult, savings: SavingsInfo): string {
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
 */
export async function updateConfigFile(
  configPath: string,
  currentConfig: { features?: Record<string, boolean> },
  newFeatures: Record<string, boolean>
): Promise<void> {
  const content = await readConfigFile(configPath);

  // Create a new features section
  const updatedContent = updateFeaturesInContent(content, currentConfig.features || {}, newFeatures);

  await writeFile(resolve(configPath), updatedContent, 'utf-8');
}

/**
 * Update features section in config content
 * Uses regex replacement to preserve formatting
 */
function updateFeaturesInContent(
  content: string,
  oldFeatures: Record<string, boolean>,
  newFeatures: Record<string, boolean>
): string {
  let updatedContent = content;

  // Replace each feature value
  for (const [feature, newValue] of Object.entries(newFeatures)) {
    const oldValue = oldFeatures[feature];

    if (oldValue !== newValue) {
      // Determine the string representation of the old value
      let oldValueStr: string;
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
 */
export function buildUpdatedConfig(
  currentConfig: { features?: Record<string, boolean> },
  featuresToDisable: string[]
): Record<string, unknown> {
  const updatedConfig = structuredClone(currentConfig) as Record<string, unknown>;

  if (!updatedConfig.features) {
    updatedConfig.features = {};
  }

  for (const feature of featuresToDisable) {
    (updatedConfig.features as Record<string, boolean>)[feature] = false;
  }

  return updatedConfig;
}

/**
 * Generate a summary of changes
 */
export function generateSummary(diff: DiffResult, savings: number): string {
  const parts: string[] = [];

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
 */
export function validateChanges(diff: DiffResult): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

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
 */
export async function parseConfigFile(configPath: string): Promise<{ features: Record<string, boolean> }> {
  const content = await readConfigFile(configPath);

  // Try to extract features object using regex
  const featuresRegex = /features\s*:\s*\{([^}]*)\}/s;
  const featuresMatch = featuresRegex.exec(content);

  if (!featuresMatch) {
    throw new Error('Could not find features object in config file');
  }

  const featuresContent = featuresMatch[1];
  const features: Record<string, boolean> = {};

  // Extract individual feature values
  const featurePattern = /(\w+)\s*:\s*(true|false)/g;
  let match: RegExpExecArray | null;

  while ((match = featurePattern.exec(featuresContent)) !== null) {
    const [, key, value] = match;
    features[key] = value === 'true';
  }

  return { features };
}

/**
 * Generate a new config file content with all features enabled
 * Used for creating a fresh config
 */
export function generateConfigContent(features: Record<string, boolean>): string {
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
