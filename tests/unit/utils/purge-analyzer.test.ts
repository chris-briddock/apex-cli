import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
  extractClassNames,
  getClassStatistics,
  IGNORED_DIRECTORIES,
  SCAN_EXTENSIONS,
  shouldIgnoreDirectory,
  shouldScanFile,
  suggestDirectories
} from '../../../cli/utils/purge-analyzer.ts';

describe('purge-analyzer', () => {
  describe('extractClassNames', () => {
    it('should extract classes from HTML class attribute', () => {
      const content = '<div class="flex items-center p-4"></div>';
      const classes = extractClassNames(content);
      assert(classes.has('flex'));
      assert(classes.has('items-center'));
      assert(classes.has('p-4'));
      assert.strictEqual(classes.size, 3);
    });

    it('should extract classes from single quotes', () => {
      const content = "<div class='flex items-center'></div>";
      const classes = extractClassNames(content);
      assert(classes.has('flex'));
      assert(classes.has('items-center'));
    });

    it('should extract classes from JSX className', () => {
      const content = '<div className="flex items-center p-4"></div>';
      const classes = extractClassNames(content);
      assert(classes.has('flex'));
      assert(classes.has('items-center'));
      assert(classes.has('p-4'));
    });

    it('should extract classes from template literals', () => {
      const content = '<div className={`p-4 bg-blue`}></div>';
      const classes = extractClassNames(content);
      assert(classes.has('p-4'));
      assert(classes.has('bg-blue'));
    });

    it('should extract classes from Vue :class binding', () => {
      const content = '<div :class="{ active: isActive, hidden: !visible }"></div>';
      const classes = extractClassNames(content);
      assert(classes.has('active'));
      assert(classes.has('hidden'));
    });

    it('should extract classes from Vue array syntax', () => {
      const content = '<div :class="[activeClass, errorClass]"></div>';
      const classes = extractClassNames(content);
      // Array syntax extraction may include variable names
      assert(classes.size > 0, 'Should extract some classes from array syntax');
    });

    it('should extract classes from Svelte class directive', () => {
      const content = '<div class:active={isActive} class:disabled={isDisabled}></div>';
      const classes = extractClassNames(content);
      assert(classes.has('active'));
      assert(classes.has('disabled'));
    });

    it('should handle multiple class attributes', () => {
      const content = `
        <div class="flex p-4">
          <span class="text-red">Error</span>
          <span class="text-green">Success</span>
        </div>
      `;
      const classes = extractClassNames(content);
      assert(classes.has('flex'));
      assert(classes.has('p-4'));
      assert(classes.has('text-red'));
      assert(classes.has('text-green'));
    });

    it('should ignore template interpolation markers', () => {
      // biome-ignore lint/suspicious/noTemplateCurlyInString: Testing template interpolation handling
      // biome-ignore lint/suspicious/noUselessEscapeInString: Testing escaped interpolation markers
      const content = '<div className={`p-4 \${dynamicClass}`}></div>';
      const classes = extractClassNames(content);
      assert(classes.has('p-4'));
      // biome-ignore lint/suspicious/noTemplateCurlyInString: Testing template interpolation handling
      // biome-ignore lint/suspicious/noUselessEscapeInString: Testing escaped interpolation markers
      assert(!classes.has('\${dynamicClass}'));
    });

    it('should handle empty class attributes', () => {
      const content = '<div class=""></div>';
      const classes = extractClassNames(content);
      assert.strictEqual(classes.size, 0);
    });

    it('should handle whitespace correctly', () => {
      const content = '<div class="  flex   items-center  "></div>';
      const classes = extractClassNames(content);
      assert.strictEqual(classes.size, 2);
      assert(classes.has('flex'));
      assert(classes.has('items-center'));
    });

    it('should extract classes from clsx calls', () => {
      const content = "const cls = clsx('flex', 'items-center', 'p-4');";
      const classes = extractClassNames(content);
      assert(classes.has('flex'), 'should detect flex from clsx');
      assert(classes.has('items-center'), 'should detect items-center from clsx');
      assert(classes.has('p-4'), 'should detect p-4 from clsx');
    });

    it('should extract classes from cn calls', () => {
      const content = "const cls = cn('text-sm font-bold', isActive && 'bg-blue-500');";
      const classes = extractClassNames(content);
      assert(classes.has('text-sm'), 'should detect text-sm from cn');
      assert(classes.has('font-bold'), 'should detect font-bold from cn');
      assert(classes.has('bg-blue-500'), 'should detect bg-blue-500 from cn');
    });

    it('should extract classes from classnames calls', () => {
      const content = "const cls = classnames('rounded', 'border', 'shadow-md');";
      const classes = extractClassNames(content);
      assert(classes.has('rounded'));
      assert(classes.has('border'));
      assert(classes.has('shadow-md'));
    });

    it('should extract classes from twMerge calls', () => {
      const content = "const cls = twMerge('px-4 py-2', 'hover:bg-gray-100');";
      const classes = extractClassNames(content);
      assert(classes.has('px-4'));
      assert(classes.has('py-2'));
      assert(classes.has('hover:bg-gray-100'));
    });

    it('should extract classes from nested utility calls', () => {
      const content = "const cls = clsx('flex', cn('p-4', 'text-sm'));";
      const classes = extractClassNames(content);
      assert(classes.has('flex'));
      assert(classes.has('p-4'));
      assert(classes.has('text-sm'));
    });
  });

  describe('shouldScanFile', () => {
    it('should return true for supported extensions', () => {
      assert.strictEqual(shouldScanFile('component.jsx'), true);
      assert.strictEqual(shouldScanFile('component.tsx'), true);
      assert.strictEqual(shouldScanFile('component.ts'), true);
      assert.strictEqual(shouldScanFile('index.html'), true);
      assert.strictEqual(shouldScanFile('component.vue'), true);
      assert.strictEqual(shouldScanFile('page.svelte'), true);
      assert.strictEqual(shouldScanFile('layout.astro'), true);
      assert.strictEqual(shouldScanFile('script.js'), true);
      assert.strictEqual(shouldScanFile('module.mjs'), true);
      assert.strictEqual(shouldScanFile('module.mts'), true);
      assert.strictEqual(shouldScanFile('module.cts'), true);
    });

    it('should return false for unsupported extensions', () => {
      assert.strictEqual(shouldScanFile('styles.css'), false);
      assert.strictEqual(shouldScanFile('README.md'), false);
      assert.strictEqual(shouldScanFile('image.png'), false);
      assert.strictEqual(shouldScanFile('data.json'), false);
    });

    it('should handle case insensitivity', () => {
      assert.strictEqual(shouldScanFile('component.JSX'), true);
      assert.strictEqual(shouldScanFile('component.HTML'), true);
    });

    it('should handle paths with directories', () => {
      assert.strictEqual(shouldScanFile('/src/components/App.jsx'), true);
      assert.strictEqual(shouldScanFile('./pages/index.html'), true);
    });
  });

  describe('shouldIgnoreDirectory', () => {
    it('should return true for ignored directories', () => {
      assert.strictEqual(shouldIgnoreDirectory('node_modules'), true);
      assert.strictEqual(shouldIgnoreDirectory('.git'), true);
      assert.strictEqual(shouldIgnoreDirectory('dist'), true);
      assert.strictEqual(shouldIgnoreDirectory('build'), true);
    });

    it('should return false for normal directories', () => {
      assert.strictEqual(shouldIgnoreDirectory('src'), false);
      assert.strictEqual(shouldIgnoreDirectory('components'), false);
      assert.strictEqual(shouldIgnoreDirectory('pages'), false);
      assert.strictEqual(shouldIgnoreDirectory('utils'), false);
    });
  });

  describe('SCAN_EXTENSIONS', () => {
    it('should contain expected extensions', () => {
      assert(SCAN_EXTENSIONS.has('.html'));
      assert(SCAN_EXTENSIONS.has('.jsx'));
      assert(SCAN_EXTENSIONS.has('.tsx'));
      assert(SCAN_EXTENSIONS.has('.ts'));
      assert(SCAN_EXTENSIONS.has('.vue'));
      assert(SCAN_EXTENSIONS.has('.svelte'));
      assert(SCAN_EXTENSIONS.has('.astro'));
      assert(SCAN_EXTENSIONS.has('.mts'));
      assert(SCAN_EXTENSIONS.has('.cts'));
    });

    it('should not contain duplicates', () => {
      const asArray = Array.from(SCAN_EXTENSIONS);
      const unique = new Set(asArray);
      assert.strictEqual(asArray.length, unique.size, 'SCAN_EXTENSIONS must not contain duplicate entries');
    });
  });

  describe('IGNORED_DIRECTORIES', () => {
    it('should contain expected directories', () => {
      assert(IGNORED_DIRECTORIES.has('node_modules'));
      assert(IGNORED_DIRECTORIES.has('.git'));
      assert(IGNORED_DIRECTORIES.has('dist'));
      assert(IGNORED_DIRECTORIES.has('build'));
      assert(IGNORED_DIRECTORIES.has('coverage'));
    });
  });

  describe('getClassStatistics', () => {
    it('should calculate basic statistics', () => {
      const classes = new Set(['flex', 'p-4', 'text-lg']);
      const stats = getClassStatistics(classes);

      assert.strictEqual(stats.total, 3);
      assert.strictEqual(stats.withModifiers, 0);
    });

    it('should count modifier variants', () => {
      const classes = new Set(['flex', 'hover:flex', 'dark:text-white', 'md:p-4', 'focus:outline']);
      const stats = getClassStatistics(classes);

      assert.strictEqual(stats.total, 5);
      assert.strictEqual(stats.withModifiers, 4);
      assert.strictEqual(stats.darkMode, 1);
      assert.strictEqual(stats.hover, 1);
      assert.strictEqual(stats.focus, 1);
      assert.strictEqual(stats.responsive, 1);
    });

    it('should count top prefixes', () => {
      const classes = new Set(['p-4', 'p-8', 'm-4', 'm-8', 'flex', 'grid']);
      const stats = getClassStatistics(classes);

      assert(stats.topPrefixes.length > 0);
      assert.strictEqual(stats.topPrefixes[0][0], 'p');
      assert.strictEqual(stats.topPrefixes[0][1], 2); // p-4, p-8
    });

    it('should handle empty set', () => {
      const stats = getClassStatistics(new Set());

      assert.strictEqual(stats.total, 0);
      assert.strictEqual(stats.withModifiers, 0);
      assert.strictEqual(stats.topPrefixes.length, 0);
    });
  });

  describe('suggestDirectories', () => {
    it('should suggest Next.js directories', () => {
      const dirs = suggestDirectories('next', '/project');
      assert(dirs.includes('src'));
      assert(dirs.includes('app'));
      assert(dirs.includes('pages'));
    });

    it('should suggest React directories', () => {
      const dirs = suggestDirectories('react', '/project');
      assert(dirs.includes('src'));
      assert(dirs.includes('components'));
    });

    it('should suggest Vue directories', () => {
      const dirs = suggestDirectories('vue', '/project');
      assert(dirs.includes('src'));
      assert(dirs.includes('components'));
      assert(dirs.includes('views'));
    });

    it('should suggest Svelte directories', () => {
      const dirs = suggestDirectories('svelte', '/project');
      assert(dirs.includes('src'));
      assert(dirs.includes('lib'));
      assert(dirs.includes('routes'));
    });

    it('should return common directories for unknown framework', () => {
      const dirs = suggestDirectories('unknown', '/project');
      assert(dirs.includes('src'));
      assert(dirs.includes('components'));
    });

    it('should suggest vanilla directories', () => {
      const dirs = suggestDirectories('vanilla', '/project');
      assert(dirs.includes('src'));
      assert(dirs.includes('js'));
    });
  });
});
