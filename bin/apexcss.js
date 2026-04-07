#!/usr/bin/env node

/**
 * ApexCSS CLI
 *
 * Usage:
 *   apexcss init              Initialize configuration
 *   apexcss build             Build custom CSS
 *   apexcss watch             Watch for changes
 *   apexcss doctor            Check system setup
 *
 * Options:
 *   -c, --config <path>       Config file path (default: ./apex.config.js)
 *   -o, --output <dir>        Output directory (default: ./src/apexcss/)
 *   --minify                  Minify output CSS
 *   --sourcemap               Generate source maps
 *   -v, --version             Show version
 *   -h, --help                Show help
 */

import { cli } from '../cli/index.js';

cli(process.argv);
