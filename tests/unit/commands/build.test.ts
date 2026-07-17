/**
 * Build command tests
 */

import assert from 'node:assert';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { determineSourceDir, parseLayers, runPostBuildPurge, writeConfigFiles } from '../../../cli/commands/build.ts';

describe('build command', () => {
  let tempDir: string;
  let originalCwd: string;

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
      const testSourceDir = join(process.cwd(), 'test-source');
      const testSourceConfigDir = join(testSourceDir, 'config');

      mkdirSync(testSourceConfigDir, { recursive: true });

      writeConfigFiles('$test: true;', testSourceDir);

      // Verify _custom-config.scss is written to source config directory
      assert.ok(existsSync(join(testSourceConfigDir, '_custom-config.scss')));
    });
  });

  describe('runPostBuildPurge (used by `apex build --purge`)', () => {
    it('should tree-shake CSS in the output directory using the project source', async () => {
      mkdirSync(join(tempDir, 'src'), { recursive: true });
      writeFileSync(join(tempDir, 'src', 'index.html'), '<div class="flex"></div>');

      const outputDir = join(tempDir, 'dist');
      mkdirSync(outputDir, { recursive: true });
      writeFileSync(join(outputDir, 'app.css'), '.flex {\n  display: flex;\n}\n\n.unused {\n  color: red;\n}');

      await runPostBuildPurge(tempDir, outputDir);

      const pruned = readFileSync(join(outputDir, 'app.css'), 'utf-8');
      assert(pruned.includes('.flex'), 'used selector should survive');
      assert(!pruned.includes('.unused'), 'unused selector should be pruned');
    });

    it('should warn and return without throwing when no source directories are found', async () => {
      const outputDir = join(tempDir, 'dist');
      mkdirSync(outputDir, { recursive: true });
      writeFileSync(join(outputDir, 'app.css'), '.flex {\n  display: flex;\n}');

      await runPostBuildPurge(tempDir, outputDir);

      // Nothing to scan — output is left untouched rather than erroring.
      const content = readFileSync(join(outputDir, 'app.css'), 'utf-8');
      assert(content.includes('.flex'));
    });
  });
});
