#!/usr/bin/env node

/**
 * ApexCSS Configuration Builder
 *
 * This script generates SCSS configuration files from JavaScript config.
 * It allows users to customize the framework via a JS config file.
 *
 * Usage:
 *   node tools/config-builder.js --config=apex.config.js
 *   node tools/config-builder.js --watch
 *
 * Options:
 *   --config    Path to configuration file (default: src/apex.config.js)
 *   --output    Output directory (default: src/config)
 *   --watch     Watch for changes and rebuild automatically
 *   --help      Show help
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

const LOG_PREFIX = '[apex-config-builder]';

function logInfo(message) {
  console.log(`${LOG_PREFIX} INFO: ${message}`);
}

function logWarn(message) {
  console.warn(`${LOG_PREFIX} WARN: ${message}`);
}

function logError(message) {
  console.error(`${LOG_PREFIX} ERROR: ${message}`);
}

// Complete default configuration with all feature toggles
const defaultConfig = {
  // ============================================================================
  // Feature Toggles - Enable/disable utility categories
  // ============================================================================
  features: {
    // Core Layout Utilities
    display: true,
    flexbox: true,
    grid: true,
    positioning: true,
    visibility: true,

    // Core Spacing Utilities
    spacing: true,
    sizing: true,

    // Core Typography Utilities
    typography: true,

    // Core Visual Utilities
    colors: true,
    backgrounds: true,
    borders: true,
    shadows: true,
    opacity: true,
    overflow: true,
    objectFit: true,

    // Core Interaction Utilities
    cursor: true,
    transitions: true,

    // Extended Layout Utilities
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

    // Extended Typography Utilities
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

    // Extended Visual Utilities
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

    // Extended Interaction Utilities
    interaction: true,
    userSelect: true,
    willChange: true,
    all: true,
    caret: true,
    scroll: true,
    overscrollBehavior: true,
    overscrollBehaviorExtended: true,
    overflowExtended: true,

    // Effects (Animations, Transforms, Filters)
    animations: true,
    transforms: true,
    transforms3d: true,
    filters: true,
    aspectRatio: true,
    imageRendering: true,
    transitionBehavior: true,

    // Content Utilities (Lists, Tables, Print)
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

    // Advanced/Specialized Utilities
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
  // Breakpoints - Responsive design breakpoints
  // ============================================================================
  breakpoints: {
    sm: '320px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    xxl: '2560px',
    xxxl: '3840px'
  },

  // ============================================================================
  // Spacing Scale - Margin, padding, and gap values
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
  // Fractional Widths - Percentage-based width utilities (w-1/2, w-1/3, etc.)
  // ============================================================================
  fractionalWidths: {
    // Enable/disable specific denominators
    // When enabled, generates utilities like w-1/2, w-1/3, w-2/3, etc.
    halves: true,
    thirds: true,
    quarters: true,
    fifths: true,
    sixths: true,
    twelfths: true
  },

  // ============================================================================
  // Column Configuration - CSS Multi-Column Layout
  // ============================================================================
  columns: {
    // Column counts to generate utilities for
    counts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    // Column widths
    widths: {
      'xs': '20rem',
      'sm': '24rem',
      'md': '28rem',
      'lg': '32rem',
      'xl': '36rem',
      '2xl': '42rem',
      '3xl': '48rem',
      '4xl': '56rem',
      '5xl': '64rem',
      '6xl': '72rem',
      '7xl': '80rem'
    },
    // Column rule styles
    ruleStyles: {
      'solid': 'solid',
      'dashed': 'dashed',
      'dotted': 'dotted',
      'double': 'double',
      'none': 'none'
    },
    // Column rule widths
    ruleWidths: {
      '0': '0px',
      'default': '1px',
      '2': '2px',
      '4': '4px',
      '8': '8px'
    }
  },

  // ============================================================================
  // Text Shadow Values
  // ============================================================================
  textShadow: {
    'none': 'none',
    'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    'default': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
  },

  // ============================================================================
  // Ring Widths - Focus ring widths
  // ============================================================================
  ringWidths: {
    '0': '0px',
    '1': '1px',
    '2': '2px',
    '4': '4px',
    '8': '8px',
    'default': '3px'
  },

  // ============================================================================
  // Ring Colors - Focus ring colors
  // ============================================================================
  ringColors: {
    "inherit": "inherit",
    "current": "currentcolor",
    "transparent": "transparent",
    "white": "#fff",
    "black": "#000",
    "primary": "var(--color-primary-500)",
    "gray": "var(--color-gray-500)"
  },

  // ============================================================================
  // Ring Opacity Values
  // ============================================================================
  ringOpacity: {
    "0": "0",
    "5": "0.05",
    "10": "0.1",
    "20": "0.2",
    "25": "0.25",
    "30": "0.3",
    "40": "0.4",
    "50": "0.5",
    "60": "0.6",
    "70": "0.7",
    "75": "0.75",
    "80": "0.8",
    "90": "0.9",
    "95": "0.95",
    "100": "1"
  },

  // ============================================================================
  // Outline Widths - Focus outline widths
  // ============================================================================
  outlineWidths: {
    "0": "0px",
    "1": "1px",
    "2": "2px",
    "4": "4px",
    "8": "8px",
    "default": "3px"
  },

  // ============================================================================
  // Outline Offsets
  // ============================================================================
  outlineOffsets: {
    "0": "0px",
    "1": "1px",
    "2": "2px",
    "4": "4px",
    "8": "8px",
    "default": "0px"
  },

  // ============================================================================
  // Blend Modes - CSS blend modes for mix-blend-mode and background-blend-mode
  // ============================================================================
  blendModes: {
    'normal': 'normal',
    'multiply': 'multiply',
    'screen': 'screen',
    'overlay': 'overlay',
    'darken': 'darken',
    'lighten': 'lighten',
    'color-dodge': 'color-dodge',
    'color-burn': 'color-burn',
    'hard-light': 'hard-light',
    'soft-light': 'soft-light',
    'difference': 'difference',
    'exclusion': 'exclusion',
    'hue': 'hue',
    'saturation': 'saturation',
    'color': 'color',
    'luminosity': 'luminosity'
  },

  // ============================================================================
  // Colors - OKLCH Color Scales (Perceptually uniform color space)
  // Define base colors with OKLCH values, and full scales will be generated
  // Format: { lightness: 0-100%, chroma: 0-0.4, hue: 0-360 }
  // ============================================================================
  colors: {
    // Primary Blue
    primary: {
      hue: 250,
      chroma: 0.18,
      // Scale will be generated from these lightness values
      lightnessScale: {
        50: 95, 100: 90, 200: 85, 300: 78, 400: 70,
        500: 62, 600: 55, 700: 45, 800: 35, 900: 25, 950: 20
      }
    },
    // Gray (neutral, low chroma)
    gray: {
      hue: 250,
      chroma: 0.02,
      lightnessScale: {
        50: 96, 100: 90, 200: 85, 300: 78, 400: 70,
        500: 65, 600: 55, 700: 45, 800: 35, 900: 25, 950: 18
      }
    },
    // Success Green
    success: {
      hue: 145,
      chroma: 0.20,
      lightnessScale: {
        50: 95, 100: 90, 200: 85, 300: 78, 400: 70,
        500: 62, 600: 55, 700: 45, 800: 35, 900: 25, 950: 20
      }
    },
    // Warning Amber
    warning: {
      hue: 80,
      chroma: 0.16,
      lightnessScale: {
        50: 95, 100: 90, 200: 85, 300: 78, 400: 70,
        500: 72, 600: 60, 700: 50, 800: 40, 900: 30, 950: 25
      }
    },
    // Danger Red
    danger: {
      hue: 25,
      chroma: 0.22,
      lightnessScale: {
        50: 95, 100: 90, 200: 85, 300: 78, 400: 70,
        500: 62, 600: 55, 700: 45, 800: 35, 900: 25, 950: 20
      }
    },
    // Info Sky
    info: {
      hue: 220,
      chroma: 0.14,
      lightnessScale: {
        50: 95, 100: 90, 200: 85, 300: 78, 400: 70,
        500: 62, 600: 55, 700: 45, 800: 35, 900: 25, 950: 20
      }
    },
    // Extended palette
    extended: {
      blue: { hue: 250, chroma: 0.18 },
      green: { hue: 145, chroma: 0.20 },
      red: { hue: 25, chroma: 0.22 },
      yellow: { hue: 90, chroma: 0.18 },
      purple: { hue: 300, chroma: 0.22 },
      orange: { hue: 55, chroma: 0.18 },
      teal: { hue: 180, chroma: 0.16 },
      pink: { hue: 340, chroma: 0.18 }
    }
  },

  // ============================================================================
  // Color Configuration Maps - For programmatic utility generation
  // These maps drive the generation of color utilities in the framework
  // ============================================================================
  colorConfig: {
    // Color shades used for scale generation
    shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],

    // Color families for utility generation
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
      pink: 'pink'
    },

    // Background opacity values for color modifiers
    bgOpacityValues: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100],

    // Gradient color stops
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
      current: 'current'
    }
  },

  // ============================================================================
  // Typography - Font families, sizes, weights, spacing
  // ============================================================================
  typography: {
    fontFamily: {
      sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      serif: ['ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
      mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace']
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

  // ============================================================================
  // Filter Configuration
  // ============================================================================
  filterBlurValues: {
    0: '0',
    default: '8px',
    sm: '4px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '40px',
    '3xl': '64px'
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
    200: '2'
  },

  filterContrastValues: {
    0: '0',
    50: '0.5',
    75: '0.75',
    100: '1',
    125: '1.25',
    150: '1.5',
    200: '2'
  },

  filterGrayscaleValues: {
    0: '0',
    default: '100%'
  },

  filterHueRotateValues: {
    0: '0deg',
    15: '15deg',
    30: '30deg',
    60: '60deg',
    90: '90deg',
    180: '180deg'
  },

  filterInvertValues: {
    0: '0',
    default: '100%'
  },

  filterSaturateValues: {
    0: '0',
    50: '0.5',
    100: '1',
    150: '1.5',
    200: '2'
  },

  filterSepiaValues: {
    0: '0',
    default: '100%'
  },

  // ============================================================================
  // Divide Configuration
  // ============================================================================
  divideWidths: {
    0: '0px',
    1: '1px',
    2: '2px',
    4: '4px',
    8: '8px'
  },

  divideColors: {
    current: 'currentcolor',
    transparent: 'transparent',
    primary: 'var(--color-primary-500)',
    secondary: 'var(--color-secondary-500)',
    gray: 'var(--color-gray-500)'
  },

  divideStyles: {
    solid: 'solid',
    dashed: 'dashed',
    dotted: 'dotted',
    double: 'double',
    none: 'none'
  },

  dropShadowValues: {
    none: '0 0 #0000',
    default: '0 1px 2px 0 rgb(0 0 0 / 0.1)',
    sm: '0 1px 1px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)'
  },

  backdropOpacityValues: {
    0: '0',
    25: '0.25',
    50: '0.5',
    75: '0.75',
    100: '1'
  }
};

/**
 * Generate SCSS configuration from user config
 */
