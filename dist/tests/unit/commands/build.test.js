/**
 * Build command tests
 */
import assert from 'node:assert';
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { determineSourceDir, parseLayers, writeConfigFiles } from '../../../cli/commands/build.js';
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
});
//# sourceMappingURL=build.test.js.map