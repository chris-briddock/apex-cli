import { access, mkdir, writeFile } from 'node:fs/promises';
import { watchFile } from 'node:fs';
import { resolve } from 'node:path';

const LOG_PREFIX = '[apex-config-builder]';

function logInfo(message: string): void {
  console.log(`${LOG_PREFIX} INFO: ${message}`);
}

function logWarn(message: string): void {
  console.warn(`${LOG_PREFIX} WARN: ${message}`);
}

function logError(message: string): void {
  console.error(`${LOG_PREFIX} ERROR: ${message}`);
}

// ============================================================================
// Type Definitions
// ============================================================================

export interface FeatureToggles {
  display?: boolean;
  flexbox?: boolean;
  grid?: boolean;
  positioning?: boolean;
  visibility?: boolean;
  spacing?: boolean;
  sizing?: boolean;
  typography?: boolean;
  colors?: boolean;
  backgrounds?: boolean;
  borders?: boolean;
  shadows?: boolean;
  opacity?: boolean;
  overflow?: boolean;
  objectFit?: boolean;
  cursor?: boolean;
  transitions?: boolean;
  flexExtended?: boolean;
  gridExtended?: boolean;
  float?: boolean;
  containerQueries?: boolean;
  isolation?: boolean;
  placeItems?: boolean;
  justifyItems?: boolean;
  spaceBetween?: boolean;
  columns?: boolean;
  columnsExtended?: boolean;
  typographyExtended?: boolean;
  fontExtended?: boolean;
  letterSpacing?: boolean;
  lineHeight?: boolean;
  textAlignLast?: boolean;
  textDecorationExtended?: boolean;
  textJustify?: boolean;
  textIndent?: boolean;
  textShadow?: boolean;
  textEmphasis?: boolean;
  textOrientation?: boolean;
  textUnderline?: boolean;
  hangingPunctuation?: boolean;
  hyphenate?: boolean;
  initialLetter?: boolean;
  tabSize?: boolean;
  wordBreak?: boolean;
  wordWrap?: boolean;
  writingMode?: boolean;
  unicodeBidi?: boolean;
  backgroundExtended?: boolean;
  colorModifiers?: boolean;
  blendModes?: boolean;
  masks?: boolean;
  borderRadiusLogical?: boolean;
  ring?: boolean;
  outline?: boolean;
  appearance?: boolean;
  accentColor?: boolean;
  colorScheme?: boolean;
  interaction?: boolean;
  userSelect?: boolean;
  willChange?: boolean;
  all?: boolean;
  caret?: boolean;
  scroll?: boolean;
  overscrollBehavior?: boolean;
  overscrollBehaviorExtended?: boolean;
  overflowExtended?: boolean;
  animations?: boolean;
  transforms?: boolean;
  transforms3d?: boolean;
  filters?: boolean;
  aspectRatio?: boolean;
  imageRendering?: boolean;
  transitionBehavior?: boolean;
  list?: boolean;
  listStyleExtended?: boolean;
  table?: boolean;
  counter?: boolean;
  caption?: boolean;
  quotes?: boolean;
  orphans?: boolean;
  widows?: boolean;
  pageBreak?: boolean;
  break?: boolean;
  verticalAlign?: boolean;
  arbitrary?: boolean;
  logicalProperties?: boolean;
  sizingLogical?: boolean;
  offset?: boolean;
  shapeOutside?: boolean;
  markerExtended?: boolean;
  zoom?: boolean;
  fieldSizing?: boolean;
  svg?: boolean;
  box?: boolean;
  divide?: boolean;
  states?: boolean;
  hover?: boolean;
  focus?: boolean;
  active?: boolean;
  disabled?: boolean;
  darkMode?: boolean;
  rtl?: boolean;
  accessibility?: boolean;
  zIndex?: boolean;
}

export interface Breakpoints {
  [key: string]: string;
}

export interface SpacingScale {
  [key: string]: string;
}

export interface FractionalWidths {
  halves?: boolean;
  thirds?: boolean;
  quarters?: boolean;
  fifths?: boolean;
  sixths?: boolean;
  twelfths?: boolean;
}

export interface ColumnConfig {
  counts: number[];
  widths: Record<string, string>;
  ruleStyles: Record<string, string>;
  ruleWidths: Record<string, string>;
}

export interface TextShadowConfig {
  [key: string]: string;
}

export interface RingWidths {
  [key: string]: string;
}

export interface RingColors {
  [key: string]: string;
}

export interface RingOpacity {
  [key: string]: string;
}

export interface OutlineWidths {
  [key: string]: string;
}

export interface OutlineOffsets {
  [key: string]: string;
}

export interface BlendModes {
  [key: string]: string;
}

export interface OKLCHColor {
  hue: number;
  chroma: number;
  lightnessScale?: Record<string | number, number>;
}

export interface ColorsConfig {
  primary?: OKLCHColor;
  gray?: OKLCHColor;
  success?: OKLCHColor;
  warning?: OKLCHColor;
  danger?: OKLCHColor;
  info?: OKLCHColor;
  extended?: Record<string, Pick<OKLCHColor, 'hue' | 'chroma'>>;
}

export interface ColorConfigMap {
  shades: (number | string)[];
  families: Record<string, string>;
  bgOpacityValues: number[];
  gradientColors: Record<string, string>;
}

export interface FontSizeEntry {
  size: string;
  lineHeight?: string;
}

export interface TypographyConfig {
  fontFamily: Record<string, string[]>;
  fontSize: Record<string, string | [string, { lineHeight: string }]>;
  fontWeight: Record<string, string>;
  letterSpacing: Record<string, string>;
  lineHeight: Record<string, string>;
}

export interface BorderRadiusConfig {
  [key: string]: string;
}

export interface ShadowsConfig {
  [key: string]: string;
}

export interface TransitionConfig {
  duration: Record<string, string>;
  timing: Record<string, string>;
}

export interface ZIndexConfig {
  [key: string]: string;
}

export interface OpacityConfig {
  [key: string]: string;
}

export interface FilterValues {
  [key: string]: string;
}

export interface DivideConfig {
  widths: Record<string, string>;
  colors: Record<string, string>;
  styles: Record<string, string>;
}

export interface DropShadowValues {
  [key: string]: string;
}

export interface BackdropOpacityValues {
  [key: string]: string;
}

