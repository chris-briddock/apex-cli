/**
 * Build command tests
 */

import assert from 'node:assert';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import {
  copySourceMap,
  determineSourceDir,
  findGeneratedCss,
  generateLayerEntry,
  getSourceEntriesForLayers,
  parseLayers,
  setupBuildEnvironment,
  writeConfigFiles
} from '../../../cli/commands/build.js';

describe('build command', () => {
  let tempDir;
  let originalCwd;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'apex-build-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('parseLayers', () => {
    it('should return all layers when option is "all"', () => {
      const result = parseLayers('all');
      assert.deepStrictEqual(result, ['base', 'utilities', 'themes']);
    });

    it('should return all layers when option is undefined', () => {
      const result = parseLayers(undefined);
      assert.deepStrictEqual(result, ['base', 'utilities', 'themes']);
    });

    it('should parse comma-separated layers', () => {
      const result = parseLayers('base,utilities');
      assert.deepStrictEqual(result, ['base', 'utilities']);
    });

    it('should throw on invalid layer', () => {
      assert.throws(() => parseLayers('invalid'), /Invalid layer/);
    });

    it('should handle whitespace in layer string', () => {
      const result = parseLayers('base, utilities');
      assert.deepStrictEqual(result, ['base', 'utilities']);
    });
  });

  describe('generateLayerEntry', () => {
    it('should generate entry with all layers', () => {
      const result = generateLayerEntry(['base', 'utilities']);
      assert.ok(result.includes("@use 'config';"));
      assert.ok(result.includes("@use 'base';"));
      assert.ok(result.includes("@use 'utilities';"));
    });

    it('should include header and footer comments', () => {
      const result = generateLayerEntry(['base']);
      assert.ok(result.includes('ApexCSS - Layered Build Entry Point'));
      assert.ok(result.includes('End of Entry Point'));
    });
  });

  describe('getSourceEntriesForLayers', () => {
    it('should always include config', () => {
      const result = getSourceEntriesForLayers(['themes']);
      assert.ok(result.includes('config'));
    });

    it('should include mixins for utilities layer', () => {
      const result = getSourceEntriesForLayers(['utilities']);
      assert.ok(result.includes('mixins'));
      assert.ok(result.includes('plugins'));
    });

    it('should include mixins for base layer', () => {
      const result = getSourceEntriesForLayers(['base']);
      assert.ok(result.includes('mixins'));
    });

    it('should return unique entries', () => {
      const result = getSourceEntriesForLayers(['base', 'utilities']);
      const uniqueResult = [...new Set(result)];
      assert.strictEqual(result.length, uniqueResult.length);
    });
  });

  describe('setupBuildEnvironment', () => {
    it('should create temp directory', () => {
      const outputDir = join(process.cwd(), 'output');
      mkdirSync(outputDir, { recursive: true });
      const result = setupBuildEnvironment(outputDir);
      assert.ok(existsSync(result));
      assert.ok(result.includes('.apexcss-build'));
    });

    it('should clean up existing temp directory', () => {
      const outputDir = join(process.cwd(), 'output');
      mkdirSync(outputDir, { recursive: true });
      const existingTemp = join(outputDir, '.apexcss-build');
      mkdirSync(existingTemp, { recursive: true });
      writeFileSync(join(existingTemp, 'test.txt'), 'test');

      const result = setupBuildEnvironment(outputDir);
      assert.ok(existsSync(result));
      assert.ok(!existsSync(join(result, 'test.txt')));
    });
  });

  describe('determineSourceDir', () => {
    it('should find source in node_modules', () => {
      const nodeModulesDir = join(tempDir, 'node_modules', 'apexcss', 'src');
      mkdirSync(nodeModulesDir, { recursive: true });

      const result = determineSourceDir(tempDir);
      assert.strictEqual(result, nodeModulesDir);
    });

    it('should throw when source not found', () => {
      assert.throws(() => determineSourceDir(tempDir), /Could not find ApexCSS source/);
    });
  });

  describe('writeConfigFiles', () => {
    it('should write config files', () => {
      const testTempDir = join(process.cwd(), 'test-temp');
      const testOutputDir = join(process.cwd(), 'test-output');
      mkdirSync(testTempDir, { recursive: true });
      mkdirSync(testOutputDir, { recursive: true });

      writeConfigFiles(testTempDir, testOutputDir, '$test: true;');

      const configDir = join(testTempDir, 'config');
      assert.ok(existsSync(configDir));
      assert.ok(existsSync(join(configDir, '_custom-config.scss')));
      assert.ok(existsSync(join(configDir, '_index.scss')));
      // Also verify _custom-config.scss is written to output directory
      assert.ok(existsSync(join(testOutputDir, '_custom-config.scss')));
    });
  });

  describe('findGeneratedCss', () => {
    it('should find apex.css', () => {
      const testDir = join(process.cwd(), 'css-test');
      mkdirSync(testDir, { recursive: true });
      writeFileSync(join(testDir, 'apex.css'), 'body{}');

      const result = findGeneratedCss(testDir);
      assert.strictEqual(result, join(testDir, 'apex.css'));
    });

    it('should find style.css as fallback', () => {
      const testDir = join(process.cwd(), 'css-test2');
      mkdirSync(testDir, { recursive: true });
      writeFileSync(join(testDir, 'style.css'), 'body{}');

      const result = findGeneratedCss(testDir);
      assert.strictEqual(result, join(testDir, 'style.css'));
    });

    it('should return undefined when no CSS found', () => {
      const testDir = join(process.cwd(), 'css-test3');
      mkdirSync(testDir, { recursive: true });

      const result = findGeneratedCss(testDir);
      assert.strictEqual(result, undefined);
    });
  });

  describe('copySourceMap', () => {
    it('should copy source map if exists', () => {
      const testTempDir = join(process.cwd(), 'map-test');
      const outputDir = join(process.cwd(), 'map-output');
      mkdirSync(testTempDir, { recursive: true });
      mkdirSync(outputDir, { recursive: true });
      writeFileSync(join(testTempDir, 'apex.css.map'), '{"version": 3}');

      copySourceMap(testTempDir, outputDir);

      assert.ok(existsSync(join(outputDir, 'apex.css.map')));
    });

    it('should do nothing if source map does not exist', () => {
      const testTempDir = join(process.cwd(), 'map-test2');
      const outputDir = join(process.cwd(), 'map-output2');
      mkdirSync(testTempDir, { recursive: true });
      mkdirSync(outputDir, { recursive: true });

      // Should not throw
      copySourceMap(testTempDir, outputDir);

      assert.ok(!existsSync(join(outputDir, 'apex.css.map')));
    });
  });
});
