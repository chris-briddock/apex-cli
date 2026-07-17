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
      '-ml-'
    ],
    patterns: [/^[mp][xytrbl]?-/, /^-[mp][xytrbl]?-/],
    estimatedSize: 26
  },
  sizing: {
    prefixes: ['w-', 'h-', 'min-w-', 'min-h-', 'max-w-', 'max-h-'],
    patterns: [/^[wh]-/, /^min-[wh]-/, /^max-[wh]-/],
    estimatedSize: 15
  },

  // Core Typography
  typography: {
    prefixes: ['text-', 'font-', 'uppercase', 'lowercase', 'capitalize', 'normal-case', 'truncate', 'whitespace-'],
    patterns: [
      /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/,
      /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/,
      /^(uppercase|lowercase|capitalize|normal-case)$/,
      /^truncate$/,
      /^whitespace-/
    ],
    estimatedSize: 15
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
      'fill-',
      'stroke-',
      'decoration-'
    ],
    patterns: [
      /^(text|bg|border|divide|ring|fill|stroke|decoration)-(primary|gray|success|warning|danger|info|white|black|transparent|current|inherit)/,
      /^(from|via|to)-(primary|gray|success|warning|danger|info|white|black|transparent|current)/
    ],
    estimatedSize: 32
  },
  backgrounds: {
    prefixes: ['bg-', 'from-', 'via-', 'to-', 'bg-gradient-', 'bg-opacity-'],
    patterns: [/^bg-(none|gradient|opacity)/, /^from-/, /^via-/, /^to-/],
    estimatedSize: 25
  },
  borders: {
    prefixes: ['border', 'border-', 'rounded', 'rounded-'],
    patterns: [/^border$/, /^border-(solid|dashed|dotted|double|hidden|none)/, /^border-[trbl]?-?/, /^rounded/],
    estimatedSize: 15
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
    prefixes: ['transition', 'duration-', 'ease-', 'delay-'],
    patterns: [/^transition$/, /^transition-/, /^duration-/, /^ease-/, /^delay-/],
    estimatedSize: 9
  },

  // Extended Layout
  flexExtended: {
    prefixes: ['content-', 'justify-self-', 'place-content-', 'place-self-'],
    patterns: [
      /^content-(center|start|end|between|around|evenly|baseline|stretch)$/,
      /^justify-self-/,
      /^place-content-/,
      /^place-self-/
    ],
    estimatedSize: 6
  },
  gridExtended: {
    prefixes: ['col-span-', 'col-start-', 'col-end-', 'row-span-', 'row-start-', 'row-end-'],
    patterns: [/^col-span-/, /^col-start-/, /^col-end-/, /^row-span-/, /^row-start-/, /^row-end-/],
    estimatedSize: 12
  },
  float: {
    prefixes: ['float-', 'clear-'],
    patterns: [
      /^float-(left|right|none|start|end|inline-start|inline-end)$/,
      /^clear-(left|right|both|none|start|end|inline-start|inline-end)$/
    ],
    estimatedSize: 2
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
    // break-after-/break-before-/break-inside- moved to the dedicated `break` feature
    prefixes: ['columns-'],
    patterns: [/^columns-/],
    estimatedSize: 4
  },

  // Extended Typography
  typographyExtended: {
    prefixes: [
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
  interaction: {
    prefixes: ['pointer-events-', 'resize', 'touch-'],
    patterns: [/^pointer-events-(none|auto)$/, /^resize$/, /^resize-(none|y|x)$/, /^touch-/],
    estimatedSize: 4
  },

  // Split out of formerly-coarse buckets (borders/spacing/typography/etc.) to match
  // the real, more granular feature toggles the build already supports (see FeatureToggles
  // in config-builder.ts) — purge previously couldn't detect or recommend disabling these.
  ring: {
    prefixes: ['ring', 'ring-', 'ring-offset-'],
    patterns: [/^ring$/, /^ring-/, /^ring-offset-/, /^ring-opacity-/],
    estimatedSize: 8
  },
  divide: {
    prefixes: ['divide-'],
    patterns: [/^divide-/],
    estimatedSize: 4
  },
  spaceBetween: {
    prefixes: ['space-', 'space-x-', 'space-y-'],
    patterns: [/^space-[xy]-/],
    estimatedSize: 4
  },
  letterSpacing: {
    prefixes: ['tracking-'],
    patterns: [/^tracking-/],
    estimatedSize: 3
  },
  lineHeight: {
    prefixes: ['leading-'],
    patterns: [/^leading-/],
    estimatedSize: 3
  },
  placeItems: {
    prefixes: ['place-items-'],
    patterns: [/^place-items-/],
    estimatedSize: 2
  },
  justifyItems: {
    prefixes: ['justify-items-'],
    patterns: [/^justify-items-/],
    estimatedSize: 2
  },
  willChange: {
    prefixes: ['will-change-'],
    patterns: [/^will-change-/],
    estimatedSize: 2
  },
  box: {
    prefixes: ['box-'],
    patterns: [/^box-(border|content)$/],
    estimatedSize: 1
  },
  accentColor: {
    prefixes: ['accent-'],
    patterns: [/^accent-/],
    estimatedSize: 2
  },
  caret: {
    prefixes: ['caret-'],
    patterns: [/^caret-/],
    estimatedSize: 2
  },
  verticalAlign: {
    prefixes: ['align-'],
    patterns: [/^align-(baseline|top|middle|bottom|text-top|text-bottom|sub|super)$/],
    estimatedSize: 2
  },
  textIndent: {
    prefixes: ['indent-'],
    patterns: [/^indent-/],
    estimatedSize: 2
  },

  // State variants split out of the combined `states` bucket
  hover: {
    prefixes: ['hover:'],
    patterns: [/^hover:/],
    estimatedSize: 5
  },
  focus: {
    prefixes: ['focus:'],
    patterns: [/^focus:/],
    estimatedSize: 5
  },
  active: {
    prefixes: ['active:'],
    patterns: [/^active:/],
    estimatedSize: 3
  },
  disabled: {
    prefixes: ['disabled:'],
    patterns: [/^disabled:/],
    estimatedSize: 2
  },

  // Previously entirely unmapped real feature toggles, reverse-engineered against a
  // built framework's utilities.css (see issue #18). A handful (marked below) have no
  // discoverable class-name footprint — they govern base-element or generated-content
  // styling rather than opt-in utility classes, so purge's class-name scanner can never
  // detect their usage and will always list them as disable candidates.
  all: {
    prefixes: ['all-'],
    patterns: [/^all-(inherit|initial|revert|unset)$/],
    estimatedSize: 1
  },
  arbitrary: {
    prefixes: [],
    patterns: [/\[.+\]/],
    estimatedSize: 5
  },
  borderRadiusLogical: {
    prefixes: ['rounded-s-', 'rounded-e-', 'rounded-ss-', 'rounded-se-', 'rounded-ee-', 'rounded-es-'],
    patterns: [/^rounded-(s|e|ss|se|ee|es)-/],
    estimatedSize: 3
  },
  break: {
    prefixes: ['break-before-', 'break-after-', 'break-inside-'],
    patterns: [/^break-(before|after|inside)-/],
    estimatedSize: 2
  },
  caption: {
    prefixes: ['caption-'],
    patterns: [/^caption-(top|bottom)$/],
    estimatedSize: 1
  },
  colorModifiers: {
    prefixes: [],
    patterns: [/\/\d{1,3}$/],
    estimatedSize: 4
  },
  colorScheme: {
    prefixes: ['scheme-'],
    patterns: [/^scheme-/],
    estimatedSize: 2
  },
  columnsExtended: {
    prefixes: ['column-rule', 'column-span-', 'column-width', 'column-fill-'],
    patterns: [/^column-rule/, /^column-span-/, /^column-width/, /^column-fill-/],
    estimatedSize: 4
  },
  counter: {
    prefixes: ['counter-'],
    patterns: [/^counter-(reset|increment|set)/],
    estimatedSize: 2
  },
  fieldSizing: {
    prefixes: ['field-sizing-'],
    patterns: [/^field-sizing-/],
    estimatedSize: 1
  },
  hangingPunctuation: {
    prefixes: ['hang-'],
    patterns: [/^hang-/],
    estimatedSize: 1
  },
  hyphenate: {
    prefixes: ['hyphenate-', 'hyphens-'],
    patterns: [/^hyphenate-/, /^hyphens-/],
    estimatedSize: 2
  },
  imageRendering: {
    prefixes: ['image-'],
    patterns: [/^image-(auto|crisp-edges|pixelated)$/],
    estimatedSize: 1
  },
  initialLetter: {
    prefixes: ['initial-letter-'],
    patterns: [/^initial-letter-/],
    estimatedSize: 1
  },
  list: {
    prefixes: ['list-'],
    patterns: [
      /^list-(none|disc|decimal|circle|square|inside|outside|georgian|armenian|item)/,
      /^list-(lower|upper)-/,
      /^list-image-/
    ],
    estimatedSize: 4
  },
  // No confirmed distinct utility classes beyond what `list` already covers (e.g.
  // list-decimal-leading-zero); mapped alongside it rather than left undetectable.
  listStyleExtended: {
    prefixes: ['list-'],
    patterns: [/^list-(decimal-leading-zero)$/],
    estimatedSize: 1
  },
  logicalProperties: {
    prefixes: [
      'bbe-',
      'bbs-',
      'bie-',
      'bis-',
      'mbe-',
      'mbs-',
      'mby-',
      'mie-',
      'mis-',
      'mi-',
      'pbe-',
      'pbs-',
      'pby-',
      'pie-',
      'pis-',
      'pi-'
    ],
    patterns: [],
    estimatedSize: 6
  },
  markerExtended: {
    prefixes: ['marker-color-', 'marker-end-', 'marker-mid-', 'marker-start-'],
    patterns: [/^marker-(color|end|mid|start)-/],
    estimatedSize: 2
  },
  masks: {
    prefixes: ['mask-'],
    patterns: [/^mask-/],
    estimatedSize: 6
  },
  offset: {
    prefixes: ['offset-'],
    patterns: [/^offset-/],
    estimatedSize: 3
  },
  // No confirmed utility classes observed — governs print-typography orphan control,
  // which is not exposed as an opt-in class in the framework build inspected.
  orphans: {
    prefixes: ['orphans-'],
    patterns: [/^orphans-\d/],
    estimatedSize: 1
  },
  // No confirmed utility classes observed for this toggle specifically.
  overflowExtended: {
    prefixes: [],
    patterns: [],
    estimatedSize: 1
  },
  overscrollBehavior: {
    prefixes: ['overscroll-'],
    patterns: [/^overscroll-(auto|contain|none)$/, /^overscroll-[xy]-/],
    estimatedSize: 2
  },
  overscrollBehaviorExtended: {
    prefixes: ['overscroll-block-', 'overscroll-inline-'],
    patterns: [/^overscroll-(block|inline)-/],
    estimatedSize: 1
  },
  // No confirmed utility classes observed — legacy page-break-* properties may only be
  // reachable via arbitrary values, not a dedicated utility set, in the build inspected.
  pageBreak: {
    prefixes: [],
    patterns: [],
    estimatedSize: 1
  },
  quotes: {
    prefixes: ['quotes-'],
    patterns: [/^quotes-/],
    estimatedSize: 1
  },
  scroll: {
    prefixes: ['scroll-', 'scrollbar-', 'snap-'],
    patterns: [/^scroll-/, /^scrollbar-/, /^snap-/],
    estimatedSize: 5
  },
  shapeOutside: {
    prefixes: ['shape-'],
    patterns: [/^shape-(circle|ellipse|inset|polygon|none)$/],
    estimatedSize: 1
  },
  sizingLogical: {
    prefixes: ['bs-', 'is-', 'max-bs-', 'max-is-', 'min-bs-', 'min-is-'],
    patterns: [/^(bs|is)-/, /^(max|min)-(bs|is)-/],
    estimatedSize: 3
  },
  // Overlaps intentionally with `colors` (fill-/stroke- are shared with SVG presentation
  // attributes); no distinct SVG-only utility prefix was observed.
  svg: {
    prefixes: ['fill-', 'stroke-'],
    patterns: [],
    estimatedSize: 2
  },
  // No confirmed utility classes observed — likely governs base <table> element reset
  // styles rather than an opt-in class, so it's undetectable via class-name scanning.
  table: {
    prefixes: [],
    patterns: [],
    estimatedSize: 1
  },
  tabSize: {
    prefixes: ['tab-'],
    patterns: [/^tab-\d/],
    estimatedSize: 1
  },
  // No confirmed utility classes observed for this toggle specifically.
  textAlignLast: {
    prefixes: [],
    patterns: [],
    estimatedSize: 1
  },
  textDecorationExtended: {
    prefixes: ['underline', 'no-underline', 'overline', 'line-through'],
    patterns: [/^underline$/, /^no-underline$/, /^overline$/, /^line-through$/],
    estimatedSize: 2
  },
  textEmphasis: {
    prefixes: ['emphasis-'],
    patterns: [/^emphasis-/],
    estimatedSize: 2
  },
  // No confirmed utility classes observed for this toggle specifically.
  textJustify: {
    prefixes: [],
    patterns: [],
    estimatedSize: 1
  },
  // No confirmed utility classes observed distinct from `writingMode`.
  textOrientation: {
    prefixes: [],
    patterns: [],
    estimatedSize: 1
  },
  textShadow: {
    prefixes: ['text-shadow-'],
    patterns: [/^text-shadow-/],
    estimatedSize: 2
  },
  textUnderline: {
    prefixes: ['underline-offset-', 'underline-auto', 'underline-from-font', 'underline-under'],
    patterns: [/^underline-offset-/],
    estimatedSize: 1
  },
  unicodeBidi: {
    prefixes: ['bidi-', 'direction-'],
    patterns: [/^bidi-/, /^direction-(ltr|rtl)$/],
    estimatedSize: 1
  },
  wordBreak: {
    prefixes: ['break-normal', 'break-words', 'break-all', 'break-keep'],
    patterns: [/^break-(normal|words|all|keep)$/],
    estimatedSize: 2
  },
  wordWrap: {
    prefixes: ['wrap-'],
    patterns: [/^wrap-/],
    estimatedSize: 1
  },
  writingMode: {
    prefixes: ['writing-'],
    patterns: [/^writing-(horizontal|vertical)-/],
    estimatedSize: 1
  },
  zoom: {
    prefixes: ['zoom-'],
    patterns: [/^zoom-/],
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
  // ApexCSS's default breakpoint scale is sm/md/lg/xl/xxl/xxxl, not Tailwind's 2xl —
  // both are stripped since a project's apex.config.js can override breakpoint names.
  '2xl:',
  'xxl:',
  'xxxl:',
  'ultra:',
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
export function analyzeFeatureUsage(
  classNames: Set<string>,
  currentConfig: { features?: Record<string, boolean> }
): FeatureUsageAnalysis {
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
