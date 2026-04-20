/**
 * CSS Tree Shaker Tests
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
  extractClassesFromSelector,
  formatBytes,
  parseCSS,
  shouldKeepSelector,
  treeShakeCSS
} from '../../../cli/utils/css-tree-shaker.js';

describe('css-tree-shaker', () => {
  describe('parseCSS', () => {
    it('should parse simple CSS rules', () => {
      const css = `
        .flex { display: flex; }
        .block { display: block; }
      `;
      const rules = parseCSS(css);
      assert.strictEqual(rules.length, 2);
      assert.strictEqual(rules[0].selector, '.flex');
      assert.strictEqual(rules[1].selector, '.block');
    });

    it('should parse media query rules', () => {
      const css = String.raw`
        @media (min-width: 640px) {
          .sm\:flex { display: flex; }
        }
      `;
      const rules = parseCSS(css);
      assert.strictEqual(rules.length, 1);
      assert.strictEqual(rules[0].selector, String.raw`.sm\:flex`);
      assert.strictEqual(rules[0].media, '@media (min-width: 640px)');
    });

    it('should ignore at-rules like keyframes', () => {
      const css = `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
      `;
      const rules = parseCSS(css);
      assert(rules.length >= 1, 'Should have at least one rule');
      assert.strictEqual(typeof rules.length, 'number');
    });
  });

  describe('extractClassesFromSelector', () => {
    it('should extract single class', () => {
      const classes = extractClassesFromSelector('.flex');
      assert.deepStrictEqual(classes, ['flex']);
    });

    it('should extract multiple classes', () => {
      const classes = extractClassesFromSelector('.flex.items-center.justify-between');
      assert.deepStrictEqual(classes, ['flex', 'items-center', 'justify-between']);
    });

    it('should handle complex selectors', () => {
      const classes = extractClassesFromSelector('.btn:hover, .btn:focus');
      assert.deepStrictEqual(classes, ['btn', 'btn']);
    });

    it('should handle responsive prefixes', () => {
      const classes = extractClassesFromSelector(String.raw`.sm\:flex.md\:block`);
      assert.deepStrictEqual(classes, ['sm:flex', 'md:block']);
    });
  });

  describe('shouldKeepSelector', () => {
    const usedClasses = new Set(['flex', 'block', 'text-center', 'sm:flex']);

    it('should keep selector with used class', () => {
      assert.strictEqual(shouldKeepSelector('.flex', usedClasses), true);
    });

    it('should discard selector with unused class', () => {
      assert.strictEqual(shouldKeepSelector('.grid', usedClasses), false);
    });

    it('should always keep universal selector', () => {
      assert.strictEqual(shouldKeepSelector('*', usedClasses), true);
    });

    it('should always keep :root selector', () => {
      assert.strictEqual(shouldKeepSelector(':root', usedClasses), true);
    });

    it('should always keep html/body selectors', () => {
      assert.strictEqual(shouldKeepSelector('html', usedClasses), true);
      assert.strictEqual(shouldKeepSelector('body', usedClasses), true);
    });

    it('should keep simple element selectors', () => {
      assert.strictEqual(shouldKeepSelector('h1', usedClasses), true);
      assert.strictEqual(shouldKeepSelector('p', usedClasses), true);
    });

    it('should keep responsive variants if base class is used', () => {
      assert.strictEqual(shouldKeepSelector(String.raw`.sm\:flex`, usedClasses), true);
    });

    it('should keep pseudo-class variants', () => {
      const classes = new Set(['btn']);
      assert.strictEqual(shouldKeepSelector('.btn:hover', classes), true);
      assert.strictEqual(shouldKeepSelector('.btn:focus', classes), true);
    });
  });

  describe('treeShakeCSS', () => {
    it('should remove unused rules', () => {
      const css = `
        .flex { display: flex; }
        .grid { display: grid; }
        .block { display: block; }
      `;
      const usedClasses = new Set(['flex', 'block']);
      const result = treeShakeCSS(css, usedClasses);

      assert(result.includes('.flex'));
      assert(result.includes('.block'));
      assert(!result.includes('.grid'));
    });

    it('should keep media query rules for used classes', () => {
      const css = String.raw`
        .flex { display: flex; }
        @media (min-width: 640px) {
          .sm\:flex { display: flex; }
          .sm\:grid { display: grid; }
        }
      `;
      const usedClasses = new Set(['flex']);
      const result = treeShakeCSS(css, usedClasses);

      assert(result.includes('.flex'), 'Should include .flex rule');
      assert(result.includes('@media'), 'Should include @media rule');
      assert(!result.includes('grid'), 'Should not include grid rule');
    });

    it('should keep essential selectors', () => {
      const css = `
        :root { --primary: blue; }
        html { font-size: 16px; }
        body { margin: 0; }
        .flex { display: flex; }
      `;
      const usedClasses = new Set(['flex']);
      const result = treeShakeCSS(css, usedClasses);

      assert(result.includes(':root'));
      assert(result.includes('html'));
      assert(result.includes('body'));
    });
  });

  describe('formatBytes', () => {
    it('should format bytes', () => {
      assert.strictEqual(formatBytes(500), '500 B');
      assert.strictEqual(formatBytes(1024), '1.00 KB');
      assert.strictEqual(formatBytes(1536), '1.50 KB');
      assert.strictEqual(formatBytes(1024 * 1024), '1.00 MB');
    });
  });
});