function generateSCSS(config) {
  const merged = mergeDeep(defaultConfig, config);

  return `// ============================================================================
// ApexCSS Configuration - Auto-generated by config-builder.js
// ============================================================================
// This file is automatically generated. Do not edit directly.
// Instead, modify your apex.config.js and run: npm run config:build
// ============================================================================

// ============================================================================
// Feature Toggles - Enable/disable utility categories
// Set to false to exclude specific utilities from the build
// ============================================================================
${generateFeatureToggles(merged.features)}

// ============================================================================
// Breakpoints - Responsive design breakpoints
// ============================================================================
${generateBreakpoints(merged.breakpoints)}

// ============================================================================
// Spacing Scale - Margin, padding, and gap values
// ============================================================================
${generateSpacing(merged.spacing)}

// ============================================================================
// Fractional Widths - Percentage-based width utilities
// ============================================================================
${generateFractionalWidths(merged.fractionalWidths)}

// ============================================================================
// Column Configuration - CSS Multi-Column Layout
// ============================================================================
${generateColumns(merged.columns)}

// ============================================================================
// Text Shadow Values
// ============================================================================
${generateTextShadow(merged.textShadow)}

// ============================================================================
// Blend Modes - CSS blend modes configuration
// ============================================================================
${generateBlendModes(merged.blendModes)}

// ============================================================================
// Filter Configuration
// ============================================================================
${generateFilterConfig(merged)}

// ============================================================================
// Ring Widths - Focus ring widths
// ============================================================================
${generateRingWidths(merged.ringWidths)}

// ============================================================================
// Ring Colors - Focus ring colors
// ============================================================================
${generateRingColors(merged.ringColors)}

// ============================================================================
// Ring Opacity - Focus ring opacity values
// ============================================================================
${generateRingOpacity(merged.ringOpacity)}

// ============================================================================
// Outline Widths - Focus outline widths
// ============================================================================
${generateOutlineWidths(merged.outlineWidths)}

// ============================================================================
// Outline Offsets
// ============================================================================
${generateOutlineOffsets(merged.outlineOffsets)}

// ============================================================================
// Colors - OKLCH Color Scales (Perceptually uniform color space)
// ============================================================================
${generateColors(merged.colors)}
${generateColorConfig(merged.colorConfig)}

// ============================================================================
// Typography - Font families, sizes, weights, and spacing
// ============================================================================
${generateTypography(merged.typography)}

// ============================================================================
// Border Radius - Corner roundness values
// ============================================================================
${generateBorderRadius(merged.borderRadius)}

// ============================================================================
// Shadows - Box shadow values
// ============================================================================
${generateShadows(merged.shadows)}

// ============================================================================
// Transitions - Animation timing functions and durations
// ============================================================================
${generateTransitions(merged.transition)}

// ============================================================================
// Z-Index - Stacking order values
// ============================================================================
${generateZIndex(merged.zIndex)}

// ============================================================================
// Opacity - Transparency values
// ============================================================================
${generateOpacity(merged.opacity)}

// ============================================================================
// Divide Configuration
// ============================================================================
${generateDivideConfig(merged)}

// ============================================================================
// End of ApexCSS Configuration
// ============================================================================
`;
}

