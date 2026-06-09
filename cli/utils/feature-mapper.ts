/**
 * Feature Mapper Utility
 * Maps CSS class names to ApexCSS feature toggles
 */

interface FeatureMapping {
  prefixes: string[];
  patterns: RegExp[];
  estimatedSize: number;
}

/**
 * Feature to class prefix mappings
 * Each feature maps to an array of class prefixes that indicate usage
 */
export const FEATURE_MAPPINGS: Record<string, FeatureMapping> = {
  // Core Layout
  display: {
    prefixes: [
      'block',
      'inline-block',
      'inline',
      'flex',
      'grid',
      'hidden',
      'table',
      'table-cell',
      'table-row',
      'contents'
    ],
    patterns: [/^(block|inline|inline-block|flex|grid|hidden|table|table-cell|table-row|contents)$/],
    estimatedSize: 5 // KB saved if disabled
  },
  flexbox: {
    prefixes: ['flex-', 'justify-', 'items-', 'self-', 'grow', 'shrink', 'order', 'basis-'],
    patterns: [
      /^flex-(row|col|wrap|nowrap|none|1|auto|initial|grow|shrink)/,
      /^justify-(start|end|center|between|around|evenly)$/,
      /^items-(start|end|center|baseline|stretch)$/,
      /^self-(start|end|center|baseline|stretch)$/,
      /^grow-?/,
      /^shrink-?/,
      /^order-/,
      /^basis-/
    ],
    estimatedSize: 25
  },
  grid: {
    prefixes: [
      'grid',
      'col-',
      'row-',
      'gap-',
      'gap-x-',
      'gap-y-',
      'auto-cols-',
      'auto-rows-',
      'grid-flow-',
      'grid-cols-',
      'grid-rows-'
    ],
    patterns: [
      /^grid$/,
      /^grid-cols-/,
      /^grid-rows-/,
      /^col-span-/,
      /^col-start-/,
      /^col-end-/,
      /^row-span-/,
      /^row-start-/,
      /^row-end-/,
      /^gap-/,
      /^gap-x-/,
      /^gap-y-/,
      /^grid-flow-/,
      /^auto-cols-/,
      /^auto-rows-/
    ],
    estimatedSize: 20
  },
  positioning: {
    prefixes: [
      'static',
      'fixed',
      'absolute',
      'relative',
      'sticky',
      'top-',
      'right-',
      'bottom-',
      'left-',
      'inset-',
      '-top-',
      '-right-',
      '-bottom-',
      '-left-'
    ],
    patterns: [
      /^(static|fixed|absolute|relative|sticky)$/,
      /^inset-/,
      /^top-/,
      /^right-/,
      /^bottom-/,
      /^left-/,
      /^-top-/,
      /^-right-/,
      /^-bottom-/,
      /^-left-/
    ],
    estimatedSize: 10
  },
  visibility: {
    prefixes: ['visible', 'invisible', 'collapse'],
    patterns: [/^(visible|invisible|collapse)$/],
    estimatedSize: 1
  },

  // Core Spacing
  spacing: {
    prefixes: [
      'p-',
      'px-',
      'py-',
      'pt-',
      'pr-',
      'pb-',
      'pl-',
      'm-',
      'mx-',
      'my-',
      'mt-',
      'mr-',
      'mb-',
      'ml-',
      '-m-',
      '-mx-',
      '-my-',
      '-mt-',
      '-mr-',
      '-mb-',
      '-ml-',
      'space-',
      'space-x-',
      'space-y-'
    ],
    patterns: [/^[mp][xytrbl]?-/, /^-[mp][xytrbl]?-/, /^space-[xy]-/],
    estimatedSize: 30
  },
  sizing: {
    prefixes: ['w-', 'h-', 'min-w-', 'min-h-', 'max-w-', 'max-h-'],
    patterns: [/^[wh]-/, /^min-[wh]-/, /^max-[wh]-/],
    estimatedSize: 15
  },

  // Core Typography
  typography: {
    prefixes: [
      'text-',
      'font-',
      'leading-',
      'tracking-',
      'uppercase',
      'lowercase',
      'capitalize',
      'normal-case',
      'truncate',
      'overflow-ellipsis',
      'overflow-clip',
      'whitespace-',
      'break-',
      'hyphens-'
    ],
    patterns: [
      /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/,
      /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/,
      /^leading-/,
      /^tracking-/,
      /^(uppercase|lowercase|capitalize|normal-case)$/,
      /^truncate$/,
      /^overflow-ellipsis$/,
      /^overflow-clip$/,
      /^whitespace-/,
      /^break-/,
      /^hyphens-/
    ],
    estimatedSize: 20
  },

  // Core Visual
  colors: {
    prefixes: [
      'text-',
      'bg-',
      'from-',
      'via-',
      'to-',
      'border-',
      'divide-',
      'ring-',
      'accent-',
      'caret-',
      'fill-',
      'stroke-',
      'decoration-'
    ],
    patterns: [
      /^(text|bg|border|divide|ring|accent|caret|fill|stroke|decoration)-(primary|gray|success|warning|danger|info|white|black|transparent|current|inherit)/,
      /^(from|via|to)-(primary|gray|success|warning|danger|info|white|black|transparent|current)/
    ],
    estimatedSize: 35
  },
  backgrounds: {
    prefixes: ['bg-', 'from-', 'via-', 'to-', 'bg-gradient-', 'bg-opacity-'],
    patterns: [/^bg-(none|gradient|opacity)/, /^from-/, /^via-/, /^to-/],
    estimatedSize: 25
  },
  borders: {
    prefixes: ['border', 'border-', 'rounded', 'rounded-', 'divide-', 'ring', 'ring-', 'ring-offset-'],
    patterns: [
      /^border$/,
      /^border-(solid|dashed|dotted|double|hidden|none)/,
      /^border-[trbl]?-?/,
      /^rounded/,
      /^ring$/,
      /^ring-/,
      /^ring-offset-/,
      /^divide-/,
      /^ring-opacity-/
    ],
    estimatedSize: 20
  },
  shadows: {
    prefixes: ['shadow', 'shadow-', 'drop-shadow', 'drop-shadow-'],
    patterns: [/^shadow/, /^drop-shadow/],
    estimatedSize: 8
  },
  opacity: {
    prefixes: ['opacity-'],
    patterns: [/^opacity-\d/],
    estimatedSize: 3
  },
  overflow: {
    prefixes: ['overflow-', 'overflow-x-', 'overflow-y-'],
    patterns: [/^overflow(-[xy])?-/],
    estimatedSize: 3
  },
  objectFit: {
    prefixes: ['object-'],
    patterns: [/^object-(contain|cover|fill|none|scale-down)$/],
    estimatedSize: 2
  },

  // Core Interaction
  cursor: {
    prefixes: ['cursor-'],
    patterns: [/^cursor-/],
    estimatedSize: 3
  },
  transitions: {
    prefixes: ['transition', 'duration-', 'ease-', 'delay-', 'will-change-'],
    patterns: [/^transition$/, /^transition-/, /^duration-/, /^ease-/, /^delay-/, /^will-change-/],
    estimatedSize: 10
  },

  // Extended Layout
  flexExtended: {
    prefixes: ['content-', 'justify-items-', 'justify-self-', 'place-content-', 'place-items-', 'place-self-'],
    patterns: [
      /^content-(center|start|end|between|around|evenly|baseline|stretch)$/,
      /^justify-items-/,
      /^justify-self-/,
      /^place-content-/,
      /^place-items-/,
      /^place-self-/
    ],
    estimatedSize: 8
  },
  gridExtended: {
    prefixes: ['col-span-', 'col-start-', 'col-end-', 'row-span-', 'row-start-', 'row-end-'],
    patterns: [/^col-span-/, /^col-start-/, /^col-end-/, /^row-span-/, /^row-start-/, /^row-end-/],
    estimatedSize: 12
  },
  float: {
    prefixes: ['float-', 'clear-', 'box-'],
    patterns: [
      /^float-(left|right|none|start|end|inline-start|inline-end)$/,
      /^clear-(left|right|both|none|start|end|inline-start|inline-end)$/,
      /^box-(border|content)$/
    ],
    estimatedSize: 3
  },
  containerQueries: {
    prefixes: ['@container', 'container'],
    patterns: [/^container$/, /^@container/],
    estimatedSize: 2
  },
  isolation: {
    prefixes: ['isolate', 'isolation-'],
    patterns: [/^isolate$/, /^isolation-/],
    estimatedSize: 1
  },
  columns: {
    prefixes: ['columns-', 'break-after-', 'break-before-', 'break-inside-'],
    patterns: [/^columns-/, /^break-after-/, /^break-before-/, /^break-inside-/],
    estimatedSize: 5
  },

  // Extended Typography
  typographyExtended: {
    prefixes: [
      'indent-',
      'align-',
      'antialiased',
      'subpixel-antialiased',
      'tabular-nums',
      'lining-nums',
      'oldstyle-nums',
      'proportional-nums',
      'diagonal-fractions',
      'stacked-fractions',
      'ordinal',
      'slashed-zero'
    ],
    patterns: [
      /^indent-/,
      /^align-(baseline|top|middle|bottom|text-top|text-bottom|sub|super)$/,
      /^antialiased$/,
      /^subpixel-antialiased$/,
      /^tabular-nums$/,
      /^lining-nums$/,
      /^oldstyle-nums$/,
      /^proportional-nums$/,
      /^diagonal-fractions$/,
      /^stacked-fractions$/,
      /^ordinal$/,
      /^slashed-zero$/
    ],
    estimatedSize: 15
  },
  fontExtended: {
    prefixes: ['font-sans', 'font-serif', 'font-mono', 'italic', 'not-italic'],
    patterns: [/^font-(sans|serif|mono)$/, /^italic$/, /^not-italic$/],
    estimatedSize: 5
  },

  // Extended Visual
  backgroundExtended: {
    prefixes: [
      'bg-clip-',
      'bg-origin-',
      'bg-center',
      'bg-top',
      'bg-right',
      'bg-bottom',
      'bg-left',
      'bg-repeat',
      'bg-no-repeat',
      'bg-auto',
      'bg-cover',
      'bg-contain',
      'bg-fixed',
      'bg-local',
      'bg-scroll'
    ],
    patterns: [
      /^bg-clip-/,
      /^bg-origin-/,
      /^bg-(center|top|right|bottom|left|repeat|no-repeat|auto|cover|contain|fixed|local|scroll)$/
    ],
    estimatedSize: 8
  },
  blendModes: {
    prefixes: ['mix-blend-', 'bg-blend-'],
    patterns: [/^mix-blend-/, /^bg-blend-/],
    estimatedSize: 4
  },
  outline: {
    prefixes: ['outline', 'outline-', 'outline-offset-'],
    patterns: [/^outline$/, /^outline-/, /^outline-offset-/],
    estimatedSize: 4
  },
  appearance: {
    prefixes: ['appearance-'],
    patterns: [/^appearance-none$/],
    estimatedSize: 1
  },

  // Effects
  animations: {
    prefixes: ['animate-', 'motion-'],
    patterns: [/^animate-/, /^motion-/],
    estimatedSize: 15
  },
  transforms: {
    prefixes: ['transform', 'scale-', 'rotate-', 'translate-', 'skew-', 'origin-'],
    patterns: [/^transform$/, /^scale-/, /^rotate-/, /^translate-/, /^skew-/, /^origin-/],
    estimatedSize: 20
  },
  transforms3d: {
    prefixes: [
      'perspective-',
      'preserve-3d',
      'transform-style-',
      'backface-',
      'rotate-x',
      'rotate-y',
      'rotate-z',
      'translate-z',
      'scale-z'
    ],
    patterns: [
      /^perspective-/,
      /^preserve-3d$/,
      /^transform-style-/,
      /^backface-/,
      /^rotate-[xyz]-/,
      /^translate-[xyz]-/,
      /^scale-[xyz]-/
    ],
    estimatedSize: 12
  },
  filters: {
    prefixes: [
      'blur-',
      'brightness-',
      'contrast-',
      'grayscale',
      'hue-',
      'invert',
      'saturate-',
      'sepia',
      'drop-shadow-',
      'backdrop-'
    ],
    patterns: [
      /^blur-/,
      /^brightness-/,
      /^contrast-/,
      /^grayscale$/,
      /^hue-rotate-/,
      /^invert$/,
      /^saturate-/,
      /^sepia$/,
      /^drop-shadow-/,
      /^backdrop-/,
      /^grayscale-/,
      /^invert-/
    ],
    estimatedSize: 18
  },
  aspectRatio: {
    prefixes: ['aspect-'],
    patterns: [/^aspect-(auto|square|video|\d+\/)/],
    estimatedSize: 2
  },

  // State Variants
  states: {
    prefixes: [
      'hover:',
      'focus:',
      'active:',
      'disabled:',
      'visited:',
      'checked:',
      'first:',
      'last:',
      'odd:',
      'even:',
      'group-hover:',
      'group-focus:',
      'peer-hover:',
      'peer-focus:'
    ],
    patterns: [
      /^(hover|focus|active|disabled|visited|checked|first|last|odd|even|group-hover|group-focus|peer-hover|peer-focus):/
    ],
    estimatedSize: 10
  },

  // Theme Support
  darkMode: {
    prefixes: ['dark:'],
    patterns: [/^dark:/],
    estimatedSize: 25
  },
  rtl: {
    prefixes: ['rtl:', 'ltr:'],
    patterns: [/^(rtl|ltr):/],
    estimatedSize: 5
  },
  accessibility: {
    prefixes: ['sr-only', 'not-sr-only', 'focus:', 'focus-visible:', 'focus-within:'],
    patterns: [/^sr-only$/, /^not-sr-only$/, /^focus:/, /^focus-visible:/, /^focus-within:/],
    estimatedSize: 5
  },

  // Advanced
  zIndex: {
    prefixes: ['z-'],
    patterns: [/^z-\d/, /^z-auto$/],
    estimatedSize: 2
  },
  userSelect: {
    prefixes: ['select-'],
    patterns: [/^select-(none|text|all|auto)$/],
    estimatedSize: 2
  },
  pointerEvents: {
    prefixes: ['pointer-events-'],
    patterns: [/^pointer-events-(none|auto)$/],
    estimatedSize: 1
  },
  resize: {
    prefixes: ['resize'],
    patterns: [/^resize$/, /^resize-(none|y|x)$/],
    estimatedSize: 1
  }
};

