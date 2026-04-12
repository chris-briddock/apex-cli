/**
 * Configuration loader utility
 * Loads and validates user configuration files
 */

import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { logger } from './logger.js';

/**
 * Default configuration
 */
export const defaultConfig = {
  features: {
    // Core Layout
    display: true,
    flexbox: true,
    grid: true,
    positioning: true,
    visibility: true,

    // Core Spacing
    spacing: true,
    sizing: true,

    // Core Typography
    typography: true,

    // Core Visual
    colors: true,
    backgrounds: true,
    borders: true,
    shadows: true,
    opacity: true,
    overflow: true,
    objectFit: true,

    // Core Interaction
    cursor: true,
    transitions: true,

    // Extended features default to true
    flexExtended: true,
    gridExtended: true,
    typographyExtended: true,
    animations: true,
    transforms: true,
    transforms3d: true,
    filters: true,
    darkMode: true,
    rtl: true,
    accessibility: true
  },

  breakpoints: {
    sm: '320px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    xxl: '2560px',
    xxxl: '3840px',
    ultra: '7680px'
  },

  spacing: {
    0: '0',
    px: '1px',
    0.5: '0.125rem',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem',
    40: '10rem',
    48: '12rem',
    64: '16rem',
    80: '20rem',
    96: '24rem'
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
        950: 20
      }
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
        950: 18
      }
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
        950: 20
      }
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
        950: 25
      }
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
        950: 20
      }
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
        950: 20
      }
    }
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
        'sans-serif'
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
        'monospace'
      ]
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
      '9xl': ['8rem', { lineHeight: '1' }]
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
      black: '900'
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em'
    },
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2'
    }
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
    full: '9999px'
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none'
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
      1000: '1000ms'
    },
    timing: {
      linear: 'linear',
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },

  zIndex: {
    auto: 'auto',
    0: '0',
    10: '10',
    20: '20',
    30: '30',
    40: '40',
    50: '50'
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
    100: '1'
  }
};

/**
 * Load configuration from file
 * @param {string} configPath - Path to config file
 * @returns {object} Merged configuration
 */
export function loadConfig(configPath) {
  const fullPath = resolve(process.cwd(), configPath);

  if (!existsSync(fullPath)) {
    logger.warn(`Config file not found at ${configPath}, using defaults`);
    return { ...defaultConfig };
  }

  try {
    // Support both .js and .json config files
    let userConfig = {};

    if (configPath.endsWith('.json')) {
      // JSON config
      const content = readFileSync(fullPath, 'utf-8');
      userConfig = JSON.parse(content);
    } else {
      // JS config - use require for synchronous loading
      const require = createRequire(pathToFileURL(fullPath));
      delete require.cache[require.resolve(fullPath)];
      const loadedModule = require(fullPath);
      userConfig = loadedModule.default || loadedModule;
    }

    // Validate and merge
    const merged = mergeConfig(defaultConfig, userConfig);

    // Validate the merged config
    const validation = validateConfig(merged);
    if (!validation.valid) {
      const errorMessages = validation.errors.map(e => `  - ${e}`).join('\n');
      throw new Error(`Configuration validation failed:\n${errorMessages}`);
    }

    return merged;
  } catch (error) {
    if (error.code === 'ENOENT') {
      logger.warn(`Config file not found at ${configPath}, using defaults`);
      return { ...defaultConfig };
    }
    throw new Error(`Failed to load config: ${error.message}`);
  }
}

/**
 * Deep merge configuration objects
 * @param {object} target - Base configuration
 * @param {object} source - User configuration
 * @returns {object} - Merged configuration
 */
