/**
 * Init command tests
 */
import assert from 'node:assert';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { addImportToFile, getImportStatement, insertJsImport } from '../../../cli/commands/init.js';
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
        const CASCADE_LAYER_IMPORTS = `@layer base, utilities, themes;

@import 'apexcss/base' layer(base);
@import 'apexcss/utilities' layer(utilities);
@import 'apexcss/themes' layer(themes);
`;
        it('should return Next.js import statement with cascade layers', () => {
            const result = getImportStatement('next', './src/apexcss');
            assert.strictEqual(result, CASCADE_LAYER_IMPORTS);
        });
        it('should return React import statement with cascade layers', () => {
            const result = getImportStatement('react', './src/apexcss');
            assert.strictEqual(result, CASCADE_LAYER_IMPORTS);
        });
        it('should return Vue import statement with cascade layers', () => {
            const result = getImportStatement('vue', './src/apexcss');
            assert.strictEqual(result, CASCADE_LAYER_IMPORTS);
        });
        it('should return Svelte import statement with cascade layers', () => {
            const result = getImportStatement('svelte', './src/apexcss');
            assert.strictEqual(result, CASCADE_LAYER_IMPORTS);
        });
        it('should return Vanilla import statement with cascade layers', () => {
            const result = getImportStatement('vanilla', './src/apexcss');
            assert.strictEqual(result, CASCADE_LAYER_IMPORTS);
        });
        it('should return Angular import statement with cascade layers', () => {
            const result = getImportStatement('angular', './src/apexcss');
            assert.strictEqual(result, CASCADE_LAYER_IMPORTS);
        });
        it('should return Nuxt config comment with apexcss layer imports', () => {
            const result = getImportStatement('nuxt', './src/apexcss');
            assert.ok(result.includes('nuxt.config.ts'));
            assert.ok(result.includes('apexcss/base'));
            assert.ok(result.includes('apexcss/utilities'));
            assert.ok(result.includes('apexcss/themes'));
        });
        it('should handle default case with cascade layers', () => {
            const result = getImportStatement('unknown', './src/apexcss');
            assert.strictEqual(result, CASCADE_LAYER_IMPORTS);
        });
        it('should ignore outputDir for cascade layer imports', () => {
            const result = getImportStatement('react', './dist');
            assert.strictEqual(result, CASCADE_LAYER_IMPORTS);
        });
    });
    describe('addImportToFile', () => {
        it('should add import after existing imports for React', () => {
            const filePath = join(tempDir, 'test.js');
            writeFileSync(filePath, "import React from 'react';\n\nconst App = () => {};");
            addImportToFile(filePath, "import './apex.css';\n", 'react');
            const content = readFileSync(filePath, 'utf-8');
            assert.ok(content.includes("import React from 'react';"));
            assert.ok(content.includes("import './apex.css';"));
            // Import should be after React import
            const reactIndex = content.indexOf('import React');
            const apexIndex = content.indexOf("import './apex.css'");
            assert.ok(apexIndex > reactIndex);
        });
        it('should add import at beginning if no imports exist', () => {
            const filePath = join(tempDir, 'test2.js');
            writeFileSync(filePath, 'const App = () => {};');
            addImportToFile(filePath, "import './apex.css';\n", 'react');
            const content = readFileSync(filePath, 'utf-8');
            assert.ok(content.startsWith("import './apex.css';"));
        });
        it('should not add import if already exists (apexcss)', () => {
            const filePath = join(tempDir, 'test3.js');
            writeFileSync(filePath, "import './apexcss/apex.css';\nconst App = () => {};");
            addImportToFile(filePath, "import './apex.css';\n", 'react');
            const content = readFileSync(filePath, 'utf-8');
            // Should only have one import
            const matches = content.match(/apex/g);
            assert.strictEqual(matches.length, 2); // 'apexcss' and 'apex.css'
        });
        it('should not add import if already exists (apex.css)', () => {
            const filePath = join(tempDir, 'test4.js');
            writeFileSync(filePath, "import './apex.css';\nconst App = () => {};");
            addImportToFile(filePath, "import './apex.css';\n", 'react');
            const content = readFileSync(filePath, 'utf-8');
            const matches = content.match(/import '\.\/apex\.css'/g);
            assert.strictEqual(matches.length, 1);
        });
        it('should handle Angular files', () => {
            const filePath = join(tempDir, 'styles.scss');
            writeFileSync(filePath, 'body { margin: 0; }');
            addImportToFile(filePath, "@import 'apex.css';\n", 'angular');
            const content = readFileSync(filePath, 'utf-8');
            assert.ok(content.startsWith("@import 'apex.css';"));
        });
        it('should handle Vue files', () => {
            const filePath = join(tempDir, 'main.js');
            writeFileSync(filePath, "import { createApp } from 'vue';\nimport App from './App.vue';");
            addImportToFile(filePath, "import './apex.css';\n", 'vue');
            const content = readFileSync(filePath, 'utf-8');
            assert.ok(content.includes("import './apex.css';"));
        });
        it('should handle require statements', () => {
            const filePath = join(tempDir, 'test5.js');
            writeFileSync(filePath, "const React = require('react');\n\nconst App = () => {};");
            addImportToFile(filePath, "import './apex.css';\n", 'react');
            const content = readFileSync(filePath, 'utf-8');
            // Just verify the import was added - the function inserts after last import/require
            assert.ok(content.includes("import './apex.css';"));
            assert.ok(content.includes("require('react')"));
        });
    });
    describe('insertJsImport', () => {
        it('should insert import after last import statement', () => {
            const content = "import React from 'react';\nimport { useState } from 'react';\n\nconst App = () => {};";
            const importStatement = "import './apex.css';\n";
            const result = insertJsImport(content, importStatement);
            const lines = result.split('\n');
            assert.strictEqual(lines[0], "import React from 'react';");
            assert.strictEqual(lines[1], "import { useState } from 'react';");
            assert.strictEqual(lines[2], "import './apex.css';");
        });
        it('should insert import after require statement', () => {
            const content = "const React = require('react');\n\nconst App = () => {};";
            const importStatement = "import './apex.css';\n";
            const result = insertJsImport(content, importStatement);
            const lines = result.split('\n');
            assert.strictEqual(lines[0], "const React = require('react');");
            assert.strictEqual(lines[1], "import './apex.css';");
        });
        it('should add import at beginning if no imports exist', () => {
            const content = 'const App = () => {};\nconst x = 1;';
            const importStatement = "import './apex.css';\n";
            const result = insertJsImport(content, importStatement);
            assert.ok(result.startsWith("import './apex.css';"));
            assert.ok(result.includes('const App = () => {};'));
        });
        it('should handle mixed import and require statements', () => {
            const content = "import React from 'react';\nconst lodash = require('lodash');\n\nconst App = () => {};";
            const importStatement = "import './apex.css';\n";
            const result = insertJsImport(content, importStatement);
            const lines = result.split('\n');
            assert.strictEqual(lines[0], "import React from 'react';");
            assert.strictEqual(lines[1], "const lodash = require('lodash');");
            assert.strictEqual(lines[2], "import './apex.css';");
        });
        it('should preserve original content structure', () => {
            const content = "import React from 'react';\n\nconst App = () => {\n  return null;\n};";
            const importStatement = "import './apex.css';\n";
            const result = insertJsImport(content, importStatement);
            assert.ok(result.includes("import React from 'react';"));
            assert.ok(result.includes("import './apex.css';"));
            assert.ok(result.includes('const App = () => {'));
            assert.ok(result.includes('return null;'));
        });
    });
});
//# sourceMappingURL=init.test.js.map