/**
 * Generate feature toggle variables with categorization
 */
function generateFeatureToggles(features) {
  const categories = {
    'Core Layout': ['display', 'flexbox', 'grid', 'positioning', 'visibility'],
    'Core Spacing': ['spacing', 'sizing'],
    'Core Typography': ['typography'],
    'Core Visual': ['colors', 'backgrounds', 'borders', 'shadows', 'opacity', 'overflow', 'objectFit'],
    'Core Interaction': ['cursor', 'transitions'],
    'Extended Layout': ['flexExtended', 'gridExtended', 'float', 'containerQueries', 'isolation', 'placeItems', 'justifyItems', 'spaceBetween', 'columns', 'columnsExtended'],
    'Extended Typography': ['typographyExtended', 'fontExtended', 'letterSpacing', 'lineHeight', 'textAlignLast', 'textDecorationExtended', 'textJustify', 'textIndent', 'textShadow', 'textEmphasis', 'textOrientation', 'textUnderline', 'hangingPunctuation', 'hyphenate', 'initialLetter', 'tabSize', 'wordBreak', 'wordWrap', 'writingMode', 'unicodeBidi'],
    'Extended Visual': ['backgroundExtended', 'colorModifiers', 'blendModes', 'masks', 'borderRadiusLogical', 'ring', 'outline', 'appearance', 'accentColor', 'colorScheme'],
    'Extended Interaction': ['interaction', 'userSelect', 'willChange', 'all', 'caret', 'scroll', 'overscrollBehavior', 'overscrollBehaviorExtended', 'overflowExtended'],
    'Effects': ['animations', 'transforms', 'transforms3d', 'filters', 'aspectRatio', 'imageRendering', 'transitionBehavior'],
    'Content': ['list', 'listStyleExtended', 'table', 'counter', 'caption', 'quotes', 'orphans', 'widows', 'pageBreak', 'break', 'verticalAlign'],
    'Advanced': ['arbitrary', 'logicalProperties', 'sizingLogical', 'offset', 'shapeOutside', 'markerExtended', 'zoom', 'fieldSizing', 'svg', 'box', 'divide'],
    'State Variants': ['states', 'hover', 'focus', 'active', 'disabled'],
    'Theme Support': ['darkMode', 'rtl', 'accessibility', 'zIndex']
  };

  let output = [];

  for (const [category, keys] of Object.entries(categories)) {
    output.push(`// ${category}`);
    keys.forEach(key => {
      if (key in features) {
        const varName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        const comment = features[key] ? 'enabled' : 'disabled';
        output.push(`$enable-${varName}: ${features[key]} !default; // ${comment}`);
      }
    });
    output.push('');
  }

  return output.join('\n');
}

