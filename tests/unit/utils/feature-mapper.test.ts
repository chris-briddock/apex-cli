import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
  analyzeFeatureUsage,
  calculateSavings,
  classMatchesFeature,
  FEATURE_MAPPINGS,
  findUsedFeatures,
  getFeatureNames
} from '../../../cli/utils/feature-mapper.ts';

describe('feature-mapper', () => {
  describe('getFeatureNames', () => {
    it('should return all feature names', () => {
      const names = getFeatureNames();
      assert(Array.isArray(names));
      assert(names.length > 0);
      assert(names.includes('display'));
      assert(names.includes('flexbox'));
      assert(names.includes('spacing'));
    });
  });

  describe('classMatchesFeature', () => {
    it('should match display classes', () => {
      assert.strictEqual(classMatchesFeature('block', 'display'), true);
      assert.strictEqual(classMatchesFeature('flex', 'display'), true);
      assert.strictEqual(classMatchesFeature('hidden', 'display'), true);
      assert.strictEqual(classMatchesFeature('grid', 'display'), true);
    });

    it('should match flexbox classes', () => {
      assert.strictEqual(classMatchesFeature('flex-row', 'flexbox'), true);
      assert.strictEqual(classMatchesFeature('justify-center', 'flexbox'), true);
      assert.strictEqual(classMatchesFeature('items-center', 'flexbox'), true);
      assert.strictEqual(classMatchesFeature('grow', 'flexbox'), true);
    });

    it('should match spacing classes', () => {
      assert.strictEqual(classMatchesFeature('p-4', 'spacing'), true);
      assert.strictEqual(classMatchesFeature('m-2', 'spacing'), true);
      assert.strictEqual(classMatchesFeature('px-8', 'spacing'), true);
      // space-x-*/space-y-* moved to the dedicated `spaceBetween` feature (see issue #18)
      assert.strictEqual(classMatchesFeature('space-x-4', 'spaceBetween'), true);
    });

    it('should match grid classes', () => {
      assert.strictEqual(classMatchesFeature('grid', 'grid'), true);
      assert.strictEqual(classMatchesFeature('grid-cols-3', 'grid'), true);
      assert.strictEqual(classMatchesFeature('col-span-2', 'grid'), true);
      assert.strictEqual(classMatchesFeature('gap-4', 'grid'), true);
    });

    it('should match typography classes', () => {
      assert.strictEqual(classMatchesFeature('text-lg', 'typography'), true);
      assert.strictEqual(classMatchesFeature('font-bold', 'typography'), true);
      assert.strictEqual(classMatchesFeature('uppercase', 'typography'), true);
    });

    it('should match color classes', () => {
      assert.strictEqual(classMatchesFeature('text-primary-500', 'colors'), true);
      assert.strictEqual(classMatchesFeature('bg-gray-100', 'colors'), true);
      assert.strictEqual(classMatchesFeature('border-red-500', 'colors'), true);
    });

    it('should not match unrelated classes', () => {
      assert.strictEqual(classMatchesFeature('p-4', 'display'), false);
      assert.strictEqual(classMatchesFeature('text-lg', 'flexbox'), false);
      assert.strictEqual(classMatchesFeature('flex', 'spacing'), false);
    });

    it('should return false for unknown features', () => {
      assert.strictEqual(classMatchesFeature('flex', 'unknownFeature'), false);
    });
  });

  describe('findUsedFeatures', () => {
    it('should identify single feature from class', () => {
      const classes = new Set(['flex']);
      const used = findUsedFeatures(classes);
      // flex matches both display (flex value) and flexbox (flex-* prefix patterns)
      assert(used.has('display') || used.has('flexbox'));
    });

    it('should identify multiple features from classes', () => {
      const classes = new Set(['flex', 'p-4', 'text-lg', 'grid']);
      const used = findUsedFeatures(classes);
      // Check that at least the expected features are detected
      // Note: 'flex' may match display, flexbox, or both depending on patterns
      assert(used.has('spacing'));
      assert(used.has('typography'));
      assert(used.has('grid'));
    });

    it('should handle empty class set', () => {
      const used = findUsedFeatures(new Set());
      assert.strictEqual(used.size, 0);
    });

    it('should handle variant prefixes', () => {
      const classes = new Set(['hover:flex', 'dark:text-white', 'md:p-4']);
      const used = findUsedFeatures(classes);
      // Variant prefixes should still match base features
      assert(used.has('spacing')); // p-4 matches spacing
      assert(used.has('colors')); // text-white matches colors
      // states and darkMode are detected via the prefix patterns
      const hasStatesOrDark = used.has('states') || used.has('darkMode');
      assert(hasStatesOrDark, 'Should detect state or dark mode variants');
    });

    it('should identify extended features', () => {
      const classes = new Set(['animate-fade', 'scale-110', 'blur-md']);
      const used = findUsedFeatures(classes);
      assert(used.has('animations'));
      assert(used.has('transforms'));
      assert(used.has('filters'));
    });

    it("should strip ApexCSS's default breakpoint variants (xxl:/xxxl:), not just Tailwind's 2xl:", () => {
      // ApexCSS's default breakpoint scale is sm/md/lg/xl/xxl/xxxl (see config-builder.ts),
      // not Tailwind's sm/md/lg/xl/2xl. Before issue #18, xxl:/xxxl: weren't stripped, so
      // every class only used at those breakpoints was invisible to usage detection.
      const classes = new Set(['xxl:flex', 'xxxl:p-4']);
      const used = findUsedFeatures(classes);
      assert(used.has('display') || used.has('flexbox'), 'xxl:flex should resolve to a base feature');
      assert(used.has('spacing'), 'xxxl:p-4 should resolve to spacing');
    });
  });

  describe('feature toggles synced from FeatureToggles (issue #18)', () => {
    it('should track features previously entirely missing from the mapper', () => {
      const names = getFeatureNames();
      for (const feature of [
        'ring',
        'divide',
        'spaceBetween',
        'letterSpacing',
        'lineHeight',
        'placeItems',
        'justifyItems',
        'willChange',
        'hover',
        'focus',
        'active',
        'disabled',
        'list',
        'masks',
        'scroll',
        'interaction'
      ]) {
        assert(names.includes(feature), `getFeatureNames() should include ${feature}`);
      }
    });

    it('should no longer expose the phantom pointerEvents/resize features', () => {
      // These never corresponded to a real FeatureToggles key — disabling them in
      // apex.config.js was a silent no-op at build time. Folded into `interaction`.
      const names = getFeatureNames();
      assert(!names.includes('pointerEvents'));
      assert(!names.includes('resize'));
    });

    it('should match ring classes distinctly from borders', () => {
      assert.strictEqual(classMatchesFeature('ring-2', 'ring'), true);
      assert.strictEqual(classMatchesFeature('ring-offset-4', 'ring'), true);
    });

    it('should match individual state-variant features', () => {
      assert.strictEqual(classMatchesFeature('hover:bg-primary', 'hover'), true);
      assert.strictEqual(classMatchesFeature('focus:outline-none', 'focus'), true);
      assert.strictEqual(classMatchesFeature('active:scale-95', 'active'), true);
      assert.strictEqual(classMatchesFeature('disabled:opacity-50', 'disabled'), true);
    });

    it('should match list, masks, and scroll utility classes', () => {
      assert.strictEqual(classMatchesFeature('list-disc', 'list'), true);
      assert.strictEqual(classMatchesFeature('mask-none', 'masks'), true);
      assert.strictEqual(classMatchesFeature('scroll-smooth', 'scroll'), true);
      assert.strictEqual(classMatchesFeature('snap-start', 'scroll'), true);
    });

    it('should fold pointer-events and resize classes into interaction', () => {
      assert.strictEqual(classMatchesFeature('pointer-events-none', 'interaction'), true);
      assert.strictEqual(classMatchesFeature('resize-none', 'interaction'), true);
    });
  });

  describe('calculateSavings', () => {
    it('should calculate savings for single feature', () => {
      const unused = new Set(['transforms3d']);
      const savings = calculateSavings(unused);
      assert.strictEqual(savings, FEATURE_MAPPINGS.transforms3d.estimatedSize);
    });

    it('should calculate savings for multiple features', () => {
      const unused = new Set(['transforms3d', 'filters', 'animations']);
      const savings = calculateSavings(unused);
      const expected =
        FEATURE_MAPPINGS.transforms3d.estimatedSize +
        FEATURE_MAPPINGS.filters.estimatedSize +
        FEATURE_MAPPINGS.animations.estimatedSize;
      assert.strictEqual(savings, expected);
    });

    it('should return 0 for empty set', () => {
      const savings = calculateSavings(new Set());
      assert.strictEqual(savings, 0);
    });

    it('should handle unknown features gracefully', () => {
      const unused = new Set(['unknownFeature', 'transforms3d']);
      const savings = calculateSavings(unused);
      assert.strictEqual(savings, FEATURE_MAPPINGS.transforms3d.estimatedSize);
    });
  });

  describe('analyzeFeatureUsage', () => {
    it('should correctly identify used and unused features', () => {
      const classes = new Set(['flex', 'p-4']);
      const config = {
        features: {
          display: true,
          spacing: true,
          grid: true,
          transforms3d: true
        }
      };

      const analysis = analyzeFeatureUsage(classes, config);

      // Check that flex is detected (matches either display or flexbox)
      assert(analysis.usedFeatures.length > 0, 'Should detect used features');
      assert(analysis.usedFeatures.includes('spacing'), 'Should detect spacing from p-4');
      assert(analysis.unusedFeatures.includes('grid'), 'Grid should be unused');
      assert(analysis.unusedFeatures.includes('transforms3d'), 'transforms3d should be unused');
    });

    it('should identify enabled but unused features', () => {
      const classes = new Set(['flex']);
      const config = {
        features: {
          display: true,
          grid: true,
          transforms3d: true
        }
      };

      const analysis = analyzeFeatureUsage(classes, config);

      assert(analysis.enabledUnused.includes('grid'));
      assert(analysis.enabledUnused.includes('transforms3d'));
      assert(!analysis.enabledUnused.includes('display'));
    });

    it('should identify already disabled features', () => {
      const classes = new Set(['flex']);
      const config = {
        features: {
          display: true,
          grid: false
        }
      };

      const analysis = analyzeFeatureUsage(classes, config);

      assert(analysis.alreadyDisabled.includes('grid'));
      assert(!analysis.enabledUnused.includes('grid'));
    });

    it('should calculate potential savings', () => {
      const classes = new Set(['flex']);
      const config = {
        features: {
          display: true,
          transforms3d: true,
          filters: true
        }
      };

      const analysis = analyzeFeatureUsage(classes, config);
      const expectedSavings = FEATURE_MAPPINGS.transforms3d.estimatedSize + FEATURE_MAPPINGS.filters.estimatedSize;

      assert.strictEqual(analysis.potentialSavings, expectedSavings);
    });

    it('should handle missing config', () => {
      const classes = new Set(['flex']);
      const analysis = analyzeFeatureUsage(classes, null as unknown as { features?: Record<string, boolean> });

      assert.strictEqual(analysis.totalFeatures, 0);
      assert.strictEqual(analysis.potentialSavings, 0);
    });
  });

  describe('FEATURE_MAPPINGS structure', () => {
    it('should have valid structure for all features', () => {
      for (const [name, mapping] of Object.entries(FEATURE_MAPPINGS)) {
        assert(Array.isArray(mapping.prefixes), `${name}: prefixes should be array`);
        assert(Array.isArray(mapping.patterns), `${name}: patterns should be array`);
        assert(typeof mapping.estimatedSize === 'number', `${name}: estimatedSize should be number`);
        assert(mapping.estimatedSize >= 0, `${name}: estimatedSize should be non-negative`);
      }
    });

    it('should have valid regex patterns', () => {
      for (const [name, mapping] of Object.entries(FEATURE_MAPPINGS)) {
        for (const pattern of mapping.patterns) {
          assert(pattern instanceof RegExp, `${name}: pattern should be RegExp`);
        }
      }
    });
  });
});
