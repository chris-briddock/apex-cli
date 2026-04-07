/**
 * Init command tests
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getImportStatement, addImportToFile } from '../../../cli/commands/init.js';

describe('init command', () => {
  let tempDir;
  let originalCwd;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'apex-init-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('getImportStatement', () => {
    it('should return Next.js import statement', () => {
      const result = getImportStatement('next', './src/apexcss');
      assert.strictEqual(result, 'import \'src/apexcss/apex.css\';\n');
    });

    it('should return React import statement', () => {
      const result = getImportStatement('react', './src/apexcss');
      assert.strictEqual(result, 'import \'./src/apexcss/apex.css\';\n');
    });

    it('should return Vue import statement', () => {
      const result = getImportStatement('vue', './src/apexcss');
      assert.strictEqual(result, 'import \'./src/apexcss/apex.css\';\n');
    });

    it('should return Svelte import statement', () => {
      const result = getImportStatement('svelte', './src/apexcss');
      assert.strictEqual(result, 'import \'./src/apexcss/apex.css\';\n');
    });

    it('should return Vanilla import statement', () => {
      const result = getImportStatement('vanilla', './src/apexcss');
      assert.strictEqual(result, 'import \'./src/apexcss/apex.css\';\n');
    });

    it('should return Angular import statement', () => {
      const result = getImportStatement('angular', './src/apexcss');
      assert.strictEqual(result, '@import \'src/apexcss/apex.css\';\n');
    });

    it('should return Nuxt config comment', () => {
      const result = getImportStatement('nuxt', './src/apexcss');
      assert.ok(result.includes('nuxt.config.ts'));
      assert.ok(result.includes('css: [\'src/apexcss/apex.css\']'));
    });

    it('should handle default case for unknown framework', () => {
      const result = getImportStatement('unknown', './src/apexcss');
      assert.strictEqual(result, 'import \'src/apexcss/apex.css\';\n');
    });

    it('should remove leading ./ from outputDir', () => {
      const result = getImportStatement('react', './dist');
      assert.strictEqual(result, 'import \'./dist/apex.css\';\n');
    });
  });

  describe('addImportToFile', () => {
    it('should add import after existing imports for React', () => {
      const filePath = join(tempDir, 'test.js');
      writeFileSync(filePath, 'import React from \'react\';\n\nconst App = () => {};');

      addImportToFile(filePath, 'import \'./apex.css\';\n', 'react');

      const content = readFileSync(filePath, 'utf-8');
      assert.ok(content.includes('import React from \'react\';'));
      assert.ok(content.includes('import \'./apex.css\';'));
      // Import should be after React import
      const reactIndex = content.indexOf('import React');
      const apexIndex = content.indexOf('import \'./apex.css\'');
      assert.ok(apexIndex > reactIndex);
    });

    it('should add import at beginning if no imports exist', () => {
      const filePath = join(tempDir, 'test2.js');
      writeFileSync(filePath, 'const App = () => {};');

      addImportToFile(filePath, 'import \'./apex.css\';\n', 'react');

      const content = readFileSync(filePath, 'utf-8');
      assert.ok(content.startsWith('import \'./apex.css\';'));
    });

    it('should not add import if already exists (apexcss)', () => {
      const filePath = join(tempDir, 'test3.js');
      writeFileSync(filePath, 'import \'./apexcss/apex.css\';\nconst App = () => {};');

      addImportToFile(filePath, 'import \'./apex.css\';\n', 'react');

      const content = readFileSync(filePath, 'utf-8');
      // Should only have one import
      const matches = content.match(/apex/g);
      assert.strictEqual(matches.length, 2); // 'apexcss' and 'apex.css'
    });

    it('should not add import if already exists (apex.css)', () => {
      const filePath = join(tempDir, 'test4.js');
      writeFileSync(filePath, 'import \'./apex.css\';\nconst App = () => {};');

      addImportToFile(filePath, 'import \'./apex.css\';\n', 'react');

      const content = readFileSync(filePath, 'utf-8');
      const matches = content.match(/import '\.\/apex\.css'/g);
      assert.strictEqual(matches.length, 1);
    });

    it('should handle Angular files', () => {
      const filePath = join(tempDir, 'styles.scss');
      writeFileSync(filePath, 'body { margin: 0; }');

      addImportToFile(filePath, '@import \'apex.css\';\n', 'angular');

      const content = readFileSync(filePath, 'utf-8');
      assert.ok(content.startsWith('@import \'apex.css\';'));
    });

    it('should handle Vue files', () => {
      const filePath = join(tempDir, 'main.js');
      writeFileSync(filePath, 'import { createApp } from \'vue\';\nimport App from \'./App.vue\';');

      addImportToFile(filePath, 'import \'./apex.css\';\n', 'vue');

      const content = readFileSync(filePath, 'utf-8');
      assert.ok(content.includes('import \'./apex.css\';'));
    });

    it('should handle require statements', () => {
      const filePath = join(tempDir, 'test5.js');
      writeFileSync(filePath, 'const React = require(\'react\');\n\nconst App = () => {};');

      addImportToFile(filePath, 'import \'./apex.css\';\n', 'react');

      const content = readFileSync(filePath, 'utf-8');
      // Just verify the import was added - the function inserts after last import/require
      assert.ok(content.includes('import \'./apex.css\';'));
      assert.ok(content.includes('require(\'react\')'));
    });
  });
});