export interface ApexConfig {
  features?: FeatureToggles;
  breakpoints?: Breakpoints;
  spacing?: SpacingScale;
  fractionalWidths?: FractionalWidths;
  columns?: ColumnConfig;
  textShadow?: TextShadowConfig;
  ringWidths?: RingWidths;
  ringColors?: RingColors;
  ringOpacity?: RingOpacity;
  outlineWidths?: OutlineWidths;
  outlineOffsets?: OutlineOffsets;
  blendModes?: BlendModes;
  colors?: ColorsConfig;
  colorConfig?: ColorConfigMap;
  typography?: TypographyConfig;
  borderRadius?: BorderRadiusConfig;
  shadows?: ShadowsConfig;
  transition?: TransitionConfig;
  zIndex?: ZIndexConfig;
  opacity?: OpacityConfig;
  filterBlurValues?: FilterValues;
  filterBrightnessValues?: FilterValues;
  filterContrastValues?: FilterValues;
  filterGrayscaleValues?: FilterValues;
  filterHueRotateValues?: FilterValues;
  filterInvertValues?: FilterValues;
  filterSaturateValues?: FilterValues;
  filterSepiaValues?: FilterValues;
  divideWidths?: Record<string, string>;
  divideColors?: Record<string, string>;
  divideStyles?: Record<string, string>;
  dropShadowValues?: DropShadowValues;
  backdropOpacityValues?: BackdropOpacityValues;
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export interface BuilderOptions {
  config: string;
  output: string;
  watch: boolean;
  init: boolean;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const defaultConfig: Required<ApexConfig> = {
  features: {
    display: true,
    flexbox: true,
    grid: true,
    positioning: true,
    visibility: true,
    spacing: true,
    sizing: true,
    typography: true,
    colors: true,
    backgrounds: true,
    borders: true,
    shadows: true,
    opacity: true,
    overflow: true,
    objectFit: true,
    cursor: true,
    transitions: true,
    flexExtended: true,
    gridExtended: true,
    float: true,
    containerQueries: true,
    isolation: true,
    placeItems: true,
    justifyItems: true,
    spaceBetween: true,
    columns: true,
    columnsExtended: true,
    typographyExtended: true,
    fontExtended: true,
    letterSpacing: true,
    lineHeight: true,
    textAlignLast: true,
    textDecorationExtended: true,
    textJustify: true,
    textIndent: true,
    textShadow: true,
    textEmphasis: true,
    textOrientation: true,
    textUnderline: true,
    hangingPunctuation: true,
    hyphenate: true,
    initialLetter: true,
    tabSize: true,
    wordBreak: true,
    wordWrap: true,
    writingMode: true,
    unicodeBidi: true,
    backgroundExtended: true,
    colorModifiers: false,
    blendModes: true,
    masks: true,
    borderRadiusLogical: true,
    ring: true,
    outline: true,
    appearance: true,
    accentColor: true,
    colorScheme: true,
    interaction: true,
    userSelect: true,
    willChange: true,
    all: true,
    caret: true,
    scroll: true,
    overscrollBehavior: true,
    overscrollBehaviorExtended: true,
    overflowExtended: true,
    animations: true,
    transforms: true,
    transforms3d: true,
    filters: true,
    aspectRatio: true,
    imageRendering: true,
    transitionBehavior: true,
    list: true,
    listStyleExtended: true,
    table: true,
    counter: true,
    caption: true,
    quotes: true,
    orphans: true,
    widows: true,
    pageBreak: true,
    break: true,
    verticalAlign: true,
    arbitrary: false,
    logicalProperties: true,
    sizingLogical: true,
    offset: true,
    shapeOutside: true,
    markerExtended: true,
    zoom: true,
    fieldSizing: true,
    svg: true,
    box: true,
    divide: true,
    states: true,
    hover: true,
    focus: true,
    active: true,
    disabled: true,
    darkMode: true,
    rtl: true,
    accessibility: true,
    zIndex: true,
  },

  breakpoints: {
    sm: '320px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    xxl: '2560px',
    xxxl: '3840px',
  },

  spacing: {
    0: '0',
    px: '1px',
    '0.5': '0.125rem',
    '1': '0.25rem',
    '1.5': '0.375rem',
    '2': '0.5rem',
    '2.5': '0.625rem',
    '3': '0.75rem',
    '3.5': '0.875rem',
    '4': '1rem',
    '5': '1.25rem',
    '6': '1.5rem',
    '7': '1.75rem',
    '8': '2rem',
    '9': '2.25rem',
    '10': '2.5rem',
    '11': '2.75rem',
    '12': '3rem',
    '14': '3.5rem',
    '16': '4rem',
    '20': '5rem',
    '24': '6rem',
    '28': '7rem',
    '32': '8rem',
    '36': '9rem',
    '40': '10rem',
    '44': '11rem',
    '48': '12rem',
    '52': '13rem',
    '56': '14rem',
    '60': '15rem',
    '64': '16rem',
    '72': '18rem',
    '80': '20rem',
    '96': '24rem',
  },

  fractionalWidths: {
    halves: true,
    thirds: true,
    quarters: true,
    fifths: true,
    sixths: true,
    twelfths: true,
  },

  columns: {
    counts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    widths: {
      xs: '20rem',
      sm: '24rem',
      md: '28rem',
      lg: '32rem',
      xl: '36rem',
      '2xl': '42rem',
      '3xl': '48rem',
      '4xl': '56rem',
      '5xl': '64rem',
      '6xl': '72rem',
      '7xl': '80rem',
    },
    ruleStyles: {
      solid: 'solid',
      dashed: 'dashed',
      dotted: 'dotted',
      double: 'double',
      none: 'none',
    },
    ruleWidths: {
      0: '0px',
      default: '1px',
      2: '2px',
      4: '4px',
      8: '8px',
    },
  },

  textShadow: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },

  ringWidths: {
    0: '0px',
    1: '1px',
    2: '2px',
    4: '4px',
    8: '8px',
    default: '3px',
  },

  ringColors: {
    inherit: 'inherit',
    current: 'currentcolor',
    transparent: 'transparent',
    white: '#fff',
    black: '#000',
    primary: 'var(--color-primary-500)',
    gray: 'var(--color-gray-500)',
  },

  ringOpacity: {
    0: '0',
    5: '0.05',
    10: '0.1',
    20: '0.2',
    25: '0.25',
    30: '0.3',
    40: '0.4',
    50: '0.5',
    60: '0.6',
    70: '0.7',
    75: '0.75',
    80: '0.8',
    90: '0.9',
    95: '0.95',
    100: '1',
  },

  outlineWidths: {
    0: '0px',
    1: '1px',
    2: '2px',
    4: '4px',
    8: '8px',
    default: '3px',
  },

  outlineOffsets: {
    0: '0px',
    1: '1px',
    2: '2px',
    4: '4px',
    8: '8px',
    default: '0px',
  },

  blendModes: {
    normal: 'normal',
    multiply: 'multiply',
    screen: 'screen',
    overlay: 'overlay',
    darken: 'darken',
    lighten: 'lighten',
    'color-dodge': 'color-dodge',
    'color-burn': 'color-burn',
    'hard-light': 'hard-light',
    'soft-light': 'soft-light',
    difference: 'difference',
    exclusion: 'exclusion',
    hue: 'hue',
    saturation: 'saturation',
    color: 'color',
    luminosity: 'luminosity',
  },

  colors: {
    primary: {
      hue: 250,
      chroma: 0.18,
      lightnessScale: {
        50: 95,
        100: 90,
        200: 85,
        300: 78,
        400: 70,
        500: 62,
        600: 55,
        700: 45,
        800: 35,
        900: 25,
        950: 20,
      },
    },
    gray: {
      hue: 250,
      chroma: 0.02,
      lightnessScale: {
        50: 96,
        100: 90,
        200: 85,
        300: 78,
        400: 70,
        500: 65,
        600: 55,
        700: 45,
        800: 35,
        900: 25,
        950: 18,
      },
    },
    success: {
      hue: 145,
      chroma: 0.2,
      lightnessScale: {
        50: 95,
        100: 90,
        200: 85,
        300: 78,
        400: 70,
        500: 62,
        600: 55,
        700: 45,
        800: 35,
        900: 25,
        950: 20,
      },
    },
    warning: {
      hue: 80,
      chroma: 0.16,
      lightnessScale: {
        50: 95,
        100: 90,
        200: 85,
        300: 78,
        400: 70,
        500: 72,
        600: 60,
        700: 50,
        800: 40,
        900: 30,
        950: 25,
      },
    },
    danger: {
      hue: 25,
      chroma: 0.22,
      lightnessScale: {
        50: 95,
        100: 90,
        200: 85,
        300: 78,
        400: 70,
        500: 62,
        600: 55,
        700: 45,
        800: 35,
        900: 25,
        950: 20,
      },
    },
    info: {
      hue: 220,
      chroma: 0.14,
      lightnessScale: {
        50: 95,
        100: 90,
        200: 85,
        300: 78,
        400: 70,
        500: 62,
        600: 55,
        700: 45,
        800: 35,
        900: 25,
        950: 20,
      },
    },
    extended: {
      blue: { hue: 250, chroma: 0.18 },
      green: { hue: 145, chroma: 0.2 },
      red: { hue: 25, chroma: 0.22 },
      yellow: { hue: 90, chroma: 0.18 },
      purple: { hue: 300, chroma: 0.22 },
      orange: { hue: 55, chroma: 0.18 },
      teal: { hue: 180, chroma: 0.16 },
      pink: { hue: 340, chroma: 0.18 },
    },
  },

  colorConfig: {
    shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
    families: {
      gray: 'gray',
      primary: 'primary',
      success: 'success',
      warning: 'warning',
      danger: 'danger',
      info: 'info',
      blue: 'blue',
      green: 'green',
      red: 'red',
      yellow: 'yellow',
      purple: 'purple',
      orange: 'orange',
      teal: 'teal',
      pink: 'pink',
    },
    bgOpacityValues: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100],
    gradientColors: {
      primary: 'primary',
      secondary: 'secondary',
      success: 'success',
      danger: 'danger',
      warning: 'warning',
      info: 'info',
      light: 'light',
      dark: 'dark',
      white: 'white',
      black: 'black',
      transparent: 'transparent',
      current: 'current',
    },
  },

