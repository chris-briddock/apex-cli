/**
 * Config loader tests
 */

import assert from 'node:assert';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import {
  defaultConfig,
  generateSampleConfig,
  isObject,
  loadConfig,
  mergeConfig,
  validateBreakpoints,
  validateColorChroma,
  validateColorHue,
  validateColors,
  validateFeatures
} from '../../../cli/utils/config-loader.js';

describe('config-loader', () => {
  let tempDir;
  let originalCwd;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'apex-config-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('defaultConfig', () => {
    it('should have required sections', () => {
      assert.ok(defaultConfig.features);
      assert.ok(defaultConfig.breakpoints);
      assert.ok(defaultConfig.spacing);
      assert.ok(defaultConfig.colors);
      assert.ok(defaultConfig.typography);
      assert.ok(defaultConfig.borderRadius);
      assert.ok(defaultConfig.shadows);
      assert.ok(defaultConfig.transition);
      assert.ok(defaultConfig.zIndex);
      assert.ok(defaultConfig.opacity);
    });

    it('should have core features enabled by default', () => {
      assert.strictEqual(defaultConfig.features.display, true);
      assert.strictEqual(defaultConfig.features.flexbox, true);
      assert.strictEqual(defaultConfig.features.grid, true);
      assert.strictEqual(defaultConfig.features.typography, true);
      assert.strictEqual(defaultConfig.features.colors, true);
    });

    it('should have standard breakpoints', () => {
      assert.strictEqual(defaultConfig.breakpoints.sm, '320px');
      assert.strictEqual(defaultConfig.breakpoints.md, '768px');
      assert.strictEqual(defaultConfig.breakpoints.lg, '1024px');
      assert.strictEqual(defaultConfig.breakpoints.xl, '1280px');
    });

    it('should have spacing scale', () => {
      assert.strictEqual(defaultConfig.spacing['1'], '0.25rem');
      assert.strictEqual(defaultConfig.spacing['4'], '1rem');
      assert.strictEqual(defaultConfig.spacing['8'], '2rem');
    });

    it('should have primary color configuration', () => {
      assert.ok(defaultConfig.colors.primary);
      assert.strictEqual(typeof defaultConfig.colors.primary.hue, 'number');
      assert.strictEqual(typeof defaultConfig.colors.primary.chroma, 'number');
      assert.ok(defaultConfig.colors.primary.lightnessScale);
    });
  });

  describe('loadConfig', () => {
    it('should return default config when file does not exist', () => {
      const config = loadConfig('non-existent.config.js');
      assert.ok(config.features);
      assert.strictEqual(config.features.display, true);
    });

    it('should load JSON config file', () => {
      const customConfig = {
        features: { display: false, flexbox: true }
      };
      writeFileSync(join(tempDir, 'test.config.json'), JSON.stringify(customConfig));

      const config = loadConfig('test.config.json');
      assert.strictEqual(config.features.display, false);
      assert.strictEqual(config.features.flexbox, true);
      // Other features should still be from default
      assert.strictEqual(config.features.grid, true);
    });

    it('should merge user config with defaults', () => {
      const customConfig = {
        breakpoints: { sm: '400px' }
      };
      writeFileSync(join(tempDir, 'test.config.json'), JSON.stringify(customConfig));

      const config = loadConfig('test.config.json');
      assert.strictEqual(config.breakpoints.sm, '400px');
      assert.strictEqual(config.breakpoints.md, '768px'); // from default
    });

    it('should throw on invalid config type', () => {
      writeFileSync(join(tempDir, 'invalid.config.json'), 'not valid json');

      try {
        loadConfig('invalid.config.json');
        assert.fail('Should have thrown');
      } catch (error) {
        assert.ok(error.message.includes('Failed to load config'));
      }
    });

    it('should validate feature toggles are booleans', () => {
      const customConfig = {
        features: { display: 'yes' }
      };
      writeFileSync(join(tempDir, 'invalid.config.json'), JSON.stringify(customConfig));

      try {
        loadConfig('invalid.config.json');
        assert.fail('Should have thrown');
      } catch (error) {
        assert.ok(error.message.includes('validation failed'));
      }
    });

    it('should validate breakpoints are valid CSS lengths', () => {
      const customConfig = {
        breakpoints: { sm: 'invalid' }
      };
      writeFileSync(join(tempDir, 'invalid.config.json'), JSON.stringify(customConfig));

      try {
        loadConfig('invalid.config.json');
        assert.fail('Should have thrown');
      } catch (error) {
        assert.ok(error.message.includes('validation failed'));
      }
    });

    it('should validate color hue is between 0 and 360', () => {
      const customConfig = {
        colors: {
          primary: { hue: 400, chroma: 0.1, lightnessScale: { 500: 50 } }
        }
      };
      writeFileSync(join(tempDir, 'invalid.config.json'), JSON.stringify(customConfig));

      try {
        loadConfig('invalid.config.json');
        assert.fail('Should have thrown');
      } catch (error) {
        assert.ok(error.message.includes('validation failed'));
      }
    });
  });

  describe('validation functions', () => {
    it('validateFeatures should validate boolean features', () => {
      const errors = [];
      validateFeatures({ display: true, flexbox: false }, errors);
      assert.strictEqual(errors.length, 0);
    });

    it('validateFeatures should error on non-boolean features', () => {
      const errors = [];
      validateFeatures({ display: 'yes' }, errors);
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0].includes('must be a boolean'));
    });

    it('validateBreakpoints should validate valid CSS lengths', () => {
      const errors = [];
      validateBreakpoints({ sm: '320px', md: '768px' }, errors);
      assert.strictEqual(errors.length, 0);
    });

    it('validateBreakpoints should error on invalid CSS lengths', () => {
      const errors = [];
      validateBreakpoints({ sm: 'invalid' }, errors);
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0].includes('must be a valid CSS length'));
    });

    it('validateBreakpoints should error on non-string values', () => {
      const errors = [];
      validateBreakpoints({ sm: 320 }, errors);
      assert.strictEqual(errors.length, 1);
    });

    it('validateColorHue should validate valid hue', () => {
      const errors = [];
      validateColorHue({ hue: 250 }, 'primary', errors);
      assert.strictEqual(errors.length, 0);
    });

    it('validateColorHue should error on hue > 360', () => {
      const errors = [];
      validateColorHue({ hue: 400 }, 'primary', errors);
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0].includes('must be between 0 and 360'));
    });

    it('validateColorHue should error on hue < 0', () => {
      const errors = [];
      validateColorHue({ hue: -10 }, 'primary', errors);
      assert.strictEqual(errors.length, 1);
    });

    it('validateColorHue should error on non-number hue', () => {
      const errors = [];
      validateColorHue({ hue: 'red' }, 'primary', errors);
      assert.strictEqual(errors.length, 1);
    });

    it('validateColorHue should skip undefined hue', () => {
      const errors = [];
      validateColorHue({}, 'primary', errors);
      assert.strictEqual(errors.length, 0);
    });

    it('validateColorChroma should validate valid chroma', () => {
      const errors = [];
      validateColorChroma({ chroma: 0.2 }, 'primary', errors);
      assert.strictEqual(errors.length, 0);
    });

    it('validateColorChroma should error on chroma > 0.4', () => {
      const errors = [];
      validateColorChroma({ chroma: 0.5 }, 'primary', errors);
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0].includes('must be between 0 and 0.4'));
    });

    it('validateColorChroma should error on chroma < 0', () => {
      const errors = [];
      validateColorChroma({ chroma: -0.1 }, 'primary', errors);
      assert.strictEqual(errors.length, 1);
    });

    it('validateColorChroma should skip undefined chroma', () => {
      const errors = [];
      validateColorChroma({}, 'primary', errors);
      assert.strictEqual(errors.length, 0);
    });

    it('validateColors should validate multiple colors', () => {
      const errors = [];
      validateColors(
        {
          primary: { hue: 250, chroma: 0.2 },
          secondary: { hue: 180, chroma: 0.15 }
        },
        errors
      );
      assert.strictEqual(errors.length, 0);
    });

    it('isObject should identify objects', () => {
      assert.strictEqual(isObject({}), true);
      assert.strictEqual(isObject({ a: 1 }), true);
      assert.strictEqual(isObject([]), false);
      assert.strictEqual(isObject(null), false);
      assert.strictEqual(isObject('string'), false);
      assert.strictEqual(isObject(123), false);
    });

    it('mergeConfig should merge simple objects', () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3, c: 4 };
      const result = mergeConfig(target, source);
      assert.strictEqual(result.a, 1);
      assert.strictEqual(result.b, 3);
      assert.strictEqual(result.c, 4);
    });

    it('mergeConfig should deep merge nested objects', () => {
      const target = { features: { display: true, flexbox: true } };
      const source = { features: { display: false } };
      const result = mergeConfig(target, source);
      assert.strictEqual(result.features.display, false);
      assert.strictEqual(result.features.flexbox, true);
    });

    it('mergeConfig should not mutate original target', () => {
      const target = { a: 1, nested: { b: 2 } };
      const source = { nested: { c: 3 } };
      const result = mergeConfig(target, source);
      assert.strictEqual(target.nested.c, undefined);
      assert.strictEqual(result.nested.c, 3);
    });

    it('mergeConfig should replace arrays, not merge them', () => {
      const target = { items: [1, 2] };
      const source = { items: [3, 4] };
      const result = mergeConfig(target, source);
      assert.deepStrictEqual(result.items, [3, 4]);
    });

    it('mergeConfig should handle empty source', () => {
      const target = { a: 1, b: 2 };
      const source = {};
      const result = mergeConfig(target, source);
      assert.deepStrictEqual(result, { a: 1, b: 2 });
    });

    it('mergeConfig should add new nested properties', () => {
      const target = { features: { display: true } };
      const source = { features: { flexbox: true, grid: true } };
      const result = mergeConfig(target, source);
      assert.strictEqual(result.features.display, true);
      assert.strictEqual(result.features.flexbox, true);
      assert.strictEqual(result.features.grid, true);
    });

    it('generateSampleConfig should return a string', () => {
      const sample = generateSampleConfig();
      assert.strictEqual(typeof sample, 'string');
      assert.ok(sample.length > 0);
    });

    it('generateSampleConfig should include features section', () => {
      const sample = generateSampleConfig();
      assert.ok(sample.includes('features:'));
      assert.ok(sample.includes('display:'));
      assert.ok(sample.includes('flexbox:'));
    });

    it('generateSampleConfig should include colors section', () => {
      const sample = generateSampleConfig();
      assert.ok(sample.includes('colors:'));
      assert.ok(sample.includes('primary:'));
    });

    it('generateSampleConfig should include breakpoints section', () => {
      const sample = generateSampleConfig();
      assert.ok(sample.includes('breakpoints:'));
      assert.ok(sample.includes('sm:'));
    });

    it('generateSampleConfig should include typography section', () => {
      const sample = generateSampleConfig();
      assert.ok(sample.includes('typography:'));
    });
  });
});
