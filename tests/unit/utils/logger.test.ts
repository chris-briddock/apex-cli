/**
 * Logger utility tests
 */

import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { logger } from '../../../cli/utils/logger.ts';

describe('logger', () => {
  let consoleLogSpy: string[];
  let consoleWarnSpy: string[];
  let consoleErrorSpy: string[];
  let originalLog: typeof console.log;
  let originalWarn: typeof console.warn;
  let originalError: typeof console.error;

  beforeEach(() => {
    consoleLogSpy = [];
    consoleWarnSpy = [];
    consoleErrorSpy = [];

    originalLog = console.log;
    originalWarn = console.warn;
    originalError = console.error;

    console.log = (...args: unknown[]) => consoleLogSpy.push(args.join(' '));
    console.warn = (...args: unknown[]) => consoleWarnSpy.push(args.join(' '));
    console.error = (...args: unknown[]) => consoleErrorSpy.push(args.join(' '));
  });

  afterEach(() => {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
    delete process.env.DEBUG;
  });

  describe('info', () => {
    it('should log info message with apexcss prefix', () => {
      logger.info('test message');
      assert.strictEqual(consoleLogSpy.length, 1);
      assert.ok(consoleLogSpy[0].includes('[apexcss]'));
      assert.ok(consoleLogSpy[0].includes('test message'));
    });
  });

  describe('success', () => {
    it('should log success message with checkmark', () => {
      logger.success('operation completed');
      assert.strictEqual(consoleLogSpy.length, 1);
      assert.ok(consoleLogSpy[0].includes('[apexcss]'));
      assert.ok(consoleLogSpy[0].includes('operation completed'));
    });
  });

  describe('warn', () => {
    it('should log warning message to console.warn', () => {
      logger.warn('warning message');
      assert.strictEqual(consoleWarnSpy.length, 1);
      assert.ok(consoleWarnSpy[0].includes('[apexcss]'));
      assert.ok(consoleWarnSpy[0].includes('warning message'));
    });
  });

  describe('error', () => {
    it('should log error message to console.error', () => {
      logger.error('error message');
      assert.strictEqual(consoleErrorSpy.length, 1);
      assert.ok(consoleErrorSpy[0].includes('[apexcss]'));
      assert.ok(consoleErrorSpy[0].includes('error message'));
    });
  });

  describe('debug', () => {
    it('should not log when DEBUG env var is not set', () => {
      logger.debug('debug message');
      assert.strictEqual(consoleLogSpy.length, 0);
    });

    it('should log when DEBUG env var is set', () => {
      process.env.DEBUG = 'true';
      logger.debug('debug message');
      assert.strictEqual(consoleLogSpy.length, 1);
      assert.ok(consoleLogSpy[0].includes('[debug]'));
      assert.ok(consoleLogSpy[0].includes('debug message'));
    });
  });

  describe('newline', () => {
    it('should output a blank line', () => {
      logger.newline();
      assert.strictEqual(consoleLogSpy.length, 1);
      assert.strictEqual(consoleLogSpy[0], '');
    });
  });

  describe('header', () => {
    it('should output header with underline', () => {
      logger.header('Test Header');
      assert.strictEqual(consoleLogSpy.length, 3); // newline, title, underline
      assert.ok(consoleLogSpy[1].includes('Test Header'));
    });
  });

  describe('list', () => {
    it('should output list items with bullets', () => {
      logger.list(['item 1', 'item 2', 'item 3']);
      assert.strictEqual(consoleLogSpy.length, 3);
      assert.ok(consoleLogSpy[0].includes('item 1'));
      assert.ok(consoleLogSpy[1].includes('item 2'));
      assert.ok(consoleLogSpy[2].includes('item 3'));
    });
  });

  describe('path', () => {
    it('should return colorized path string', () => {
      const result = logger.path('/some/path');
      assert.strictEqual(typeof result, 'string');
      assert.ok(result.includes('/some/path'));
    });
  });

  describe('cmd', () => {
    it('should return colorized command string', () => {
      const result = logger.cmd('npm install');
      assert.strictEqual(typeof result, 'string');
      assert.ok(result.includes('npm install'));
    });
  });
});