/**
 * Generate breakpoint variables and CSS custom properties
 */
function generateBreakpoints(breakpoints) {
  const lines = [];

  // Individual SCSS variables
  lines.push('// Individual breakpoint variables');
  Object.entries(breakpoints).forEach(([key, value]) => {
    lines.push(`$breakpoint-${key}: ${value} !default;`);
  });

  // SCSS map for iteration
  lines.push('');
  lines.push('// Breakpoints map for SCSS iteration');
  lines.push('$breakpoints: (');
  Object.entries(breakpoints).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    lines.push(`  "${key}": ${value}${comma}`);
  });
  lines.push(') !default;');

  // Breakpoint class name prefixes (for responsive utility class naming)
  lines.push('');
  lines.push('// Breakpoint prefixes for responsive class names');
  lines.push('$breakpoint-prefixes: (');
  Object.entries(breakpoints).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    // For 'xxl', use 'xxl' directly. For others, use the key as-is
    const prefix = key === 'xxl' ? 'xxl' : key;
    lines.push(`  "${key}": ${prefix}${comma}`);
  });
  lines.push(') !default;');

  // Alias for backwards compatibility with code that uses $breakpoint-class-names
  lines.push('');
  lines.push('// Alias for backwards compatibility');
  lines.push('$breakpoint-class-names: $breakpoint-prefixes !default;');

  return lines.join('\n');
}

/**
 * Generate spacing scale
 */
function generateSpacing(spacing) {
  const lines = [];

  lines.push('$spacing-scale: (');
  Object.entries(spacing).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    // Keep numeric keys unquoted for proper numeric comparisons in Sass
    lines.push(`  ${key}: ${value}${comma}`);
  });
  lines.push(') !default;');

  return lines.join('\n');
}

/**
 * Generate fractional widths configuration
 * Outputs a Sass map with enabled fractional width values
 */
function generateFractionalWidths(config) {
  const widths = [];

  if (config.halves) {
    widths.push('  "1\\\\/2": 50%');
  }

  if (config.thirds) {
    widths.push('  "1\\\\/3": 33.3333%');
    widths.push('  "2\\\\/3": 66.6667%');
  }

  if (config.quarters) {
    widths.push('  "1\\\\/4": 25%');
    widths.push('  "2\\\\/4": 50%');
    widths.push('  "3\\\\/4": 75%');
  }

  if (config.fifths) {
    widths.push('  "1\\\\/5": 20%');
    widths.push('  "2\\\\/5": 40%');
    widths.push('  "3\\\\/5": 60%');
    widths.push('  "4\\\\/5": 80%');
  }

  if (config.sixths) {
    widths.push('  "1\\\\/6": 16.6667%');
    widths.push('  "2\\\\/6": 33.3333%');
    widths.push('  "3\\\\/6": 50%');
    widths.push('  "4\\\\/6": 66.6667%');
    widths.push('  "5\\\\/6": 83.3333%');
  }

  if (config.twelfths) {
    widths.push('  "1\\\\/12": 8.3333%');
    widths.push('  "2\\\\/12": 16.6667%');
    widths.push('  "3\\\\/12": 25%');
    widths.push('  "4\\\\/12": 33.3333%');
    widths.push('  "5\\\\/12": 41.6667%');
    widths.push('  "6\\\\/12": 50%');
    widths.push('  "7\\\\/12": 58.3333%');
    widths.push('  "8\\\\/12": 66.6667%');
    widths.push('  "9\\\\/12": 75%');
    widths.push('  "10\\\\/12": 83.3333%');
    widths.push('  "11\\\\/12": 91.6667%');
  }

  const lines = ['$fractional-widths: ('];
  widths.forEach((line, index) => {
    const comma = index < widths.length - 1 ? ',' : '';
    lines.push(line + comma);
  });
  lines.push(') !default;');

  return lines.join('\n');
}