export function mergeConfig(target, source) {
  const output = { ...target };

  for (const key in source) {
    if (Object.hasOwn(source, key)) {
      if (isObject(source[key]) && isObject(target[key])) {
        output[key] = mergeConfig(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    }
  }

  return output;
}

/**
 * Check if value is a plain object
 * @param {*} item - Value to check
 * @returns {boolean}
 */
/**
 * Check if value is a plain object
 * @param {*} item - Value to check
 * @returns {boolean}
 */
export function isObject(item) {
  return Boolean(item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Validates that all feature values are booleans
 * @param {object} features - Features configuration
 * @param {Array} errors - Error collection
 */
export function validateFeatures(features, errors) {
  for (const [key, value] of Object.entries(features)) {
    if (typeof value !== 'boolean') {
      errors.push(`features.${key} must be a boolean`);
    }
  }
}

/**
 * Validates that all breakpoints are valid CSS lengths
 * @param {object} breakpoints - Breakpoints configuration
 * @param {Array} errors - Error collection
 */
/**
 * Validates that all breakpoints are valid CSS lengths
 * @param {object} breakpoints - Breakpoints configuration
 * @param {Array} errors - Error collection
 */
export function validateBreakpoints(breakpoints, errors) {
  const cssLengthPattern = /^\d+(px|rem|em|%)?$/;
  for (const [key, value] of Object.entries(breakpoints)) {
    if (typeof value !== 'string' || !cssLengthPattern.test(value)) {
      errors.push(`breakpoints.${key} must be a valid CSS length`);
    }
  }
}

/**
 * Validates that all color configurations are valid
 * @param {object} colors - Colors configuration
 * @param {Array} errors - Error collection
 */
export function validateColors(colors, errors) {
  for (const [colorName, colorConfig] of Object.entries(colors)) {
    validateColorHue(colorConfig, colorName, errors);
    validateColorChroma(colorConfig, colorName, errors);
  }
}

/**
 * Validates a color's hue value
 * @param {object} colorConfig - Color configuration
 * @param {string} colorName - Name of the color
 * @param {Array} errors - Error collection
 */
export function validateColorHue(colorConfig, colorName, errors) {
  if (colorConfig.hue === undefined) {
    return;
  }
  if (typeof colorConfig.hue !== 'number' || colorConfig.hue < 0 || colorConfig.hue > 360) {
    errors.push(`colors.${colorName}.hue must be between 0 and 360`);
  }
}

/**
 * Validates a color's chroma value
 * @param {object} colorConfig - Color configuration
 * @param {string} colorName - Name of the color
 * @param {Array} errors - Error collection
 */
export function validateColorChroma(colorConfig, colorName, errors) {
  if (colorConfig.chroma === undefined) {
    return;
  }
  if (typeof colorConfig.chroma !== 'number' || colorConfig.chroma < 0 || colorConfig.chroma > 0.4) {
    errors.push(`colors.${colorName}.chroma must be between 0 and 0.4`);
  }
}

/**
 * Validate configuration
 * @param {object} config - Configuration to validate
 * @returns {object} - Validation result
 */
export function validateConfig(config) {
  const errors = [];
  const warnings = [];

  if (config.features) {
    validateFeatures(config.features, errors);
  }

  if (config.breakpoints) {
    validateBreakpoints(config.breakpoints, errors);
  }

  if (config.colors) {
    validateColors(config.colors, errors);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generate a sample configuration file content
 * @returns {string} - Configuration file content
 */
export function generateSampleConfig() {
  return `/**
 * ApexCSS Configuration File
 *
 * This is your configuration file for customizing ApexCSS.
 * All features are enabled by default. Set any feature to false to disable it
 * and reduce your bundle size.
 *
 * Usage:
 *   1. Modify the values below to customize the framework
 *   2. Run: npx apexcss build
 *   3. The CSS will be regenerated with your customizations
 *
 * For full documentation, visit: https://docs.apex-css.com
 */

export default {
  // ============================================================================
  // Feature Toggles - Enable/disable utility categories
  // Set to false to exclude specific utilities from the build
  // ============================================================================
  features: {
    // Core Layout
    display: true,
    flexbox: true,
    grid: true,
    positioning: true,
    visibility: true,

    // Core Spacing
    spacing: true,
    sizing: true,

    // Core Typography
    typography: true,

    // Core Visual
    colors: true,
    backgrounds: true,
    borders: true,
    shadows: true,
    opacity: true,
    overflow: true,
    objectFit: true,

    // Core Interaction
    cursor: true,
    transitions: true,

    // Extended Layout
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

    // Extended Typography
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

    // Extended Visual
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

    // Extended Interaction
    interaction: true,
    userSelect: true,
    willChange: true,
    all: true,
    caret: true,
    scroll: true,
    overscrollBehavior: true,
    overscrollBehaviorExtended: true,
    overflowExtended: true,

    // Effects
    animations: true,
    transforms: true,
    transforms3d: true,
    filters: true,
    aspectRatio: true,
    imageRendering: true,
    transitionBehavior: true,

    // Content
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

    // Advanced
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

    // State Variants
    states: true,
    hover: true,
    focus: true,
    active: true,
    disabled: true,

    // Theme Support
    darkMode: true,
    rtl: true,
    accessibility: true,
    zIndex: true
  },

  // ============================================================================
  // Breakpoints - Customize responsive breakpoints
  // ============================================================================
  breakpoints: {
    sm: '320px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    xxl: '2560px', // 2K / QHD
    xxxl: '3840px', // 4K / UHD
    ultra: '7680px' // 8K
  },

  // ============================================================================
  // Spacing Scale - Customize margin/padding values
  // ============================================================================
  spacing: {
    0: '0',
    px: '1px',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    11: '2.75rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem'
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
    // Primary Blue
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
        950: 20
      }
    },
    // Gray (neutral, low chroma)
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
        950: 18
      }
    },
    // Success Green
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
        950: 20
      }
    },
    // Warning Amber
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
        950: 25
      }
    },
    // Danger Red
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
        950: 20
      }
    },
    // Info Sky
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
        950: 20
      }
    },
    // Extended palette
    extended: {
      blue: { hue: 250, chroma: 0.18 },
      green: { hue: 145, chroma: 0.2 },
      red: { hue: 25, chroma: 0.22 },
      yellow: { hue: 90, chroma: 0.18 },
      purple: { hue: 300, chroma: 0.22 },
      orange: { hue: 55, chroma: 0.18 },
      teal: { hue: 180, chroma: 0.16 },
      pink: { hue: 340, chroma: 0.18 }
    }
  },

  // ============================================================================
  // Typography - Font families, sizes, weights, spacing
  // ============================================================================
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
        'sans-serif'
      ],
      serif: [
        'ui-serif',
        'Georgia',
        'Cambria',
        'Times New Roman',
        'Times',
        'serif'
      ],
      mono: [
        'ui-monospace',
        'SFMono-Regular',
        'Menlo',
        'Monaco',
        'Consolas',
        'Liberation Mono',
        'Courier New',
        'monospace'
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
      '9xl': ['8rem', { lineHeight: '1' }]
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
      black: '900'
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em'
    },
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2'
    }
  },

  // ============================================================================
  // Border Radius - Corner roundness values
  // ============================================================================
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    default: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px'
  },

  // ============================================================================
  // Shadows - Box shadow values
  // ============================================================================
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none'
  },

  // ============================================================================
  // Transitions - Animation timing
  // ============================================================================
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
      'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },

  // ============================================================================
  // Z-Index - Stacking order values
  // ============================================================================
  zIndex: {
    auto: 'auto',
    0: '0',
    10: '10',
    20: '20',
    30: '30',
    40: '40',
    50: '50'
  },

  // ============================================================================
  // Opacity - Transparency values
  // ============================================================================
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
    100: '1'
  },
};
`;
}
