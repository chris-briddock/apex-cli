/**
 * Bundle-size regression budget
 *
 * Guards against regressions in the purge/tree-shaking pipeline by running it
 * against a small, committed fixture (tests/fixtures/bundle-budget/) and
 * asserting the pruned output stays under a fixed byte budget.
 *
 * The fixture stands in for a real `apex build` output: this repo's own test
 * suite has no access to the `apexcss` npm package's SCSS source (it's a peer
 * dependency, not a devDependency), so a true end-to-end `apex build` isn't
 * runnable here. `framework.css` is a small, hand-written CSS file shaped like
 * real ApexCSS output — a `:root` custom-property block plus a mix of utility
 * rules, some used by the fixture HTML and some not — so it still exercises
 * the same selector-level and declaration-level pruning that a real build
 * output would.
 */

import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { treeShakeCSS } from '../../../cli/utils/css-tree-shaker.ts';
import { scanDirectories } from '../../../cli/utils/purge-analyzer.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = resolve(__dirname, '../../fixtures/bundle-budget');

/**
 * Budget derived from the pruned output measured against this fixture at the
 * time this test was written (1,811 bytes), rounded up with ~10% slack to
 * absorb incidental formatting changes without masking a real regression. If
 * a legitimate change grows the pruned output past this, raise the budget
 * deliberately in the same commit — don't just bump it to make CI pass.
 */
const BUDGET_BYTES = 2000;

describe('bundle-size regression budget', () => {
  it('should keep the fixture project pruned under the byte budget', async () => {
    const scanResult = await scanDirectories([resolve(FIXTURE_DIR, 'src')]);
    const originalCss = readFileSync(resolve(FIXTURE_DIR, 'framework.css'), 'utf-8');

    const pruned = treeShakeCSS(originalCss, scanResult.classes);
    const prunedBytes = Buffer.byteLength(pruned, 'utf8');
    const originalBytes = Buffer.byteLength(originalCss, 'utf8');

    assert(
      prunedBytes <= BUDGET_BYTES,
      `Pruned fixture CSS grew to ${prunedBytes} bytes, over the ${BUDGET_BYTES}-byte budget. ` +
        'If this is an intentional change, update BUDGET_BYTES deliberately rather than raising it to pass CI.'
    );

    // Sanity check: tree-shaking should still be doing real work, not silently
    // becoming a no-op that would let this budget pass for the wrong reason.
    assert(
      prunedBytes < originalBytes * 0.75,
      `Expected meaningful reduction from tree-shaking; pruned (${prunedBytes}B) was not ` +
        `meaningfully smaller than original (${originalBytes}B).`
    );
  });
});