/**
 * Generate column configuration
 */
function generateColumns(columns) {
  const lines = [];

  // Column counts
  lines.push('$column-counts: (');
  columns.counts.forEach((count, index) => {
    const comma = index < columns.counts.length - 1 ? ',' : '';
    lines.push(`  ${count}${comma}`);
  });
  lines.push(') !default;');

  // Column widths
  lines.push('$column-widths: (');
  Object.entries(columns.widths).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    lines.push(`  "${key}": ${value}${comma}`);
  });
  lines.push(') !default;');

  // Column rule styles
  lines.push('$column-rule-styles: (');
  Object.entries(columns.ruleStyles).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    lines.push(`  "${key}": ${value}${comma}`);
  });
  lines.push(') !default;');

  // Column rule widths
  lines.push('$column-rule-widths: (');
  Object.entries(columns.ruleWidths).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    lines.push(`  "${key}": ${value}${comma}`);
  });
  lines.push(') !default;');

  return lines.join('\n');
}

/**
 * Generate text shadow values
 */
function generateTextShadow(textShadow) {
  const lines = ['$text-shadow-values: ('];
  Object.entries(textShadow).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    // Quote the value to prevent Sass from parsing rgb() / as division
    lines.push(`  "${key}": "${value}"${comma}`);
  });
  lines.push(') !default;');
  return lines.join('\n');
}

/**
 * Generate ring widths configuration
 */
function generateRingWidths(ringWidths) {
  const lines = ['$ring-widths: ('];
  Object.entries(ringWidths).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    lines.push(`  "${key}": ${value}${comma}`);
  });
  lines.push(') !default;');
  return lines.join('\n');
}

/**
 * Generate ring colors configuration
 */
function generateRingColors(ringColors) {
  const lines = ["$ring-colors: ("];
  Object.entries(ringColors).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? "," : "";
    lines.push(`  "${key}": ${value}${comma}`);
  });
  lines.push(") !default;");
  return lines.join("\n");
}

/**
 * Generate ring opacity configuration
 */
function generateRingOpacity(ringOpacity) {
  const lines = ["$ring-opacity-values: ("];
  Object.entries(ringOpacity).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? "," : "";
    lines.push(`  "${key}": ${value}${comma}`);
  });
  lines.push(") !default;");
  return lines.join("\n");
}

/**
 * Generate outline widths configuration
 */
function generateOutlineWidths(outlineWidths) {
  const lines = ["$outline-widths: ("];
  Object.entries(outlineWidths).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? "," : "";
    lines.push(`  "${key}": ${value}${comma}`);
  });
  lines.push(") !default;");
  return lines.join("\n");
}

/**
 * Generate outline offsets configuration
 */
function generateOutlineOffsets(outlineOffsets) {
  const lines = ["$outline-offsets: ("];
  Object.entries(outlineOffsets).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? "," : "";
    lines.push(`  "${key}": ${value}${comma}`);
  });
  lines.push(") !default;");
  return lines.join("\n");
}

/**
 * Generate blend modes configuration
 */
function generateBlendModes(blendModes) {
  const lines = ['$blend-modes: ('];
  Object.entries(blendModes).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    lines.push(`  "${key}": ${value}${comma}`);
  });
  lines.push(') !default;');
  return lines.join('\n');
}

/**
 * Generate divide configuration
 */
function generateDivideConfig(config) {
  const lines = [];

  // Divide widths
  lines.push('$divide-widths: (');
  Object.entries(config.divideWidths).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    lines.push(`  "${key}": ${value}${comma}`);
  });
  lines.push(') !default;');

  // Divide colors
  lines.push('$divide-colors: (');
  Object.entries(config.divideColors).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    lines.push(`  "${key}": ${value}${comma}`);
  });
  lines.push(') !default;');

  // Divide styles
  lines.push('$divide-styles: (');
  Object.entries(config.divideStyles).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    lines.push(`  "${key}": ${value}${comma}`);
  });
  lines.push(') !default;');

  return lines.join('\n');
}

/**
 * Generate filter configuration
 */
