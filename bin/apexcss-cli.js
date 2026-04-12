#!/usr/bin/env node

/**
 * ApexCSS CLI
 *
 * Usage:
 *   apexcss-cli init              Initialize configuration
 *   apexcss-cli build             Build custom CSS
 *   apexcss-cli watch             Watch for changes
 *   apexcss-cli doctor            Check system setup
 *
 * Options:
 *   -c, --config <path>       Config file path (default: ./apex.config.js)
 *   -o, --output <dir>        Output directory (default: node_modules/apexcss/dist)
 *   --minify                  Minify output CSS
 *   --sourcemap               Generate source maps
 *   -v, --version             Show version
 *   -h, --help                Show help
 */

import { cli } from '../cli/index.js';

cli(process.argv);
