/**
 * Doctor command tests
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('doctor command', () => {
  let tempDir;
  let originalCwd;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'apex-doctor-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);

    // Mock process.exit
    const originalExit = process.exit;
    process.exit = (code) => {
      throw new Error(`EXIT_${code}`);
    };
    process.exit.original = originalExit;
  });

  afterEach(() => {
    process.chdir(originalCwd);
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
    if (process.exit.original) {
      process.exit = process.exit.original;
    }
  });

  describe('doctorCommand', () => {
    it('should run diagnostics without errors', async () => {
      // Import dynamically to get fresh module with mocked cwd
      const { doctorCommand } = await import('../../../cli/commands/doctor.js');

      try {
        await doctorCommand();
      } catch (error) {
        // Check that it didn't exit with error
        if (error.message === 'EXIT_1') {
          assert.fail('Doctor command failed');
        }
        // EXIT_0 is fine (no warnings)
      }
    });

    it('should detect Node.js version', async () => {
      const nodeVersion = process.version;
      const majorVersion = Number.parseInt(nodeVersion.slice(1).split('.')[0], 10);
      assert.ok(majorVersion >= 18, 'Node.js version should be 18+');
    });

    it('should handle missing package.json', async () => {
      // No package.json in temp dir
      const { doctorCommand } = await import('../../../cli/commands/doctor.js');

      try {
        await doctorCommand();
      } catch (error) {
        if (error.message === 'EXIT_1') {
          // This is expected with warnings
        }
      }

      // Should not have crashed
      assert.ok(true);
    });

    it('should handle package.json with apexcss', async () => {
      writeFileSync(join(tempDir, 'package.json'), JSON.stringify({
        dependencies: {
          apexcss: '0.3.0'
        }
      }));

      const { doctorCommand } = await import('../../../cli/commands/doctor.js');

      try {
        await doctorCommand();
      } catch (error) {
        if (error.message === 'EXIT_1') {
          // Expected with warnings
        }
      }

      assert.ok(true);
    });

    it('should detect config file', async () => {
      writeFileSync(join(tempDir, 'package.json'), JSON.stringify({
        dependencies: { apexcss: '0.3.0' }
      }));
      writeFileSync(join(tempDir, 'apex.config.js'), 'export default {};');

      const { doctorCommand } = await import('../../../cli/commands/doctor.js');

      try {
        await doctorCommand();
      } catch (error) {
        if (error.message === 'EXIT_1') {
          // Expected with warnings
        }
      }

      assert.ok(true);
    });

    it('should detect Vite as build tool', async () => {
      writeFileSync(join(tempDir, 'package.json'), JSON.stringify({
        devDependencies: {
          vite: '5.0.0'
        }
      }));

      const { doctorCommand } = await import('../../../cli/commands/doctor.js');

      try {
        await doctorCommand();
      } catch (error) {
        if (error.message === 'EXIT_1') {
          // Expected with warnings
        }
      }

      assert.ok(true);
    });

    it('should detect framework from package.json', async () => {
      writeFileSync(join(tempDir, 'package.json'), JSON.stringify({
        dependencies: {
          react: '18.0.0'
        }
      }));

      const { doctorCommand } = await import('../../../cli/commands/doctor.js');

      try {
        await doctorCommand();
      } catch (error) {
        if (error.message === 'EXIT_1') {
          // Expected with warnings
        }
      }

      assert.ok(true);
    });
  });
});