function generateFilterConfig(config) {
  const lines = [];

  // Filter blur values
  lines.push('$filter-blur-values: (');
  Object.entries(config.filterBlurValues).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    lines.push(`  "${key}": ${value}${comma}`);
  });
  lines.push(') !default;');

  // Filter brightness values
  lines.push('$filter-brightness-values: (');
  Object.entries(config.filterBrightnessValues).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    lines.push(`  "${key}": ${value}${comma}`);
  });
  lines.push(') !default;');

  // Filter contrast values
  lines.push('$filter-contrast-values: (');
  Object.entries(config.filterContrastValues).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    lines.push(`  "${key}": ${value}${comma}`);
  });
  lines.push(') !default;');

  // Filter grayscale values
  lines.push('$filter-grayscale-values: (');
  Object.entries(config.filterGrayscaleValues).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    lines.push(`  "${key}": ${value}${comma}`);
  });
  lines.push(') !default;');

  // Filter hue-rotate values
  lines.push('$filter-hue-rotate-values: (');
  Object.entries(config.filterHueRotateValues).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    lines.push(`  "${key}": ${value}${comma}`);
  });
  lines.push(') !default;');

  // Filter invert values
  lines.push('$filter-invert-values: (');
  Object.entries(config.filterInvertValues).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    lines.push(`  "${key}": ${value}${comma}`);
  });
  lines.push(') !default;');

  // Filter saturate values
  lines.push('$filter-saturate-values: (');
  Object.entries(config.filterSaturateValues).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    lines.push(`  "${key}": ${value}${comma}`);
  });
  lines.push(') !default;');

  // Filter sepia values
  lines.push('$filter-sepia-values: (');
  Object.entries(config.filterSepiaValues).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    lines.push(`  "${key}": ${value}${comma}`);
  });
  lines.push(') !default;');

  // Drop shadow values
  lines.push('$drop-shadow-values: (');
  Object.entries(config.dropShadowValues).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    lines.push(`  "${key}": "${value}"${comma}`);
  });
  lines.push(') !default;');

  // Backdrop opacity values
  lines.push('$backdrop-opacity-values: (');
  Object.entries(config.backdropOpacityValues).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    lines.push(`  "${key}": ${value}${comma}`);
  });
  lines.push(') !default;');

  return lines.join('\n');
}

/**
 * Generate OKLCH color variables from configuration
 * Colors are now defined with OKLCH format: { hue, chroma, lightnessScale }
 */
function generateColors(colors) {
  const lines = [];
  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const defaultLightnessScale = {
    50: 95, 100: 90, 200: 85, 300: 78, 400: 70,
    500: 62, 600: 55, 700: 45, 800: 35, 900: 25, 950: 20
  };

  // Primary colors
  if (colors.primary) {
    lines.push('// Primary Color Scale (OKLCH)');
    const { hue, chroma, lightnessScale } = colors.primary;
    shades.forEach(shade => {
      const lightness = lightnessScale[shade];
      lines.push(`$color-primary-${shade}: oklch(${lightness}% ${chroma} ${hue}deg) !default;`);
    });
  }

  // Gray scale
  if (colors.gray) {
    lines.push('');
    lines.push('// Gray Scale (OKLCH)');
    const { hue, chroma, lightnessScale } = colors.gray;
    shades.forEach(shade => {
      const lightness = lightnessScale[shade];
      lines.push(`$color-gray-${shade}: oklch(${lightness}% ${chroma} ${hue}deg) !default;`);
    });
  }

  // Semantic colors
  const semanticColors = ['success', 'warning', 'danger', 'info'];
  semanticColors.forEach(colorName => {
    if (colors[colorName]) {
      lines.push('');
      lines.push(`// ${colorName.charAt(0).toUpperCase() + colorName.slice(1)} Color Scale (OKLCH)`);
      const { hue, chroma, lightnessScale } = colors[colorName];
      shades.forEach(shade => {
        const lightness = lightnessScale[shade];
        lines.push(`$color-${colorName}-${shade}: oklch(${lightness}% ${chroma} ${hue}deg) !default;`);
      });
    }
  });

  // Extended color palette
  if (colors.extended) {
    lines.push('');
    lines.push('// Extended Color Palette (OKLCH)');
    Object.entries(colors.extended).forEach(([colorName, config]) => {
      const { hue, chroma } = config;
      shades.forEach(shade => {
        const lightness = defaultLightnessScale[shade];
        lines.push(`$color-${colorName}-${shade}: oklch(${lightness}% ${chroma} ${hue}deg) !default;`);
      });
    });
  }

  // Semantic aliases
  lines.push('');
  lines.push('// Semantic Color Aliases');
  lines.push('$color-primary: $color-primary-500 !default;');
  lines.push('$color-success: $color-success-500 !default;');
  lines.push('$color-warning: $color-warning-500 !default;');
  lines.push('$color-danger: $color-danger-500 !default;');
  lines.push('$color-info: $color-info-500 !default;');

  return lines.join('\n');
}

/**
 * Generate color configuration maps for utility generation
 */
function generateColorConfig(colorConfig) {
  const lines = [];

  // Color shades
  lines.push('');
  lines.push('// ============================================================================');
  lines.push('// Color Scale Maps (for programmatic utility generation)');
  lines.push('// ============================================================================');
  lines.push('');
  lines.push('// Color shades used for scale generation');
  lines.push(`$color-shades: (${colorConfig.shades.join(', ')}) !default;`);
  lines.push('');

  // Color families
  lines.push('// Color families for utility generation');
  lines.push('$color-families: (');
  Object.entries(colorConfig.families).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    lines.push(`  "${key}": "${value}"${comma}`);
  });
  lines.push(') !default;');
  lines.push('');

  // Background opacity values
  lines.push('// Background opacity values for color modifiers');
  lines.push(`$bg-opacity-values: (${colorConfig.bgOpacityValues.join(', ')}) !default;`);
  lines.push('');

  // Gradient colors
  lines.push('// Gradient color stops');
  lines.push('$gradient-colors: (');
  Object.entries(colorConfig.gradientColors).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    lines.push(`  "${key}": "${value}"${comma}`);
  });
  lines.push(') !default;');

  return lines.join('\n');
}

/**
 * Generate typography configuration
 */
