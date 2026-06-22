/**
 * Watch command tests
 */

import assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { performWatchBuild, WatchBuildState } from '../../../cli/commands/watch.ts';
import { logger } from '../../../cli/utils/logger.ts';

describe('watch command', () => {
  describe('WatchBuildState', () => {
    let state: WatchBuildState;

    beforeEach(() => {
      state = new WatchBuildState();
    });

    it('should allow build when not building', () => {
      assert.strictEqual(state.canStartBuild(), true);
      assert.strictEqual(state.isBuilding, false);
    });

    it('should mark pending when build in progress', () => {
      state.startBuild();
      assert.strictEqual(state.canStartBuild(), false);
      assert.strictEqual(state.pendingBuild, true);
    });

    it('should track building state', () => {
      assert.strictEqual(state.isBuilding, false);
      state.startBuild();
      assert.strictEqual(state.isBuilding, true);
    });

    it('should reset pending on finish', () => {
      state.startBuild();
      state.pendingBuild = true;
      const hasPending = state.finishBuild();
      assert.strictEqual(hasPending, true);
      assert.strictEqual(state.isBuilding, false);
      assert.strictEqual(state.pendingBuild, false);
    });

    it('should return false for pending when none exists', () => {
      state.startBuild();
      const hasPending = state.finishBuild();
      assert.strictEqual(hasPending, false);
    });
  });

  describe('performWatchBuild', () => {
    it('should return false if build already in progress', async () => {
      const state = new WatchBuildState();
      state.startBuild();

      const mockDeps = {
        loadConfig: () => ({}),
        buildCommand: async () => {},
        logger
      };

      const result = await performWatchBuild({ configPath: 'test.js', outputDir: './dist' }, state, mockDeps);
      assert.strictEqual(result, false);
    });

    it('should call loadConfig and buildCommand', async () => {
      const state = new WatchBuildState();
      let loadConfigCalled = false;
      let buildCommandCalled = false;

      const mockDeps = {
        loadConfig: () => {
          loadConfigCalled = true;
          return {};
        },
        buildCommand: async () => {
          buildCommandCalled = true;
        },
        logger
      };

      await performWatchBuild({ configPath: 'test.js', outputDir: './dist' }, state, mockDeps);
      assert.strictEqual(loadConfigCalled, true);
      assert.strictEqual(buildCommandCalled, true);
    });

    it('should return true on successful build', async () => {
      const state = new WatchBuildState();

      const mockDeps = {
        loadConfig: () => ({}),
        buildCommand: async () => {},
        logger
      };

      const result = await performWatchBuild({ configPath: 'test.js', outputDir: './dist' }, state, mockDeps);
      assert.strictEqual(result, true);
    });

    it('should return false on build failure', async () => {
      const state = new WatchBuildState();

      const mockDeps = {
        loadConfig: () => ({}),
        buildCommand: async () => {
          throw new Error('Build failed');
        },
        logger
      };

      const result = await performWatchBuild({ configPath: 'test.js', outputDir: './dist' }, state, mockDeps);
      assert.strictEqual(result, false);
    });

    it('should handle loadConfig failure', async () => {
      const state = new WatchBuildState();

      const mockDeps = {
        loadConfig: () => {
          throw new Error('Invalid config');
        },
        buildCommand: async () => {},
        logger
      };

      const result = await performWatchBuild({ configPath: 'test.js', outputDir: './dist' }, state, mockDeps);
      assert.strictEqual(result, false);
    });

    it('should trigger pending build after completion', async () => {
      const state = new WatchBuildState();
      let buildCount = 0;

      const mockDeps = {
        loadConfig: () => ({}),
        buildCommand: async () => {
          buildCount++;
          if (buildCount === 1) {
            // Simulate another change during first build
            state.pendingBuild = true;
          }
        },
        logger
      };

      await performWatchBuild({ configPath: 'test.js', outputDir: './dist' }, state, mockDeps);
      assert.strictEqual(buildCount, 2);
    });

    it('should reset building state after completion', async () => {
      const state = new WatchBuildState();

      const mockDeps = {
        loadConfig: () => ({}),
        buildCommand: async () => {},
        logger
      };

      await performWatchBuild({ configPath: 'test.js', outputDir: './dist' }, state, mockDeps);
      assert.strictEqual(state.isBuilding, false);
    });

    it('should log error message on failure', async () => {
      const state = new WatchBuildState();
      let errorLogged = '';

      const mockLogger = {
        ...logger,
        error: (msg: string) => {
          errorLogged = msg;
        }
      };

      const mockDeps = {
        loadConfig: () => ({}),
        buildCommand: async () => {
          throw new Error('Build error');
        },
        logger: mockLogger
      };

      await performWatchBuild({ configPath: 'test.js', outputDir: './dist' }, state, mockDeps);
      assert.ok(errorLogged.includes('Build failed'));
      assert.ok(errorLogged.includes('Build error'));
    });
  });
});