  typography: {
    fontFamily: {
      sans: [
        'ui-sans-serif',
        'system-ui',
        '-apple-system',
        'BlinkMacSystemFont',
        'Segoe UI',
        'Roboto',
        'Helvetica Neue',
        'Arial',
        'sans-serif',
      ],
      serif: ['ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
      mono: [
        'ui-monospace',
        'SFMono-Regular',
        'Menlo',
        'Monaco',
        'Consolas',
        'Liberation Mono',
        'Courier New',
        'monospace',
      ],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
      '7xl': ['4.5rem', { lineHeight: '1' }],
      '8xl': ['6rem', { lineHeight: '1' }],
      '9xl': ['8rem', { lineHeight: '1' }],
    },
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
  },

  borderRadius: {
    none: '0',
    sm: '0.125rem',
    default: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none',
  },

  transition: {
    duration: {
      75: '75ms',
      100: '100ms',
      150: '150ms',
      200: '200ms',
      300: '300ms',
      500: '500ms',
      700: '700ms',
      1000: '1000ms',
    },
    timing: {
      linear: 'linear',
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  zIndex: {
    auto: 'auto',
    0: '0',
    10: '10',
    20: '20',
    30: '30',
    40: '40',
    50: '50',
  },

  opacity: {
    0: '0',
    5: '0.05',
    10: '0.1',
    20: '0.2',
    25: '0.25',
    30: '0.3',
    40: '0.4',
    50: '0.5',
    60: '0.6',
    70: '0.7',
    75: '0.75',
    80: '0.8',
    90: '0.9',
    95: '0.95',
    100: '1',
  },

  filterBlurValues: {
    0: '0',
    default: '8px',
    sm: '4px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '40px',
    '3xl': '64px',
  },

  filterBrightnessValues: {
    0: '0',
    50: '0.5',
    75: '0.75',
    90: '0.9',
    95: '0.95',
    100: '1',
    105: '1.05',
    110: '1.1',
    125: '1.25',
    150: '1.5',
    200: '2',
  },

  filterContrastValues: {
    0: '0',
    50: '0.5',
    75: '0.75',
    100: '1',
    125: '1.25',
    150: '1.5',
    200: '2',
  },

  filterGrayscaleValues: {
    0: '0',
    default: '100%',
  },

  filterHueRotateValues: {
    0: '0deg',
    15: '15deg',
    30: '30deg',
    60: '60deg',
    90: '90deg',
    180: '180deg',
  },

  filterInvertValues: {
    0: '0',
    default: '100%',
  },

  filterSaturateValues: {
    0: '0',
    50: '0.5',
    100: '1',
    150: '1.5',
    200: '2',
  },

  filterSepiaValues: {
    0: '0',
    default: '100%',
  },

  divideWidths: {
    0: '0px',
    1: '1px',
    2: '2px',
    4: '4px',
    8: '8px',
  },

  divideColors: {
    current: 'currentcolor',
    transparent: 'transparent',
    primary: 'var(--color-primary-500)',
    secondary: 'var(--color-secondary-500)',
    gray: 'var(--color-gray-500)',
  },

  divideStyles: {
    solid: 'solid',
    dashed: 'dashed',
    dotted: 'dotted',
    double: 'double',
    none: 'none',
  },

  dropShadowValues: {
    none: '0 0 #0000',
    default: '0 1px 2px 0 rgb(0 0 0 / 0.1)',
    sm: '0 1px 1px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },

  backdropOpacityValues: {
    0: '0',
    25: '0.25',
    50: '0.5',
    75: '0.75',
    100: '1',
  },
};

// ============================================================================
// Generator Functions
// ============================================================================

function generateHeader(): string {
  return `// ============================================================================
// ApexCSS Configuration - Auto-generated by Apex CSS CLI
// ============================================================================
// This file is automatically generated. Do not edit directly.
// Instead, modify your apex.config.js and run: npm run config:build
// ============================================================================`;
}

function generateFooter(): string {
  return `// ============================================================================
// End of ApexCSS Configuration
// ============================================================================`;
}

function generateFeatureToggles(features: FeatureToggles): string {
  const categories: Record<string, (keyof FeatureToggles)[]> = {
    'Core Layout': ['display', 'flexbox', 'grid', 'positioning', 'visibility'],
    'Core Spacing': ['spacing', 'sizing'],
    'Core Typography': ['typography'],
    'Core Visual': ['colors', 'backgrounds', 'borders', 'shadows', 'opacity', 'overflow', 'objectFit'],
    'Core Interaction': ['cursor', 'transitions'],
    'Extended Layout': [
      'flexExtended', 'gridExtended', 'float', 'containerQueries', 'isolation',
      'placeItems', 'justifyItems', 'spaceBetween', 'columns', 'columnsExtended',
    ],
    'Extended Typography': [
      'typographyExtended', 'fontExtended', 'letterSpacing', 'lineHeight', 'textAlignLast',
      'textDecorationExtended', 'textJustify', 'textIndent', 'textShadow', 'textEmphasis',
      'textOrientation', 'textUnderline', 'hangingPunctuation', 'hyphenate', 'initialLetter',
      'tabSize', 'wordBreak', 'wordWrap', 'writingMode', 'unicodeBidi',
    ],
    'Extended Visual': [
      'backgroundExtended', 'colorModifiers', 'blendModes', 'masks', 'borderRadiusLogical',
      'ring', 'outline', 'appearance', 'accentColor', 'colorScheme',
    ],
    'Extended Interaction': [
      'interaction', 'userSelect', 'willChange', 'all', 'caret', 'scroll',
      'overscrollBehavior', 'overscrollBehaviorExtended', 'overflowExtended',
    ],
    Effects: [
      'animations', 'transforms', 'transforms3d', 'filters', 'aspectRatio',
      'imageRendering', 'transitionBehavior',
    ],
    Content: [
      'list', 'listStyleExtended', 'table', 'counter', 'caption', 'quotes',
      'orphans', 'widows', 'pageBreak', 'break', 'verticalAlign',
    ],
    Advanced: [
      'arbitrary', 'logicalProperties', 'sizingLogical', 'offset', 'shapeOutside',
      'markerExtended', 'zoom', 'fieldSizing', 'svg', 'box', 'divide',
    ],
    'State Variants': ['states', 'hover', 'focus', 'active', 'disabled'],
    'Theme Support': ['darkMode', 'rtl', 'accessibility', 'zIndex'],
  };

  return Object.entries(categories)
    .map(([category, keys]) => {
      const header = `// ${category}`;
      const vars = keys
        .filter(key => key in features)
        .map(key => {
          const varName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
          const comment = features[key] ? 'enabled' : 'disabled';
          return `$enable-${varName}: ${features[key]} !default; // ${comment}`;
        });
      return [header, ...vars, ''].join('\n');
    })
    .join('\n');
}

function generateBreakpoints(breakpoints: Breakpoints): string {
  const entries = Object.entries(breakpoints);

  const individualVars = entries.map(([key, value]) => `$breakpoint-${key}: ${value} !default;`);

  const mapEntries = entries.map(([key, value], index) => {
    const comma = index < entries.length - 1 ? ',' : '';
    return `  "${key}": ${value}${comma}`;
  });

  const prefixEntries = entries.map(([key], index) => {
    const comma = index < entries.length - 1 ? ',' : '';
    const prefix = key === 'xxl' ? 'xxl' : key;
    return `  "${key}": ${prefix}${comma}`;
  });

  return [
    '// Individual breakpoint variables',
    ...individualVars,
    '',
    '// Breakpoints map for SCSS iteration',
    '$breakpoints: (',
    ...mapEntries,
    ') !default;',
    '',
    '// Breakpoint prefixes for responsive class names',
    '$breakpoint-prefixes: (',
    ...prefixEntries,
    ') !default;',
    '',
    '// Alias for backwards compatibility',
    '$breakpoint-class-names: $breakpoint-prefixes !default;',
  ].join('\n');
}

function generateSpacing(spacing: SpacingScale): string {
  const entries = Object.entries(spacing);
  const mapEntries = entries.map(([key, value], index) => {
    const comma = index < entries.length - 1 ? ',' : '';
    return `  ${key}: ${value}${comma}`;
  });

  return ['$spacing-scale: (', ...mapEntries, ') !default;'].join('\n');
}

function generateFractionalWidths(config: FractionalWidths): string {
  const widths: string[] = [];

  if (config.halves) {
    widths.push(String.raw`  "1\/2": 50%`);
  }

  if (config.thirds) {
    widths.push(String.raw`  "1\/3": 33.3333%`, String.raw`  "2\/3": 66.6667%`);
  }

  if (config.quarters) {
    widths.push(String.raw`  "1\/4": 25%`, String.raw`  "2\/4": 50%`, String.raw`  "3\/4": 75%`);
  }

  if (config.fifths) {
    widths.push(
      String.raw`  "1\/5": 20%`,
      String.raw`  "2\/5": 40%`,
      String.raw`  "3\/5": 60%`,
      String.raw`  "4\/5": 80%`,
    );
  }

  if (config.sixths) {
    widths.push(
      String.raw`  "1\/6": 16.6667%`,
      String.raw`  "2\/6": 33.3333%`,
      String.raw`  "3\/6": 50%`,
      String.raw`  "4\/6": 66.6667%`,
      String.raw`  "5\/6": 83.3333%`,
    );
  }

  if (config.twelfths) {
    widths.push(
      String.raw`  "1\/12": 8.3333%`,
      String.raw`  "2\/12": 16.6667%`,
      String.raw`  "3\/12": 25%`,
      String.raw`  "4\/12": 33.3333%`,
      String.raw`  "5\/12": 41.6667%`,
      String.raw`  "6\/12": 50%`,
      String.raw`  "7\/12": 58.3333%`,
      String.raw`  "8\/12": 66.6667%`,
      String.raw`  "9\/12": 75%`,
      String.raw`  "10\/12": 83.3333%`,
      String.raw`  "11\/12": 91.6667%`,
    );
  }

  const mapEntries = widths.map((line, index) => {
    const comma = index < widths.length - 1 ? ',' : '';
    return line + comma;
  });

  return ['$fractional-widths: (', ...mapEntries, ') !default;'].join('\n');
}

function generateColumns(columns: ColumnConfig): string {
  const entries = Object.entries(columns.widths);
  const ruleStyleEntries = Object.entries(columns.ruleStyles);
  const ruleWidthEntries = Object.entries(columns.ruleWidths);

  return [
    '$column-counts: (',
    ...columns.counts.map((count, index) => `  ${count}${index < columns.counts.length - 1 ? ',' : ''}`),
    ') !default;',
    '$column-widths: (',
    ...entries.map(([key, value], index) => `  "${key}": ${value}${index < entries.length - 1 ? ',' : ''}`),
    ') !default;',
    '$column-rule-styles: (',
    ...ruleStyleEntries.map(
      ([key, value], index) => `  "${key}": ${value}${index < ruleStyleEntries.length - 1 ? ',' : ''}`,
    ),
    ') !default;',
    '$column-rule-widths: (',
    ...ruleWidthEntries.map(
      ([key, value], index) => `  "${key}": ${value}${index < ruleWidthEntries.length - 1 ? ',' : ''}`,
    ),
    ') !default;',
  ].join('\n');
}

function generateTextShadow(textShadow: TextShadowConfig): string {
  const entries = Object.entries(textShadow);
  return [
    '$text-shadow-values: (',
    ...entries.map(([key, value], index) => `  "${key}": "${value}"${index < entries.length - 1 ? ',' : ''}`),
    ') !default;',
  ].join('\n');
}

function generateRingWidths(ringWidths: RingWidths): string {
  const entries = Object.entries(ringWidths);
  return [
    '$ring-widths: (',
    ...entries.map(([key, value], index) => `  "${key}": ${value}${index < entries.length - 1 ? ',' : ''}`),
    ') !default;',
  ].join('\n');
}

function generateRingColors(ringColors: RingColors): string {
  const entries = Object.entries(ringColors);
  return [
    '$ring-colors: (',
    ...entries.map(([key, value], index) => `  "${key}": ${value}${index < entries.length - 1 ? ',' : ''}`),
    ') !default;',
  ].join('\n');
}

function generateRingOpacity(ringOpacity: RingOpacity): string {
  const entries = Object.entries(ringOpacity);
  return [
    '$ring-opacity-values: (',
    ...entries.map(([key, value], index) => `  "${key}": ${value}${index < entries.length - 1 ? ',' : ''}`),
    ') !default;',
  ].join('\n');
}

function generateOutlineWidths(outlineWidths: OutlineWidths): string {
  const entries = Object.entries(outlineWidths);
  return [
    '$outline-widths: (',
    ...entries.map(([key, value], index) => `  "${key}": ${value}${index < entries.length - 1 ? ',' : ''}`),
    ') !default;',
  ].join('\n');
}

function generateOutlineOffsets(outlineOffsets: OutlineOffsets): string {
  const entries = Object.entries(outlineOffsets);
  return [
    '$outline-offsets: (',
    ...entries.map(([key, value], index) => `  "${key}": ${value}${index < entries.length - 1 ? ',' : ''}`),
    ') !default;',
  ].join('\n');
}

function generateBlendModes(blendModes: BlendModes): string {
  const entries = Object.entries(blendModes);
  return [
    '$blend-modes: (',
    ...entries.map(([key, value], index) => `  "${key}": ${value}${index < entries.length - 1 ? ',' : ''}`),
    ') !default;',
  ].join('\n');
}

function generateDivideConfig(config: ApexConfig): string {
  const widthEntries = Object.entries(config.divideWidths ?? {});
  const colorEntries = Object.entries(config.divideColors ?? {});
  const styleEntries = Object.entries(config.divideStyles ?? {});

  return [
    '$divide-widths: (',
    ...widthEntries.map(([key, value], index) => `  "${key}": ${value}${index < widthEntries.length - 1 ? ',' : ''}`),
    ') !default;',
    '$divide-colors: (',
    ...colorEntries.map(([key, value], index) => `  "${key}": ${value}${index < colorEntries.length - 1 ? ',' : ''}`),
    ') !default;',
    '$divide-styles: (',
    ...styleEntries.map(([key, value], index) => `  "${key}": ${value}${index < styleEntries.length - 1 ? ',' : ''}`),
    ') !default;',
  ].join('\n');
}

function generateFilterConfig(config: ApexConfig): string {
  const generateMap = (name: string, obj: Record<string, string>, quoteValue = false): string[] => {
    const entries = Object.entries(obj);
    return [
      `$${name}: (`,
      ...entries.map(([key, value], index) => {
        const comma = index < entries.length - 1 ? ',' : '';
        const val = quoteValue ? `"${value}"` : value;
        return `  "${key}": ${val}${comma}`;
      }),
      ') !default;',
    ];
  };

  return [
    ...generateMap('filter-blur-values', config.filterBlurValues ?? {}),
    ...generateMap('filter-brightness-values', config.filterBrightnessValues ?? {}),
    ...generateMap('filter-contrast-values', config.filterContrastValues ?? {}),
    ...generateMap('filter-grayscale-values', config.filterGrayscaleValues ?? {}),
    ...generateMap('filter-hue-rotate-values', config.filterHueRotateValues ?? {}),
    ...generateMap('filter-invert-values', config.filterInvertValues ?? {}),
    ...generateMap('filter-saturate-values', config.filterSaturateValues ?? {}),
    ...generateMap('filter-sepia-values', config.filterSepiaValues ?? {}),
    ...generateMap('drop-shadow-values', config.dropShadowValues ?? {}, true),
    ...generateMap('backdrop-opacity-values', config.backdropOpacityValues ?? {}),
  ].join('\n');
}

function generateColors(colors: ColorsConfig): string {
  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const defaultLightnessScale: Record<number, number> = {
    50: 95,
    100: 90,
    200: 85,
    300: 78,
    400: 70,
    500: 62,
    600: 55,
    700: 45,
    800: 35,
    900: 25,
    950: 20,
  };

  const generateColorScale = (name: string, config: OKLCHColor): string[] => {
    const { hue, chroma, lightnessScale } = config;
    return shades.map(shade => {
      const lightness = lightnessScale?.[shade] ?? defaultLightnessScale[shade];
      return `$color-${name}-${shade}: oklch(${lightness}% ${chroma} ${hue}deg) !default;`;
    });
  };

  const sections: string[] = [];

  if (colors.primary) {
    sections.push('// Primary Color Scale (OKLCH)', ...generateColorScale('primary', colors.primary));
  }

  if (colors.gray) {
    sections.push('', '// Gray Scale (OKLCH)', ...generateColorScale('gray', colors.gray));
  }

  const semanticColors: (keyof ColorsConfig)[] = ['success', 'warning', 'danger', 'info'];
  semanticColors.forEach(colorName => {
    const cfg = colors[colorName];
    if (cfg && 'hue' in cfg && 'chroma' in cfg) {
      const title = colorName.charAt(0).toUpperCase() + colorName.slice(1);
      sections.push('', `// ${title} Color Scale (OKLCH)`, ...generateColorScale(colorName, cfg as OKLCHColor));
    }
  });

  if (colors.extended) {
    const extendedLines = Object.entries(colors.extended).flatMap(([colorName, config]) => {
      const { hue, chroma } = config;
      return shades.map(shade => {
        const lightness = defaultLightnessScale[shade];
        return `$color-${colorName}-${shade}: oklch(${lightness}% ${chroma} ${hue}deg) !default;`;
      });
    });
    sections.push('', '// Extended Color Palette (OKLCH)', ...extendedLines);
  }

  sections.push(
    '',
    '// Semantic Color Aliases',
    '$color-primary: $color-primary-500 !default;',
    '$color-success: $color-success-500 !default;',
    '$color-warning: $color-warning-500 !default;',
    '$color-danger: $color-danger-500 !default;',
    '$color-info: $color-info-500 !default;',
  );

  return sections.join('\n');
}

function generateColorConfig(colorConfig: ColorConfigMap): string {
  const familyEntries = Object.entries(colorConfig.families);
  const gradientEntries = Object.entries(colorConfig.gradientColors);

  return [
    '',
    '// ============================================================================',
    '// Color Scale Maps (for programmatic utility generation)',
    '// ============================================================================',
    '',
    '// Color shades used for scale generation',
    `$color-shades: (${colorConfig.shades.join(', ')}) !default;`,
    '',
    '// Color families for utility generation',
    '$color-families: (',
    ...familyEntries.map(
      ([key, value], index) => `  "${key}": "${value}"${index < familyEntries.length - 1 ? ',' : ''}`,
    ),
    ') !default;',
    '',
    '// Background opacity values for color modifiers',
    `$bg-opacity-values: (${colorConfig.bgOpacityValues.join(', ')}) !default;`,
    '',
    '// Gradient color stops',
    '$gradient-colors: (',
    ...gradientEntries.map(
      ([key, value], index) => `  "${key}": "${value}"${index < gradientEntries.length - 1 ? ',' : ''}`,
    ),
    ') !default;',
  ].join('\n');
}

function generateTypography(typography: TypographyConfig): string {
  const sassColorNames = new Set([
    'black', 'white', 'red', 'green', 'blue', 'gray', 'orange',
    'purple', 'yellow', 'pink', 'brown', 'cyan', 'magenta', 'navy',
    'olive', 'silver', 'teal', 'maroon', 'aqua', 'fuchsia', 'lime',
  ]);

  const familyEntries = Object.entries(typography.fontFamily);
  const sizeEntries = Object.entries(typography.fontSize);
  const weightEntries = Object.entries(typography.fontWeight);
  const spacingEntries = Object.entries(typography.letterSpacing);
  const heightEntries = Object.entries(typography.lineHeight);

  return [
    '// Font Families',
    '$font-families: (',
    ...familyEntries.map(([key, value], index) => {
      const comma = index < familyEntries.length - 1 ? ',' : '';
      const fontList = Array.isArray(value) ? value.join(', ') : value;
      return `  "${key}": "${fontList}"${comma}`;
    }),
    ') !default;',
    '',
    '// Font Sizes',
    '$font-sizes: (',
    ...sizeEntries.map(([key, value], index) => {
      const comma = index < sizeEntries.length - 1 ? ',' : '';
      const size = Array.isArray(value) ? value[0] : value;
      return `  "${key}": ${size}${comma}`;
    }),
    ') !default;',
    '',
    '// Font Weights',
    '$font-weights: (',
    ...weightEntries.map(([key, value], index) => {
      const comma = index < weightEntries.length - 1 ? ',' : '';
      const safeKey = sassColorNames.has(key) ? `"${key}"` : key;
      return `  ${safeKey}: ${value}${comma}`;
    }),
    ') !default;',
    '',
    '// Letter Spacing',
    '$letter-spacing: (',
    ...spacingEntries.map(
      ([key, value], index) => `  "${key}": ${value}${index < spacingEntries.length - 1 ? ',' : ''}`,
    ),
    ') !default;',
    '',
    '// Line Heights',
    '$line-heights: (',
    ...heightEntries.map(([key, value], index) => `  "${key}": ${value}${index < heightEntries.length - 1 ? ',' : ''}`),
    ') !default;',
  ].join('\n');
}

function generateBorderRadius(borderRadius: BorderRadiusConfig): string {
  const entries = Object.entries(borderRadius);
  return [
    '$border-radius-scale: (',
    ...entries.map(([key, value], index) => `  "${key}": ${value}${index < entries.length - 1 ? ',' : ''}`),
    ') !default;',
  ].join('\n');
}

function generateShadows(shadows: ShadowsConfig): string {
  const entries = Object.entries(shadows);
  return [
    '$shadows: (',
    ...entries.map(([key, value], index) => {
      const comma = index < entries.length - 1 ? ',' : '';
      const needsQuotes = value.includes(',');
      const formattedValue = needsQuotes ? `"${value}"` : value;
      return `  "${key}": ${formattedValue}${comma}`;
    }),
    ') !default;',
  ].join('\n');
}

function generateTransitions(transition: TransitionConfig): string {
  const durationEntries = Object.entries(transition.duration);
  const timingEntries = Object.entries(transition.timing);

  return [
    '// Transition Durations',
    '$transition-duration: (',
    ...durationEntries.map(
      ([key, value], index) => `  "${key}": ${value}${index < durationEntries.length - 1 ? ',' : ''}`,
    ),
    ') !default;',
    '',
    '// Transition Timing Functions',
    '$transition-timing: (',
    ...timingEntries.map(([key, value], index) => `  "${key}": ${value}${index < timingEntries.length - 1 ? ',' : ''}`),
    ') !default;',
  ].join('\n');
}

function generateZIndex(zIndex: ZIndexConfig): string {
  const entries = Object.entries(zIndex);
  return [
    '$z-index: (',
    ...entries.map(([key, value], index) => `  "${key}": ${value}${index < entries.length - 1 ? ',' : ''}`),
    ') !default;',
  ].join('\n');
}

function generateOpacity(opacity: OpacityConfig): string {
  const entries = Object.entries(opacity);
  return [
    '$opacity-scale: (',
    ...entries.map(([key, value], index) => `  ${key}: ${value}${index < entries.length - 1 ? ',' : ''}`),
    ') !default;',
  ].join('\n');
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Generate SCSS configuration from user config
 */
export function generateSCSS(config: ApexConfig): string {
  const merged = mergeDeep(defaultConfig, config);

  const sections = [
    generateHeader(),
    generateFeatureToggles(merged.features),
    generateBreakpoints(merged.breakpoints),
    generateSpacing(merged.spacing),
    generateFractionalWidths(merged.fractionalWidths),
    generateColumns(merged.columns),
    generateTextShadow(merged.textShadow),
    generateBlendModes(merged.blendModes),
    generateFilterConfig(merged),
    generateRingWidths(merged.ringWidths),
    generateRingColors(merged.ringColors),
    generateRingOpacity(merged.ringOpacity),
    generateOutlineWidths(merged.outlineWidths),
    generateOutlineOffsets(merged.outlineOffsets),
    generateColors(merged.colors),
    generateColorConfig(merged.colorConfig),
    generateTypography(merged.typography),
    generateBorderRadius(merged.borderRadius),
    generateShadows(merged.shadows),
    generateTransitions(merged.transition),
    generateZIndex(merged.zIndex),
    generateOpacity(merged.opacity),
    generateDivideConfig(merged),
    generateFooter(),
  ];

  return sections.join('\n\n');
}

/**
 * Deep merge two objects
 */
export function mergeDeep<T extends Record<string, unknown>>(target: T, source: unknown): T {
  const output: Record<string, unknown> = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject((source as Record<string, unknown>)[key])) {
        if (key in target) {
          output[key] = mergeDeep(target[key] as Record<string, unknown>, (source as Record<string, unknown>)[key]);
        } else {
          output[key] = (source as Record<string, unknown>)[key];
        }
      } else {
        output[key] = (source as Record<string, unknown>)[key];
      }
    });
  }
  return output as T;
}

/**
 * Check if value is a plain object
 */
export function isObject(item: unknown): item is Record<string, unknown> {
  return Boolean(item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Get the type of a value
 */
function getType(value: unknown): string {
  if (Array.isArray(value)) {
    return 'array';
  }

  if (value === null) {
    return 'null';
  }

  return typeof value;
}

/**
 * Validate user config shape and value types against defaults.
 */
export function validateUserConfig(
  userConfig: unknown,
  defaults: unknown = defaultConfig,
  currentPath = '',
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isObject(userConfig)) {
    if (userConfig === undefined || userConfig === null) {
      return { errors, warnings };
    }

    errors.push(`Configuration root must be an object, received ${getType(userConfig)}.`);
    return { errors, warnings };
  }

  if (!isObject(defaults)) {
    return { errors, warnings };
  }

  Object.entries(userConfig).forEach(([key, value]) => {
    const pathKey = currentPath ? `${currentPath}.${key}` : key;
    const isTopLevel = currentPath === '';
    const isFeatureKey = currentPath === 'features';

    if (!(key in defaults)) {
      if (isTopLevel || isFeatureKey) {
        warnings.push(`Unknown config key \`${pathKey}\` will be ignored by generators.`);
      }
      return;
    }

    const defaultValue = defaults[key];
    const expectedType = getType(defaultValue);
    const actualType = getType(value);

    if (expectedType !== actualType) {
      errors.push(`Invalid type for \`${pathKey}\`: expected ${expectedType}, received ${actualType}.`);
      return;
    }

    if (expectedType === 'object') {
      const nested = validateUserConfig(value, defaultValue, pathKey);
      errors.push(...nested.errors);
      warnings.push(...nested.warnings);
    }
  });

  if (isObject(userConfig.features)) {
    Object.entries(userConfig.features).forEach(([featureKey, featureValue]) => {
      if (typeof featureValue !== 'boolean') {
        errors.push(
          `Invalid feature toggle \`features.${featureKey}\`: expected boolean, received ${getType(featureValue)}.`,
        );
      }
    });
  }

  return { errors, warnings };
}

/**
 * Parse command line arguments
 */
function parseArgs(): BuilderOptions {
  const args = process.argv.slice(2);
  const options: BuilderOptions = {
    config: 'src/apex.config.js',
    output: 'src/config',
    watch: false,
    init: false,
  };

  args.forEach(arg => {
    if (arg.startsWith('--config=')) {
      options.config = arg.split('=')[1] ?? options.config;
    } else if (arg.startsWith('--output=')) {
      options.output = arg.split('=')[1] ?? options.output;
    } else if (arg === '--watch' || arg === '-w') {
      options.watch = true;
    } else if (arg === '--init') {
      options.init = true;
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
  });

  return options;
}

/**
 * Show help message
 */
function showHelp(): void {
  console.log(`
ApexCSS Configuration Builder

Usage: node config-builder.js [options]

Options:
  --config=<file>    Config file path (default: src/apex.config.js)
  --output=<dir>     Output directory (default: src/config)
  --watch, -w        Watch for changes and rebuild
  --init             Create sample config file
  --help, -h         Show this help

Examples:
  node config-builder.js
  node config-builder.js --config=custom.config.js
  node config-builder.js --watch
  node config-builder.js --init
`);
}

/**
 * Load user configuration (optional)
 */
async function loadConfig(configPath: string): Promise<ApexConfig> {
  const fullPath = resolve(process.cwd(), configPath);

  try {
    await access(fullPath);
    const module = await import(`${fullPath}?t=${Date.now()}`);
    const loaded: unknown = module.default ?? module;

    if (!isObject(loaded)) {
      throw new Error(`Expected exported config object but received ${getType(loaded)}.`);
    }

    return loaded as ApexConfig;
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error?.code === 'ENOENT') {
      logInfo(`Config file not found at ${configPath}; using defaults.`);
      return {};
    }

    throw new Error(`Failed to load config file ${configPath}: ${error.message}`);
  }
}

/**
 * Main build function
 */
export async function build(options: BuilderOptions): Promise<void> {
  try {
    const userConfig = await loadConfig(options.config);
    const validation = validateUserConfig(userConfig);

    validation.warnings.forEach(logWarn);

    if (validation.errors.length > 0) {
      const details = validation.errors.map(error => `- ${error}`).join('\n');
      throw new Error(`Configuration validation failed:\n${details}`);
    }

    const mergedConfig = mergeDeep(defaultConfig, userConfig);

    const scss = generateSCSS(userConfig);

    await mkdir(options.output, { recursive: true });

    const scssPath = resolve(options.output, '_custom-config.scss');
    await writeFile(scssPath, scss);
    logInfo(`Generated: ${scssPath}`);

    if (isObject(mergedConfig.features)) {
      const featureEntries = Object.values(mergedConfig.features);
      const enabled = featureEntries.filter(Boolean).length;
      const total = featureEntries.length;
      logInfo(`Feature toggles enabled: ${enabled}/${total}`);
    }

    console.log('\n🎉 Configuration built successfully!');
    console.log('   Run "npm run build" to compile the framework.\n');
  } catch (err) {
    const error = err as Error;
    logError(`Build failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Initialize config file
 */
async function init(): Promise<void> {
  const configPath = resolve(process.cwd(), 'src/apex.config.js');

  const sample = generateSampleConfig();
  await writeFile(configPath, sample);
  console.log('✅ Created: src/apex.config.js\n');
  console.log('   Edit this file to customize ApexCSS, then run:');
  console.log('   npm run config:build\n');
}

/**
 * Watch for changes
 */
async function watch(options: BuilderOptions): Promise<void> {
  const configPath = resolve(process.cwd(), options.config);

  logInfo(`Watching ${options.config} for changes...`);
  console.log('');

  await build(options);

  watchFile(configPath, async (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
      console.log('📝 Config changed, rebuilding...\n');
      await build(options);
    }
  });
}

// ============================================================================
// Sample Config Generator
// ============================================================================

function generateSampleConfig(): string {
  const featureCategories: Record<string, (keyof FeatureToggles)[]> = {
    'Core Layout': ['display', 'flexbox', 'grid', 'positioning', 'visibility'],
    'Core Spacing': ['spacing', 'sizing'],
    'Core Typography': ['typography'],
    'Core Visual': ['colors', 'backgrounds', 'borders', 'shadows', 'opacity', 'overflow', 'objectFit'],
    'Core Interaction': ['cursor', 'transitions'],
    'Extended Layout': [
      'flexExtended', 'gridExtended', 'float', 'containerQueries', 'isolation',
      'placeItems', 'justifyItems', 'spaceBetween', 'columns', 'columnsExtended',
    ],
    'Extended Typography': [
      'typographyExtended', 'fontExtended', 'letterSpacing', 'lineHeight', 'textAlignLast',
      'textDecorationExtended', 'textJustify', 'textIndent', 'textShadow', 'textEmphasis',
      'textOrientation', 'textUnderline', 'hangingPunctuation', 'hyphenate', 'initialLetter',
      'tabSize', 'wordBreak', 'wordWrap', 'writingMode', 'unicodeBidi',
    ],
    'Extended Visual': [
      'backgroundExtended', 'colorModifiers', 'blendModes', 'masks', 'borderRadiusLogical',
      'ring', 'outline', 'appearance', 'accentColor', 'colorScheme',
    ],
    'Extended Interaction': [
      'interaction', 'userSelect', 'willChange', 'all', 'caret', 'scroll',
      'overscrollBehavior', 'overscrollBehaviorExtended', 'overflowExtended',
    ],
    Effects: [
      'animations', 'transforms', 'transforms3d', 'filters', 'aspectRatio',
      'imageRendering', 'transitionBehavior',
    ],
    Content: [
      'list', 'listStyleExtended', 'table', 'counter', 'caption', 'quotes',
      'orphans', 'widows', 'pageBreak', 'break', 'verticalAlign',
    ],
    Advanced: [
      'arbitrary', 'logicalProperties', 'sizingLogical', 'offset', 'shapeOutside',
      'markerExtended', 'zoom', 'fieldSizing', 'svg', 'box', 'divide',
    ],
    'State Variants': ['states', 'hover', 'focus', 'active', 'disabled'],
    'Theme Support': ['darkMode', 'rtl', 'accessibility', 'zIndex'],
  };

  const featuresSection = Object.entries(featureCategories)
    .map(([category, keys]) => {
      const featureLines = keys.filter(key => key in defaultConfig.features).map(key => `    ${key}: true,`);
      return `    // ${category}\n${featureLines.join('\n')}\n`;
    })
    .join('\n');

  return `/**
 * ApexCSS Configuration File
 *
 * This is your configuration file for customizing ApexCSS.
 * All features are enabled by default. Set any feature to false to disable it
 * and reduce your bundle size.
 *
 * Usage:
 *   1. Modify the values below to customize the framework
 *   2. Run: npm run config:build
 *   3. The SCSS files will be regenerated with your customizations
 *
 */

export default {
  // ============================================================================
  // Feature Toggles - Enable/disable utility categories
  // ============================================================================
  features: {
${featuresSection.trim()}
  },

  // ============================================================================
  // Breakpoints - Customize responsive breakpoints
  // ============================================================================
  breakpoints: {
    sm: '320px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    xxl: '1536px'
  },

  // ============================================================================
  // Spacing Scale - Customize margin/padding values
  // ============================================================================
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    4: '1rem',
    8: '2rem',
    16: '4rem'
    // Add or remove values as needed
  },

  // ============================================================================
  // Colors - Customize your color palette (OKLCH format)
  // ============================================================================
  // Define colors with OKLCH format: { hue, chroma, lightnessScale }
  // - hue: 0-360 (color wheel angle)
  // - chroma: 0-0.4 (color intensity)
  // - lightnessScale: { 50: 95, 100: 90, ... 950: 20 } (perceptual lightness values)
  //
  // Example: Change primary from blue (250) to purple (300):
  //   primary: { hue: 300, chroma: 0.18, lightnessScale: { ... } }
  // ============================================================================
  colors: {
    primary: {
      hue: 250,        // Blue
      chroma: 0.18,    // Moderate saturation
      lightnessScale: {
        50: 95, 100: 90, 200: 85, 300: 78, 400: 70,
        500: 62, 600: 55, 700: 45, 800: 35, 900: 25, 950: 20
      }
    }
    // Add your brand colors here:
    // brand: {
    //   hue: 340,        // Pink
    //   chroma: 0.20,
    //   lightnessScale: { 50: 95, 100: 90, ... 950: 20 }
    // }
  }
};
`;
}

// ============================================================================
// Main Execution
// ============================================================================

async function main(): Promise<void> {
  const options = parseArgs();

  if (options.init) {
    await init();
    return;
  }

  if (options.watch) {
    await watch(options);
  } else {
    await build(options);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