/**
 * Get all available feature names
 */
export function getFeatureNames(): string[] {
  return Object.keys(FEATURE_MAPPINGS);
}

/**
 * Check if a class name matches a feature
 */
export function classMatchesFeature(className: string, feature: string): boolean {
  const mapping = FEATURE_MAPPINGS[feature];
  if (!mapping) {
    return false;
  }

  // Check patterns first (more specific)
  for (const pattern of mapping.patterns) {
    if (pattern.test(className)) {
      return true;
    }
  }

  // Then check prefixes
  for (const prefix of mapping.prefixes) {
    if (className.startsWith(prefix)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a class matches any pattern in the mapping
 */
function matchesPattern(className: string, mapping: FeatureMapping): boolean {
  return mapping.patterns.some(pattern => pattern.test(className));
}

/**
 * Check if a class starts with any prefix in the mapping
 */
function matchesPrefix(className: string, mapping: FeatureMapping): boolean {
  return mapping.prefixes.some(prefix => className.startsWith(prefix));
}

/**
 * Responsive and state prefixes to strip for base class matching
 */
const VARIANT_PREFIXES = [
  'sm:',
  'md:',
  'lg:',
  'xl:',
  '2xl:',
  'hover:',
  'focus:',
  'active:',
  'disabled:',
  'visited:',
  'checked:',
  'first:',
  'last:',
  'odd:',
  'even:',
  'group-hover:',
  'group-focus:',
  'peer-hover:',
  'peer-focus:',
  'dark:',
  'light:',
  'rtl:',
  'ltr:',
  'focus-visible:',
  'focus-within:'
];

/**
 * Strip variant prefixes from a class name to get the base class
 */
function stripVariantPrefixes(className: string): string {
  let baseClass = className;

  // Strip all variant prefixes (there can be multiple like "dark:hover:")
  let hadPrefix = true;
  while (hadPrefix) {
    hadPrefix = false;
    for (const prefix of VARIANT_PREFIXES) {
      if (baseClass.startsWith(prefix)) {
        baseClass = baseClass.slice(prefix.length);
        hadPrefix = true;
        break;
      }
    }
  }

  return baseClass;
}

/**
 * Find which features are used by a set of class names
 */
export function findUsedFeatures(classNames: Set<string>): Set<string> {
  const usedFeatures = new Set<string>();

  for (const className of classNames) {
    // Check the original class for variant features (states, darkMode, responsive)
    for (const [feature, mapping] of Object.entries(FEATURE_MAPPINGS)) {
      if (matchesPattern(className, mapping) || matchesPrefix(className, mapping)) {
        usedFeatures.add(feature);
      }
    }

    // Get the base class by stripping variant prefixes
    const baseClass = stripVariantPrefixes(className);

    // Also check the base class for underlying features (spacing, colors, etc.)
    if (baseClass !== className) {
      for (const [feature, mapping] of Object.entries(FEATURE_MAPPINGS)) {
        if (matchesPattern(baseClass, mapping) || matchesPrefix(baseClass, mapping)) {
          usedFeatures.add(feature);
        }
      }
    }
  }

  return usedFeatures;
}

/**
 * Calculate potential savings from disabling unused features
 */
export function calculateSavings(unusedFeatures: Set<string>): number {
  let totalSavings = 0;

  for (const feature of unusedFeatures) {
    const mapping = FEATURE_MAPPINGS[feature];
    if (mapping?.estimatedSize) {
      totalSavings += mapping.estimatedSize;
    }
  }

  return totalSavings;
}

interface FeatureUsageAnalysis {
  totalFeatures: number;
  usedFeatures: string[];
  unusedFeatures: string[];
  enabledUnused: string[];
  alreadyDisabled: string[];
  potentialSavings: number;
}

/**
 * Get detailed analysis of feature usage
 */
export function analyzeFeatureUsage(classNames: Set<string>, currentConfig: { features?: Record<string, boolean> }): FeatureUsageAnalysis {
  const usedFeatures = findUsedFeatures(classNames);
  const allFeatures = getFeatureNames();
  const features = currentConfig?.features;
  const configuredFeatures = features ? Object.keys(features) : [];

  // Only consider features that exist in the config
  const relevantFeatures = allFeatures.filter(f => configuredFeatures.includes(f));

  const unusedFeatures = relevantFeatures.filter(f => !usedFeatures.has(f));
  const enabledUnused = unusedFeatures.filter(f => features?.[f] !== false);
  const alreadyDisabled = unusedFeatures.filter(f => features?.[f] === false);

  return {
    totalFeatures: relevantFeatures.length,
    usedFeatures: Array.from(usedFeatures).filter(f => relevantFeatures.includes(f)),
    unusedFeatures,
    enabledUnused,
    alreadyDisabled,
    potentialSavings: calculateSavings(new Set(enabledUnused))
  };
}