function generateTypography(typography) {
  const lines = [];

  // Font families
  lines.push('// Font Families');
  lines.push('$font-families: (');
  Object.entries(typography.fontFamily).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    const fontList = Array.isArray(value) ? value.join(', ') : value;
    lines.push(`  "${key}": "${fontList}"${comma}`);
  });
  lines.push(') !default;');
  lines.push('');

  // Font sizes
  lines.push('// Font Sizes');
  lines.push('$font-sizes: (');
  Object.entries(typography.fontSize).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    const size = Array.isArray(value) ? value[0] : value;
    lines.push(`  "${key}": ${size}${comma}`);
  });
  lines.push(') !default;');
  lines.push('');

  // Font weights
  lines.push('// Font Weights');
  lines.push('$font-weights: (');
  const sassColorNames = new Set(['black', 'white', 'red', 'green', 'blue', 'gray', 'orange', 'purple', 'yellow', 'pink', 'brown', 'cyan', 'magenta', 'navy', 'olive', 'silver', 'teal', 'maroon', 'aqua', 'fuchsia', 'lime']);
  Object.entries(typography.fontWeight).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    const safeKey = sassColorNames.has(key) ? `"${key}"` : key;
    lines.push(`  ${safeKey}: ${value}${comma}`);
  });
  lines.push(') !default;');
  lines.push('');

  // Letter spacing
  lines.push('// Letter Spacing');
  lines.push('$letter-spacing: (');
  Object.entries(typography.letterSpacing).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    lines.push(`  "${key}": ${value}${comma}`);
  });
  lines.push(') !default;');
  lines.push('');

  // Line heights
  lines.push('// Line Heights');
  lines.push('$line-heights: (');
  Object.entries(typography.lineHeight).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    lines.push(`  "${key}": ${value}${comma}`);
  });
  lines.push(') !default;');

  return lines.join('\n');
}

/**
 * Generate border radius scale
 */
function generateBorderRadius(borderRadius) {
  const lines = [];

  lines.push('$border-radius-scale: (');
  Object.entries(borderRadius).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    lines.push(`  "${key}": ${value}${comma}`);
  });
  lines.push(') !default;');

  return lines.join('\n');
}

/**
 * Generate shadow variables
 */
function generateShadows(shadows) {
  const lines = [];

  lines.push('$shadows: (');
  Object.entries(shadows).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    const needsQuotes = value.includes(',');
    lines.push(`  "${key}": ${needsQuotes ? `"${value}"` : value}${comma}`);
  });
  lines.push(') !default;');

  return lines.join('\n');
}

/**
 * Generate transition configuration
 */
function generateTransitions(transition) {
  const lines = [];

  // Durations
  lines.push('// Transition Durations');
  lines.push('$transition-duration: (');
  Object.entries(transition.duration).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    lines.push(`  "${key}": ${value}${comma}`);
  });
  lines.push(') !default;');
  lines.push('');

  // Timing functions
  lines.push('// Transition Timing Functions');
  lines.push('$transition-timing: (');
  Object.entries(transition.timing).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    lines.push(`  "${key}": ${value}${comma}`);
  });
  lines.push(') !default;');

  return lines.join('\n');
}

/**
 * Generate z-index scale
 */
function generateZIndex(zIndex) {
  const lines = [];

  lines.push('$z-index: (');
  Object.entries(zIndex).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    lines.push(`  "${key}": ${value}${comma}`);
  });
  lines.push(') !default;');

  return lines.join('\n');
}

/**
 * Generate opacity scale
 */
function generateOpacity(opacity) {
  const lines = [];

  lines.push('$opacity-scale: (');
  Object.entries(opacity).forEach(([key, value], index, arr) => {
    const comma = index < arr.length - 1 ? ',' : '';
    // Keep numeric keys unquoted for proper numeric comparisons in Sass
    lines.push(`  ${key}: ${value}${comma}`);
  });
  lines.push(') !default;');

  return lines.join('\n');
}

/**
 * Generate a complete sample config file
 */
