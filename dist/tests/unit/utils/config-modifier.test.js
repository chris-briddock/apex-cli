import assert from 'node:assert';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { buildUpdatedConfig, configExists, createBackup, formatDiff, generateConfigContent, generateDiff, generateSummary, parseConfigFile, readConfigFile, updateConfigFile, validateChanges } from '../../../cli/utils/config-modifier.js';
describe('config-modifier', () => {
    let tempDir;
    beforeEach(async () => {
        tempDir = await mkdtemp(join(tmpdir(), 'apexcss-test-'));
    });
    afterEach(async () => {
        await rm(tempDir, { recursive: true, force: true });
    });
    describe('configExists', () => {
        it('should return true for existing file', async () => {
            const configPath = join(tempDir, 'test.config.js');
            await writeFile(configPath, 'export default {};');
            const exists = await configExists(configPath);
            assert.strictEqual(exists, true);
        });
        it('should return false for non-existing file', async () => {
            const configPath = join(tempDir, 'nonexistent.config.js');
            const exists = await configExists(configPath);
            assert.strictEqual(exists, false);
        });
    });
    describe('readConfigFile', () => {
        it('should read config file content', async () => {
            const configPath = join(tempDir, 'test.config.js');
            const content = 'export default { features: { flex: true } };';
            await writeFile(configPath, content);
            const read = await readConfigFile(configPath);
            assert.strictEqual(read, content);
        });
        it('should throw error for non-existing file', async () => {
            const configPath = join(tempDir, 'nonexistent.config.js');
            await assert.rejects(async () => {
                await readConfigFile(configPath);
            });
        });
    });
    describe('createBackup', () => {
        it('should create backup file', async () => {
            const configPath = join(tempDir, 'test.config.js');
            const content = 'export default { features: {} };';
            await writeFile(configPath, content);
            const backupPath = await createBackup(configPath);
            const backupContent = await readFile(backupPath, 'utf-8');
            assert.strictEqual(backupContent, content);
            assert(backupPath.endsWith('.backup'));
        });
    });
    describe('generateDiff', () => {
        it('should detect disabled features', () => {
            const current = {
                features: {
                    display: true,
                    grid: true,
                    transforms3d: true
                }
            };
            const proposed = {
                features: {
                    display: true,
                    grid: false,
                    transforms3d: false
                }
            };
            const diff = generateDiff(current, proposed);
            assert.strictEqual(diff.totalChanges, 2);
            assert.strictEqual(diff.disabled.length, 2);
            assert(diff.disabled.some(c => c.feature === 'grid'));
            assert(diff.disabled.some(c => c.feature === 'transforms3d'));
        });
        it('should detect enabled features', () => {
            const current = {
                features: {
                    display: false,
                    grid: true
                }
            };
            const proposed = {
                features: {
                    display: true,
                    grid: true
                }
            };
            const diff = generateDiff(current, proposed);
            assert.strictEqual(diff.totalChanges, 1);
            assert.strictEqual(diff.enabled.length, 1);
            assert.strictEqual(diff.enabled[0].feature, 'display');
        });
        it('should return empty diff when no changes', () => {
            const current = {
                features: {
                    display: true,
                    grid: false
                }
            };
            const proposed = {
                features: {
                    display: true,
                    grid: false
                }
            };
            const diff = generateDiff(current, proposed);
            assert.strictEqual(diff.totalChanges, 0);
            assert.strictEqual(diff.disabled.length, 0);
            assert.strictEqual(diff.enabled.length, 0);
        });
        it('should include old and new values', () => {
            const current = {
                features: {
                    grid: true
                }
            };
            const proposed = {
                features: {
                    grid: false
                }
            };
            const diff = generateDiff(current, proposed);
            assert.strictEqual(diff.disabled[0].oldValue, true);
            assert.strictEqual(diff.disabled[0].newValue, false);
        });
    });
    describe('formatDiff', () => {
        it('should format diff with disabled features', () => {
            const diff = {
                changes: [
                    { feature: 'grid', oldValue: true, newValue: false, action: 'disable' },
                    { feature: 'transforms3d', oldValue: true, newValue: false, action: 'disable' }
                ],
                totalChanges: 2,
                disabled: [
                    { feature: 'grid', oldValue: true, newValue: false, action: 'disable' },
                    { feature: 'transforms3d', oldValue: true, newValue: false, action: 'disable' }
                ],
                enabled: []
            };
            const savings = {
                total: 32,
                featureSizes: {
                    grid: 20,
                    transforms3d: 12
                }
            };
            const formatted = formatDiff(diff, savings);
            assert(formatted.includes('grid'));
            assert(formatted.includes('transforms3d'));
            assert(formatted.includes('32KB'));
            assert(formatted.includes('DISABLE'));
        });
        it('should format diff with enabled features', () => {
            const diff = {
                changes: [
                    { feature: 'display', oldValue: false, newValue: true, action: 'enable' }
                ],
                totalChanges: 1,
                disabled: [],
                enabled: [{ feature: 'display', oldValue: false, newValue: true, action: 'enable' }]
            };
            const formatted = formatDiff(diff, { total: 0, featureSizes: {} });
            assert(formatted.includes('display'));
            assert(formatted.includes('ENABLE'));
        });
        it('should show no changes message when empty', () => {
            const diff = {
                changes: [],
                totalChanges: 0,
                disabled: [],
                enabled: []
            };
            const formatted = formatDiff(diff, { total: 0, featureSizes: {} });
            assert(formatted.includes('already optimized'));
        });
    });
    describe('updateConfigFile', () => {
        it('should update feature values in config', async () => {
            const configPath = join(tempDir, 'test.config.js');
            const content = `export default {
  features: {
    display: true,
    grid: true,
    spacing: true
  }
};`;
            await writeFile(configPath, content);
            const currentConfig = {
                features: {
                    display: true,
                    grid: true,
                    spacing: true
                }
            };
            const newFeatures = {
                display: true,
                grid: false,
                spacing: true
            };
            await updateConfigFile(configPath, currentConfig, newFeatures);
            const updated = await readFile(configPath, 'utf-8');
            assert(updated.includes('grid: false'));
            assert(updated.includes('display: true'));
            assert(updated.includes('spacing: true'));
        });
        it('should preserve formatting and comments', async () => {
            const configPath = join(tempDir, 'test.config.js');
            const content = `/**
 * My Config
 */
export default {
  // Features
  features: {
    display: true,
    grid: true
  }
};`;
            await writeFile(configPath, content);
            const currentConfig = {
                features: {
                    display: true,
                    grid: true
                }
            };
            const newFeatures = {
                display: true,
                grid: false
            };
            await updateConfigFile(configPath, currentConfig, newFeatures);
            const updated = await readFile(configPath, 'utf-8');
            assert(updated.includes('/**'));
            assert(updated.includes('* My Config'));
            assert(updated.includes('// Features'));
        });
    });
    describe('buildUpdatedConfig', () => {
        it('should create updated config with disabled features', () => {
            const currentConfig = {
                features: {
                    display: true,
                    grid: true,
                    spacing: true
                },
                colors: {
                    primary: 'blue'
                }
            };
            const featuresToDisable = ['grid'];
            const updated = buildUpdatedConfig(currentConfig, featuresToDisable);
            assert.strictEqual(updated.features.display, true);
            assert.strictEqual(updated.features.grid, false);
            assert.strictEqual(updated.features.spacing, true);
            assert.strictEqual(updated.colors.primary, 'blue');
        });
        it('should create features object if missing', () => {
            const currentConfig = {
                features: {},
                colors: {
                    primary: 'blue'
                }
            };
            const featuresToDisable = ['grid'];
            const updated = buildUpdatedConfig(currentConfig, featuresToDisable);
            assert.strictEqual(updated.features.grid, false);
        });
    });
    describe('validateChanges', () => {
        it('should warn about disabling critical features', () => {
            const diff = {
                changes: [
                    { feature: 'display', oldValue: true, newValue: false, action: 'disable' },
                    { feature: 'spacing', oldValue: true, newValue: false, action: 'disable' }
                ],
                totalChanges: 2,
                disabled: [
                    { feature: 'display', oldValue: true, newValue: false, action: 'disable' },
                    { feature: 'spacing', oldValue: true, newValue: false, action: 'disable' }
                ],
                enabled: []
            };
            const validation = validateChanges(diff);
            assert.strictEqual(validation.valid, true);
            assert(validation.warnings.length > 0);
            assert(validation.warnings.some(w => w.includes('display')));
            assert(validation.warnings.some(w => w.includes('spacing')));
        });
        it('should warn when many features disabled', () => {
            const diff = {
                changes: [
                    { feature: 'grid', oldValue: true, newValue: false, action: 'disable' },
                    { feature: 'transforms3d', oldValue: true, newValue: false, action: 'disable' },
                    { feature: 'filters', oldValue: true, newValue: false, action: 'disable' },
                    { feature: 'animations', oldValue: true, newValue: false, action: 'disable' },
                    { feature: 'transitions', oldValue: true, newValue: false, action: 'disable' },
                    { feature: 'shadows', oldValue: true, newValue: false, action: 'disable' },
                    { feature: 'opacity', oldValue: true, newValue: false, action: 'disable' },
                    { feature: 'overflow', oldValue: true, newValue: false, action: 'disable' },
                    { feature: 'objectFit', oldValue: true, newValue: false, action: 'disable' },
                    { feature: 'cursor', oldValue: true, newValue: false, action: 'disable' },
                    { feature: 'userSelect', oldValue: true, newValue: false, action: 'disable' }
                ],
                totalChanges: 11,
                disabled: [
                    { feature: 'grid', oldValue: true, newValue: false, action: 'disable' },
                    { feature: 'transforms3d', oldValue: true, newValue: false, action: 'disable' },
                    { feature: 'filters', oldValue: true, newValue: false, action: 'disable' },
                    { feature: 'animations', oldValue: true, newValue: false, action: 'disable' },
                    { feature: 'transitions', oldValue: true, newValue: false, action: 'disable' },
                    { feature: 'shadows', oldValue: true, newValue: false, action: 'disable' },
                    { feature: 'opacity', oldValue: true, newValue: false, action: 'disable' },
                    { feature: 'overflow', oldValue: true, newValue: false, action: 'disable' },
                    { feature: 'objectFit', oldValue: true, newValue: false, action: 'disable' },
                    { feature: 'cursor', oldValue: true, newValue: false, action: 'disable' },
                    { feature: 'userSelect', oldValue: true, newValue: false, action: 'disable' }
                ],
                enabled: []
            };
            const validation = validateChanges(diff);
            assert(validation.warnings.some(w => w.includes('Many features')));
        });
        it('should return valid for safe changes', () => {
            const diff = {
                changes: [
                    { feature: 'transforms3d', oldValue: true, newValue: false, action: 'disable' },
                    { feature: 'filters', oldValue: true, newValue: false, action: 'disable' }
                ],
                totalChanges: 2,
                disabled: [
                    { feature: 'transforms3d', oldValue: true, newValue: false, action: 'disable' },
                    { feature: 'filters', oldValue: true, newValue: false, action: 'disable' }
                ],
                enabled: []
            };
            const validation = validateChanges(diff);
            assert.strictEqual(validation.valid, true);
            assert.strictEqual(validation.warnings.length, 0);
            assert.strictEqual(validation.errors.length, 0);
        });
    });
    describe('generateSummary', () => {
        it('should summarize disabled features', () => {
            const diff = {
                changes: [
                    { feature: 'grid', oldValue: true, newValue: false, action: 'disable' },
                    { feature: 'transforms3d', oldValue: true, newValue: false, action: 'disable' }
                ],
                totalChanges: 2,
                disabled: [
                    { feature: 'grid', oldValue: true, newValue: false, action: 'disable' },
                    { feature: 'transforms3d', oldValue: true, newValue: false, action: 'disable' }
                ],
                enabled: []
            };
            const summary = generateSummary(diff, 32);
            assert(summary.includes('Disabled'));
            assert(summary.includes('2'));
            assert(summary.includes('32KB'));
        });
        it('should summarize enabled features', () => {
            const diff = {
                changes: [
                    { feature: 'display', oldValue: false, newValue: true, action: 'enable' }
                ],
                totalChanges: 1,
                disabled: [],
                enabled: [{ feature: 'display', oldValue: false, newValue: true, action: 'enable' }]
            };
            const summary = generateSummary(diff, 0);
            assert(summary.includes('Enabled'));
            assert(summary.includes('1'));
        });
        it('should return no changes message when empty', () => {
            const diff = {
                changes: [],
                totalChanges: 0,
                disabled: [],
                enabled: []
            };
            const summary = generateSummary(diff, 0);
            assert.strictEqual(summary, 'No changes made');
        });
    });
    describe('parseConfigFile', () => {
        it('should parse features from config file', async () => {
            const configPath = join(tempDir, 'test.config.js');
            const content = `export default {
        features: {
          display: true,
          grid: false,
          spacing: true
        }
      };`;
            await writeFile(configPath, content);
            const parsed = await parseConfigFile(configPath);
            assert.strictEqual(parsed.features.display, true);
            assert.strictEqual(parsed.features.grid, false);
            assert.strictEqual(parsed.features.spacing, true);
        });
        it('should throw error when features not found', async () => {
            const configPath = join(tempDir, 'test.config.js');
            const content = 'export default { colors: {} };';
            await writeFile(configPath, content);
            await assert.rejects(async () => {
                await parseConfigFile(configPath);
            });
        });
    });
    describe('generateConfigContent', () => {
        it('should generate valid config content', () => {
            const features = {
                display: true,
                grid: false
            };
            const content = generateConfigContent(features);
            assert(content.includes('export default'));
            assert(content.includes('display: true'));
            assert(content.includes('grid: false'));
            assert(content.includes('features:'));
        });
        it('should include all features', () => {
            const features = {
                display: true,
                flexbox: true,
                grid: false,
                spacing: true
            };
            const content = generateConfigContent(features);
            assert(content.includes('display: true'));
            assert(content.includes('flexbox: true'));
            assert(content.includes('grid: false'));
            assert(content.includes('spacing: true'));
        });
    });
});
//# sourceMappingURL=config-modifier.test.js.map