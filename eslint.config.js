/**
 * ESLint configuration
 * Uses the new flat config format (ESLint v9+)
 */
import js from '@eslint/js';
import globals from 'globals';
import jsdoc from 'eslint-plugin-jsdoc';

export default [
  // Base ESLint recommended rules
  js.configs.recommended,

  // JSDoc plugin for validating JSDoc comments
  jsdoc.configs['flat/recommended'],

  {
    // Global configuration
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021
      }
    },

    plugins: {
      jsdoc
    },

    rules: {
      // Error prevention
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off', // CLI tool needs console output
      'no-process-exit': 'off', // CLI tool needs process.exit

      // Best practices
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',

      // Code style
      'indent': ['error', 2],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'never'],
      'max-len': ['warn', { code: 120, ignoreComments: true, ignoreStrings: true }],

      // JSDoc validation
      'jsdoc/require-description': 'warn',
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-returns-description': 'off',
      'jsdoc/require-example': 'off',
      'jsdoc/require-hyphen-before-param-description': 'off'
    }
  },

  {
    // Override for test files
    files: ['tests/**/*.test.js'],
    rules: {
      'no-undef': 'off' // Test runner provides describe, it, etc.
    }
  },

  {
    // Ignore patterns
    ignores: [
      'node_modules/**',
      'coverage/**',
      'dist/**',
      'cli/utils/config-builder.js' // Large generated file
    ]
  }
];