function generateSampleConfig() {
  // Generate the features section from defaultConfig
  const featureCategories = {
    'Core Layout': ['display', 'flexbox', 'grid', 'positioning', 'visibility'],
    'Core Spacing': ['spacing', 'sizing'],
    'Core Typography': ['typography'],
    'Core Visual': ['colors', 'backgrounds', 'borders', 'shadows', 'opacity', 'overflow', 'objectFit'],
    'Core Interaction': ['cursor', 'transitions'],
    'Extended Layout': ['flexExtended', 'gridExtended', 'float', 'containerQueries', 'isolation', 'placeItems', 'justifyItems', 'spaceBetween', 'columns', 'columnsExtended'],
    'Extended Typography': ['typographyExtended', 'fontExtended', 'letterSpacing', 'lineHeight', 'textAlignLast', 'textDecorationExtended', 'textJustify', 'textIndent', 'textShadow', 'textEmphasis', 'textOrientation', 'textUnderline', 'hangingPunctuation', 'hyphenate', 'initialLetter', 'tabSize', 'wordBreak', 'wordWrap', 'writingMode', 'unicodeBidi'],
    'Extended Visual': ['backgroundExtended', 'colorModifiers', 'blendModes', 'masks', 'borderRadiusLogical', 'ring', 'outline', 'appearance', 'accentColor', 'colorScheme'],
    'Extended Interaction': ['interaction', 'userSelect', 'willChange', 'all', 'caret', 'scroll', 'overscrollBehavior', 'overscrollBehaviorExtended', 'overflowExtended'],
    'Effects': ['animations', 'transforms', 'transforms3d', 'filters', 'aspectRatio', 'imageRendering', 'transitionBehavior'],
    'Content': ['list', 'listStyleExtended', 'table', 'counter', 'caption', 'quotes', 'orphans', 'widows', 'pageBreak', 'break', 'verticalAlign'],
    'Advanced': ['arbitrary', 'logicalProperties', 'sizingLogical', 'offset', 'shapeOutside', 'markerExtended', 'zoom', 'fieldSizing', 'svg', 'box', 'divide'],
    'State Variants': ['states', 'hover', 'focus', 'active', 'disabled'],
    'Theme Support': ['darkMode', 'rtl', 'accessibility', 'zIndex']
  };

  let featuresSection = '';
  for (const [category, keys] of Object.entries(featureCategories)) {
    featuresSection += `    // ${category}\n`;
    keys.forEach(key => {
      if (key in defaultConfig.features) {
        featuresSection += `    ${key}: true,\n`;
      }
    });
    featuresSection += '\n';
  }

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

/**
 * Deep merge two objects
 */
function mergeDeep(target, source) {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

function getType(value) {
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
 * Unknown keys are warnings to keep customization flexible, but type mismatches
 * are treated as hard errors so generated SCSS remains valid.
 */
function validateUserConfig(userConfig, defaults = defaultConfig, currentPath = '') {
  const errors = [];
  const warnings = [];

  if (!isObject(userConfig)) {
    if (userConfig === undefined || userConfig === null) {
      return { errors, warnings };
    }

    errors.push(`Configuration root must be an object, received ${getType(userConfig)}.`);
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
      errors.push(
        `Invalid type for \`${pathKey}\`: expected ${expectedType}, received ${actualType}.`
      );
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
          `Invalid feature toggle \`features.${featureKey}\`: expected boolean, received ${getType(featureValue)}.`
        );
      }
    });
  }

  return { errors, warnings };
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    config: 'src/apex.config.js',
    output: 'src/config',
    watch: false,
    init: false
  };

  args.forEach(arg => {
    if (arg.startsWith('--config=')) {
      options.config = arg.split('=')[1];
    } else if (arg.startsWith('--output=')) {
      options.output = arg.split('=')[1];
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

function showHelp() {
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
 * Users can directly edit src/config/_custom-config.scss instead
 */
async function loadConfig(configPath) {
  const fullPath = path.resolve(process.cwd(), configPath);

  try {
    await fs.access(fullPath);
    const module = await import(fullPath + '?t=' + Date.now());
    const loaded = module.default || module;

    if (!isObject(loaded)) {
      throw new Error(`Expected exported config object but received ${getType(loaded)}.`);
    }

    return loaded;
  } catch (err) {
    if (err?.code === 'ENOENT') {
      logInfo(`Config file not found at ${configPath}; using defaults.`);
      return {};
    }

    throw new Error(`Failed to load config file ${configPath}: ${err.message}`);
  }
}

/**
 * Main build function
 */
async function build(options) {
  try {
    // Load user config
    const userConfig = await loadConfig(options.config);
    const validation = validateUserConfig(userConfig);

    validation.warnings.forEach(logWarn);

    if (validation.errors.length > 0) {
      const details = validation.errors.map(error => `- ${error}`).join('\n');
      throw new Error(`Configuration validation failed:\n${details}`);
    }

    const mergedConfig = mergeDeep(defaultConfig, userConfig);

    // Generate SCSS
    const scss = generateSCSS(userConfig);

    // Ensure output directory exists
    await fs.mkdir(options.output, { recursive: true });

    // Write SCSS file
    const scssPath = path.join(options.output, '_custom-config.scss');
    await fs.writeFile(scssPath, scss);
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
    logError(`Build failed: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Initialize config file
 */
async function init() {
  const configPath = path.resolve(process.cwd(), 'src/apex.config.js');

  const sample = generateSampleConfig();
  await fs.writeFile(configPath, sample);
  console.log('✅ Created: src/apex.config.js\\n');
  console.log('   Edit this file to customize ApexCSS, then run:');
  console.log('   npm run config:build\\n');
}

/**
 * Watch for changes
 */
async function watch(options) {
  const configPath = path.resolve(process.cwd(), options.config);

  logInfo(`Watching ${options.config} for changes...`);
  console.log('');

  // Initial build
  await build(options);

  // Watch for changes
  const { watchFile } = await import('fs');
  watchFile(configPath, async (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
      console.log(`📝 Config changed, rebuilding...\\n`);
      await build(options);
    }
  });
}

// Main execution
async function main() {
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

function isDirectExecution() {
  if (!process.argv[1]) {
    return false;
  }

  return path.resolve(process.argv[1]) === __filename;
}

if (isDirectExecution()) {
  main();
}

export {
  build,
  defaultConfig,
  generateSCSS,
  isObject,
  mergeDeep,
  validateUserConfig
};
