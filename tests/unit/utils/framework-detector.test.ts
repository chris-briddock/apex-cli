/**
 * Framework detector tests
 */

import assert from 'node:assert';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import {
  detectFramework,
  getAvailableFrameworks,
  getFrameworkConfigApproach,
  getRecommendedOutputDir
} from '../../../cli/utils/framework-detector.ts';

describe('framework-detector', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'apex-test-'));
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('detectFramework', () => {
    it('should return vanilla when no package.json exists', () => {
      const result = detectFramework(tempDir);
      assert.strictEqual(result.id, 'vanilla');
      assert.strictEqual(result.detected, false);
      assert.strictEqual(result.hasPackageJson, false);
    });

    it('should detect Next.js', () => {
      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: { next: '14.0.0' }
        })
      );
      const result = detectFramework(tempDir);
      assert.strictEqual(result.id, 'next');
      assert.strictEqual(result.detected, true);
      assert.strictEqual(result.name, 'Next.js');
    });

    it('should detect Nuxt', () => {
      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: { nuxt: '3.0.0' }
        })
      );
      const result = detectFramework(tempDir);
      assert.strictEqual(result.id, 'nuxt');
      assert.strictEqual(result.detected, true);
      assert.strictEqual(result.name, 'Nuxt');
    });

    it('should detect React', () => {
      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: { react: '18.0.0' }
        })
      );
      const result = detectFramework(tempDir);
      assert.strictEqual(result.id, 'react');
      assert.strictEqual(result.detected, true);
      assert.strictEqual(result.name, 'React');
    });

    it('should detect Vue', () => {
      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: { vue: '3.0.0' }
        })
      );
      const result = detectFramework(tempDir);
      assert.strictEqual(result.id, 'vue');
      assert.strictEqual(result.detected, true);
      assert.strictEqual(result.name, 'Vue');
    });

    it('should detect Angular', () => {
      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: { '@angular/core': '15.0.0' }
        })
      );
      const result = detectFramework(tempDir);
      assert.strictEqual(result.id, 'angular');
      assert.strictEqual(result.detected, true);
      assert.strictEqual(result.name, 'Angular');
    });

    it('should detect Svelte', () => {
      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: { svelte: '4.0.0' }
        })
      );
      const result = detectFramework(tempDir);
      assert.strictEqual(result.id, 'svelte');
      assert.strictEqual(result.detected, true);
      assert.strictEqual(result.name, 'Svelte');
    });

    it('should prefer Next.js over React', () => {
      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: { react: '18.0.0', next: '14.0.0' }
        })
      );
      const result = detectFramework(tempDir);
      assert.strictEqual(result.id, 'next');
    });

    it('should prefer Nuxt over Vue', () => {
      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: { vue: '3.0.0', nuxt: '3.0.0' }
        })
      );
      const result = detectFramework(tempDir);
      assert.strictEqual(result.id, 'nuxt');
    });

    it('should handle invalid package.json', () => {
      writeFileSync(join(tempDir, 'package.json'), 'invalid json');
      const result = detectFramework(tempDir);
      assert.strictEqual(result.id, 'vanilla');
      assert.strictEqual(result.parseError, true);
    });

    it('should detect existing entry file', () => {
      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: { react: '18.0.0' }
        })
      );

      // Create src directory and index.css (CSS files are now primary entry points)
      const srcDir = join(tempDir, 'src');
      mkdirSync(srcDir);
      writeFileSync(join(srcDir, 'index.css'), '');

      const result = detectFramework(tempDir);
      assert.strictEqual(result.entryFile, 'src/index.css');
    });
  });

  describe('getAvailableFrameworks', () => {
    it('should return array of framework options', () => {
      const frameworks = getAvailableFrameworks();
      assert.ok(Array.isArray(frameworks));
      assert.ok(frameworks.length > 0);
      assert.ok(frameworks.every(f => f.id && f.name));
    });

    it('should include all major frameworks', () => {
      const frameworks = getAvailableFrameworks();
      const frameworkIds = new Set(frameworks.map(f => f.id));
      assert.ok(frameworkIds.has('next'));
      assert.ok(frameworkIds.has('react'));
      assert.ok(frameworkIds.has('vue'));
      assert.ok(frameworkIds.has('angular'));
      assert.ok(frameworkIds.has('svelte'));
      assert.ok(frameworkIds.has('vanilla'));
    });
  });

  describe('getRecommendedOutputDir', () => {
    it('should return node_modules/apexcss/dist for all frameworks', () => {
      const frameworks = ['next', 'nuxt', 'react', 'vue', 'angular', 'svelte', 'vanilla'];
      for (const fw of frameworks) {
        const dir = getRecommendedOutputDir(fw);
        assert.strictEqual(dir, 'node_modules/apexcss/dist');
      }
    });

    it('should return default for unknown framework', () => {
      const dir = getRecommendedOutputDir('unknown');
      assert.strictEqual(dir, 'node_modules/apexcss/dist');
    });
  });

  describe('getFrameworkConfigApproach', () => {
    it('should return import type for most frameworks', () => {
      const frameworks = ['next', 'react', 'vue', 'svelte', 'vanilla'];
      for (const fw of frameworks) {
        const approach = getFrameworkConfigApproach(fw);
        assert.strictEqual(approach.type, 'import');
        assert.strictEqual(approach.supportsCSSImport, true);
      }
    });

    it('should return config type for Nuxt', () => {
      const approach = getFrameworkConfigApproach('nuxt');
      assert.strictEqual(approach.type, 'config');
      assert.strictEqual(approach.configKey, 'css');
    });

    it('should return styles type for Angular', () => {
      const approach = getFrameworkConfigApproach('angular');
      assert.strictEqual(approach.type, 'styles');
      assert.strictEqual(approach.supportsGlobalStyles, true);
    });
  });
});
