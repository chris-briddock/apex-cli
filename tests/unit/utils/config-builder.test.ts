import assert from 'node:assert';
import { describe, it } from 'node:test';
import { generateSCSS } from '../../../cli/utils/config-builder.ts';

describe('config-builder', () => {
  describe('generateFractionalWidths escaping', () => {
    it('escapes fraction keys with a double backslash so Sass emits valid selectors', () => {
      const scss = generateSCSS({});

      // String.raw preserves the backslashes that the generated SCSS must literally contain.
      assert.ok(scss.includes(String.raw`"1\\/2"`), 'halves key must be double-backslash escaped');
      assert.ok(scss.includes(String.raw`"1\\/3"`), 'thirds key must be double-backslash escaped');
      assert.ok(scss.includes(String.raw`"2\\/3"`), 'thirds key must be double-backslash escaped');
      assert.ok(scss.includes(String.raw`"1\\/4"`), 'quarters key must be double-backslash escaped');
      assert.ok(scss.includes(String.raw`"3\\/4"`), 'quarters key must be double-backslash escaped');
      assert.ok(scss.includes(String.raw`"1\\/5"`), 'fifths key must be double-backslash escaped');
      assert.ok(scss.includes(String.raw`"4\\/5"`), 'fifths key must be double-backslash escaped');
      assert.ok(scss.includes(String.raw`"1\\/6"`), 'sixths key must be double-backslash escaped');
      assert.ok(scss.includes(String.raw`"5\\/6"`), 'sixths key must be double-backslash escaped');
      assert.ok(scss.includes(String.raw`"1\\/12"`), 'twelfths key must be double-backslash escaped');
      assert.ok(scss.includes(String.raw`"11\\/12"`), 'twelfths key must be double-backslash escaped');
    });

    it('does not emit the single-backslash form that breaks Sass selectors', () => {
      const scss = generateSCSS({});

      // A single backslash in a quoted Sass string is stripped, leaving an
      // unescaped "/" that produces an invalid selector (e.g. ".w-1/2").
      assert.ok(!scss.includes(String.raw`"1\/2"`), 'must not contain the buggy single-backslash form');
      assert.ok(!scss.includes(String.raw`"1\/12"`), 'must not contain the buggy single-backslash form');
    });

    it('emits only the requested fractional groups', () => {
      // Defaults enable every group, so the others must be disabled explicitly
      // to verify the per-group conditionals in generateFractionalWidths.
      const scss = generateSCSS({
        fractionalWidths: {
          halves: false,
          thirds: false,
          quarters: false,
          fifths: false,
          sixths: false,
          twelfths: true
        }
      });

      assert.ok(scss.includes(String.raw`"1\\/12"`));
      assert.ok(scss.includes(String.raw`"11\\/12"`));
      assert.ok(!scss.includes(String.raw`"1\\/2"`));
      assert.ok(!scss.includes(String.raw`"1\\/3"`));
      assert.ok(!scss.includes(String.raw`"1\\/4"`));
      assert.ok(!scss.includes(String.raw`"1\\/5"`));
      assert.ok(!scss.includes(String.raw`"1\\/6"`));
    });
  });
});
