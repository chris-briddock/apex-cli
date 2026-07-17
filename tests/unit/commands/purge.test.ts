import assert from 'node:assert';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { purgeCommand } from '../../../cli/commands/purge.ts';

describe('purge command', () => {
  let tempDir: string;
  let originalCwd: string;
  let exitCode: number | null;
  let originalExit: typeof process.exit;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'apexcss-purge-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
    exitCode = null;

    // Mock process.exit
    originalExit = process.exit;
    (process.exit as unknown as (code?: number) => void) = (code?: number) => {
      exitCode = typeof code === 'number' ? code : 1;
      throw new Error(`process.exit(${code})`);
    };
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await rm(tempDir, { recursive: true, force: true });
    process.exit = originalExit;
  });

  describe('config validation', () => {
    it('should exit when config file not found', async () => {
      await assert.rejects(
        async () =>
          purgeCommand({
            configPath: './nonexistent.config.js',
            src: './src'
          }),
        /process\.exit\(1\)/
      );
      assert.strictEqual(exitCode, 1);
    });

    it('should proceed when config file exists', async () => {
      // Create minimal config
      await writeFile(join(tempDir, 'apex.config.js'), 'export default { features: { display: true } };');

      // Create minimal source
      await mkdir(join(tempDir, 'src'), { recursive: true });
      await writeFile(join(tempDir, 'src', 'index.html'), '<div class="flex"></div>');

      // Should not throw for missing config
      try {
        await purgeCommand({
          configPath: './apex.config.js',
          dryRun: true
        });
      } catch (error) {
        assert.ok(
          !(exitCode === 1 && (error as Error).message.includes('config file not found')),
          'Should not fail on config not found'
        );
      }
    });
  });

  describe('source directory handling', () => {
    it('should exit when no source directories found', async () => {
      await writeFile(join(tempDir, 'apex.config.js'), 'export default { features: { display: true } };');

      await assert.rejects(
        async () =>
          purgeCommand({
            configPath: './apex.config.js',
            src: './nonexistent'
          }),
        /process\.exit\(1\)/
      );
      assert.strictEqual(exitCode, 1);
    });

    it('should accept custom source directories', async () => {
      await writeFile(join(tempDir, 'apex.config.js'), 'export default { features: { display: true } };');

      await mkdir(join(tempDir, 'custom-src'), { recursive: true });
      await writeFile(join(tempDir, 'custom-src', 'index.html'), '<div class="flex"></div>');

      // Should not throw for config not found
      try {
        await purgeCommand({
          configPath: './apex.config.js',
          src: './custom-src',
          dryRun: true
        });
      } catch (error) {
        assert.ok(
          !(exitCode === 1 && (error as Error).message.includes('config file not found')),
          'Should not fail on config not found'
        );
      }
    });

    it('should accept multiple source directories', async () => {
      await writeFile(join(tempDir, 'apex.config.js'), 'export default { features: { display: true } };');

      await mkdir(join(tempDir, 'src'), { recursive: true });
      await mkdir(join(tempDir, 'components'), { recursive: true });
      await writeFile(join(tempDir, 'src', 'index.html'), '<div class="flex"></div>');
      await writeFile(join(tempDir, 'components', 'Button.jsx'), '<button className="p-4"></button>');

      // Should not throw for config not found
      try {
        await purgeCommand({
          configPath: './apex.config.js',
          src: './src,./components',
          dryRun: true
        });
      } catch (error) {
        assert.ok(
          !(exitCode === 1 && (error as Error).message.includes('config file not found')),
          'Should not fail on config not found'
        );
      }
    });
  });

  describe('class detection', () => {
    it('should detect classes from HTML files', async () => {
      await writeFile(
        join(tempDir, 'apex.config.js'),
        'export default { features: { display: true, spacing: true } };'
      );

      await mkdir(join(tempDir, 'src'), { recursive: true });
      await writeFile(join(tempDir, 'src', 'index.html'), '<div class="flex items-center p-4 m-2"></div>');

      // Command should complete (may throw via process.exit mock which is expected)
      await purgeCommand({
        configPath: './apex.config.js',
        src: './src',
        dryRun: true
      });
    });

    it('should detect classes from JSX files', async () => {
      await writeFile(join(tempDir, 'apex.config.js'), 'export default { features: { display: true, colors: true } };');

      await mkdir(join(tempDir, 'src'), { recursive: true });
      await writeFile(
        join(tempDir, 'src', 'App.jsx'),
        'export default () => <div className="flex text-red-500"></div>;'
      );

      // Command should complete (may throw via process.exit mock which is expected)
      await purgeCommand({
        configPath: './apex.config.js',
        src: './src',
        dryRun: true
      });
    });

    it('should warn when no classes detected', async () => {
      await writeFile(join(tempDir, 'apex.config.js'), 'export default { features: { display: true } };');

      await mkdir(join(tempDir, 'src'), { recursive: true });
      await writeFile(join(tempDir, 'src', 'empty.html'), '<div>No classes here</div>');

      // Should exit gracefully when no classes found
      await assert.rejects(
        async () =>
          purgeCommand({
            configPath: './apex.config.js',
            src: './src'
          }),
        /process\.exit\(0\)/
      );
      assert.strictEqual(exitCode, 0);
    });
  });

  describe('dry run mode', () => {
    it('should not modify config in dry run mode', async () => {
      const configContent = `export default {
        features: {
          display: true,
          transforms3d: true
        }
      };`;

      await writeFile(join(tempDir, 'apex.config.js'), configContent);

      await mkdir(join(tempDir, 'src'), { recursive: true });
      await writeFile(join(tempDir, 'src', 'index.html'), '<div class="flex"></div>');

      // Command should complete (may throw via process.exit mock which is expected)
      try {
        await purgeCommand({
          configPath: './apex.config.js',
          src: './src',
          dryRun: true
        });
      } catch {
        // Expected - process.exit may be called
      }

      // Config should remain unchanged
      const afterContent = await import('node:fs/promises').then(m =>
        m.readFile(join(tempDir, 'apex.config.js'), 'utf-8')
      );
      assert(afterContent.includes('transforms3d: true'));
    });
  });

  describe('option handling', () => {
    it('should handle verbose flag', async () => {
      await writeFile(join(tempDir, 'apex.config.js'), 'export default { features: { display: true } };');

      await mkdir(join(tempDir, 'src'), { recursive: true });
      await writeFile(join(tempDir, 'src', 'index.html'), '<div class="flex p-4 text-lg"></div>');

      // Command should complete (may throw via process.exit mock which is expected)
      await purgeCommand({
        configPath: './apex.config.js',
        src: './src',
        verbose: true,
        dryRun: true
      });
    });

    it('should handle backup flag', async () => {
      await writeFile(join(tempDir, 'apex.config.js'), 'export default { features: { display: true } };');

      await mkdir(join(tempDir, 'src'), { recursive: true });
      await writeFile(join(tempDir, 'src', 'index.html'), '<div class="flex"></div>');

      // Command should complete (may throw via process.exit mock which is expected)
      await purgeCommand({
        configPath: './apex.config.js',
        src: './src',
        backup: true,
        dryRun: true
      });
    });

    it('should handle yes flag for auto-apply', async () => {
      await writeFile(join(tempDir, 'apex.config.js'), 'export default { features: { display: true } };');

      await mkdir(join(tempDir, 'src'), { recursive: true });
      await writeFile(join(tempDir, 'src', 'index.html'), '<div class="flex"></div>');

      // Command should complete (may throw via process.exit mock which is expected)
      await purgeCommand({
        configPath: './apex.config.js',
        src: './src',
        yes: true
      });
    });
  });

  describe('exclude option', () => {
    it('should accept --exclude directories', async () => {
      await writeFile(join(tempDir, 'apex.config.js'), 'export default { features: { display: true } };');

      await mkdir(join(tempDir, 'src'), { recursive: true });
      await mkdir(join(tempDir, 'vendor'), { recursive: true });
      await writeFile(join(tempDir, 'src', 'index.html'), '<div class="flex"></div>');
      await writeFile(join(tempDir, 'vendor', 'lib.html'), '<div class="grid"></div>');

      try {
        await purgeCommand({
          configPath: './apex.config.js',
          src: './src,./vendor',
          exclude: './vendor',
          dryRun: true
        });
      } catch {
        // process.exit mock may trigger
      }
    });
  });

  describe('report option', () => {
    it('should write a JSON report when --report is specified', async () => {
      await writeFile(
        join(tempDir, 'apex.config.js'),
        'export default { features: { display: true, transforms3d: true } };'
      );

      await mkdir(join(tempDir, 'src'), { recursive: true });
      await writeFile(join(tempDir, 'src', 'index.html'), '<div class="flex"></div>');

      const reportPath = join(tempDir, 'report.json');

      try {
        await purgeCommand({
          configPath: './apex.config.js',
          src: './src',
          dryRun: true,
          report: reportPath
        });
      } catch {
        // process.exit mock may trigger
      }

      const { readFile } = await import('node:fs/promises');
      const reportContent = await readFile(reportPath, 'utf-8');
      const report = JSON.parse(reportContent) as {
        timestamp: string;
        scannedFiles: number;
        analysis: { totalFeatures: number; usedFeatures: string[] };
        changes: { applied: boolean };
      };

      assert(report.timestamp, 'report should have a timestamp');
      assert(typeof report.scannedFiles === 'number', 'report should include scannedFiles');
      assert(Array.isArray(report.analysis.usedFeatures), 'report should include usedFeatures');
      assert.strictEqual(report.changes.applied, false, 'dry-run should mark applied as false');
    });
  });

  describe('CSS tree-shaking (prune-css)', () => {
    it('should tree-shake compiled CSS by default without passing --prune-css', async () => {
      await writeFile(join(tempDir, 'apex.config.js'), 'export default { features: { display: true } };');

      await mkdir(join(tempDir, 'src'), { recursive: true });
      await writeFile(join(tempDir, 'src', 'index.html'), '<div class="flex"></div>');

      await mkdir(join(tempDir, 'css'), { recursive: true });
      await writeFile(
        join(tempDir, 'css', 'app.css'),
        '.flex {\n  display: flex;\n}\n\n.unused-class {\n  color: red;\n}'
      );

      await purgeCommand({
        configPath: './apex.config.js',
        src: './src',
        yes: true,
        cssDir: './css',
        cssOut: './css-out'
      });

      const { readFile } = await import('node:fs/promises');
      const pruned = await readFile(join(tempDir, 'css-out', 'app.css'), 'utf-8');
      assert(pruned.includes('.flex'), 'used selector should be kept');
      assert(!pruned.includes('.unused-class'), 'unused selector should be removed by default');
    });

    it('should skip CSS tree-shaking when pruneCss is explicitly false (--no-prune-css)', async () => {
      await writeFile(join(tempDir, 'apex.config.js'), 'export default { features: { display: true } };');

      await mkdir(join(tempDir, 'src'), { recursive: true });
      await writeFile(join(tempDir, 'src', 'index.html'), '<div class="flex"></div>');

      await mkdir(join(tempDir, 'css'), { recursive: true });
      await writeFile(
        join(tempDir, 'css', 'app.css'),
        '.flex {\n  display: flex;\n}\n\n.unused-class {\n  color: red;\n}'
      );

      await purgeCommand({
        configPath: './apex.config.js',
        src: './src',
        yes: true,
        pruneCss: false,
        cssDir: './css',
        cssOut: './css-out'
      });

      const { existsSync } = await import('node:fs');
      assert.strictEqual(existsSync(join(tempDir, 'css-out', 'app.css')), false, 'no pruned output should be written');
    });

    it('should warn and continue the config purge when the CSS directory is missing', async () => {
      await writeFile(join(tempDir, 'apex.config.js'), 'export default { features: { display: true } };');

      await mkdir(join(tempDir, 'src'), { recursive: true });
      await writeFile(join(tempDir, 'src', 'index.html'), '<div class="flex"></div>');

      // No css directory created — default prune-css should not throw, just warn and move on.
      await purgeCommand({
        configPath: './apex.config.js',
        src: './src',
        yes: true,
        cssDir: './does-not-exist'
      });

      // Config purge still completed successfully.
      const configContent = await import('node:fs/promises').then(m =>
        m.readFile(join(tempDir, 'apex.config.js'), 'utf-8')
      );
      assert(configContent.includes('features'));
    });
  });

  describe('framework detection', () => {
    it('should auto-detect framework from package.json', async () => {
      await writeFile(join(tempDir, 'package.json'), JSON.stringify({ dependencies: { react: '^18.0.0' } }));

      await writeFile(join(tempDir, 'apex.config.js'), 'export default { features: { display: true } };');

      await mkdir(join(tempDir, 'src'), { recursive: true });
      await writeFile(join(tempDir, 'src', 'App.jsx'), '<div className="flex"></div>');

      // Command should complete (may throw via process.exit mock which is expected)
      await purgeCommand({
        configPath: './apex.config.js',
        dryRun: true
      });
    });

    it('should fall back to common directories when no framework detected', async () => {
      await writeFile(join(tempDir, 'apex.config.js'), 'export default { features: { display: true } };');

      await mkdir(join(tempDir, 'src'), { recursive: true });
      await writeFile(join(tempDir, 'src', 'index.html'), '<div class="flex"></div>');

      // Command should complete (may throw via process.exit mock which is expected)
      await purgeCommand({
        configPath: './apex.config.js',
        dryRun: true
      });
    });
  });
});
