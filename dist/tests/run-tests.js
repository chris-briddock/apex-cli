#!/usr/bin/env node
/**
 * Test runner for ApexCSS CLI
 * Uses Node.js built-in test runner
 */
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { run } from 'node:test';
import { spec, tap } from 'node:test/reporters';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
// Configuration
const isCI = process.env.CI === 'true';
/**
 * Recursively get all test files
 */
function getTestFiles(dir, files = []) {
    const items = readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        const fullPath = join(dir, item.name);
        if (item.isDirectory()) {
            getTestFiles(fullPath, files);
        }
        else if (item.name.endsWith('.test.ts')) {
            files.push(fullPath);
        }
    }
    return files;
}
console.log('🧪 Running ApexCSS CLI Tests...\n');
const startTime = Date.now();
// Get all test files
const testFiles = getTestFiles(join(__dirname, 'unit'));
if (testFiles.length === 0) {
    console.error('❌ No test files found');
    process.exit(1);
}
const stream = run({
    files: testFiles,
    concurrency: true,
    timeout: 30000
});
// Use spec reporter for human-readable output, tap for CI
const reporter = isCI ? tap : spec;
stream.compose(reporter).pipe(process.stdout);
stream.on('end', () => {
    const duration = Date.now() - startTime;
    console.log(`\n✅ Tests completed in ${duration}ms`);
});
stream.on('error', (error) => {
    console.error('\n❌ Test run failed:', error.message);
    process.exit(1);
});
//# sourceMappingURL=run-tests.js.map