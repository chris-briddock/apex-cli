# @apexcss/cli

ApexCSS CLI - A powerful build tool for with automatic framework detection and seamless integration.

## What is ApexCSS CLI?

ApexCSS CLI helps you build and customize your own CSS utility framework. It provides:

- **Automatic Framework Detection** - Detects your project setup (React, Vue, Next.js, etc.) and configures accordingly
- **Layered CSS Generation** - Build only what you need (base, utilities, themes)
- **Watch Mode** - Automatically rebuild on configuration changes
- **Smart Configuration** - TypeScript/JavaScript config files with validation
- **Framework Integration** - Automatically adds CSS imports to your framework's entry file

## Installation

```bash
npm install -g @apexcss/cli
# or use without installing
npx @apexcss/cli <command>
```

## Quick Start

```bash
# 1. Initialize with automatic framework detection
apexcss init

# 2. Build your CSS
apexcss build

# 3. During development, watch for changes
apexcss watch
```

## Automatic Framework Detection

ApexCSS CLI automatically detects your project framework and configures the integration:

| Framework | Detection Method | Auto-Import |
|-----------|-----------------|-------------|
| Next.js | `next` in dependencies | ✅ Added to globals.css |
| React | `react` in dependencies | ✅ Added to main entry file |
| Vue | `vue` in dependencies | ✅ Added to main.ts/js |
| Angular | `@angular/core` in dependencies | ✅ Added to styles.css |
| Svelte | `svelte` in dependencies | ✅ Added to main entry file |
| Astro | `astro` in dependencies | ✅ Added to Layout.astro |
| Nuxt | `nuxt` in dependencies | ✅ Instructions for nuxt.config.ts |
| Vanilla | Default fallback | ✅ Added to main.js/ts |

Run `apexcss doctor` to see what was detected in your project.

## Usage

### Initialize Configuration

```bash
# Interactive mode with prompts
apexcss init

# Skip interactive prompts
apexcss init --interactive=false

# Specify framework explicitly
apexcss init --framework=react

# Custom output directory
apexcss init --output=./src/styles
```

### Build CSS

```bash
# Build complete CSS (base + utilities + themes)
apexcss build

# Build specific layers only
apexcss build --layer base
apexcss build --layer utilities
apexcss build --layer themes
apexcss build --layer base,themes

# Production build with minification
apexcss build --minify

# Generate source maps
apexcss build --sourcemap

# Output as SCSS instead of CSS
apexcss build --format=scss
```

### Watch Mode

```bash
# Watch config file for changes and auto-rebuild
apexcss watch

# Watch with custom config path
apexcss watch --config=./custom.config.js
```

### Diagnostics

```bash
# Run system diagnostics
apexcss doctor
```

## CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `-c, --config <path>` | Config file path | `./apex.config.js` |
| `-o, --output <dir>` | Output directory | `./dist/` |
| `-l, --layer <layers>` | Build specific layers | `all` |
| `--minify` | Minify output CSS | `false` |
| `--sourcemap` | Generate source maps | `false` |
| `--format <format>` | Output format | `css` |
| `--framework` | Specify framework | `auto-detect` |
| `--interactive` | Interactive prompts | `true` |
| `--import` | Add imports to entry files | `true` |

## Configuration

Create an `apex.config.js` file in your project root:

```javascript
export default {
  // Feature toggles - enable/disable utility categories
  features: {
    display: true,
    flexbox: true,
    grid: true,
    positioning: true,
    visibility: true,
    spacing: true,
    typography: true,
    colors: true,
    backgrounds: true,
    borders: true,
    shadows: true,
    opacity: true,
    transitions: true,
    transforms: true,
    animations: true
  },

  // Breakpoints
  breakpoints: {
    sm: '320px',
    md: '768px',
    lg: '1024px',
    xl: '1280px'
  },

  // Custom colors using OKLCH color space
  colors: {
    primary: {
      hue: 250,
      chroma: 0.2,
      lightnessScale: {
        50: 96, 100: 90, 200: 85, 300: 78, 400: 70,
        500: 65, 600: 55, 700: 45, 800: 35, 900: 25, 950: 18
      }
    },
    secondary: {
      hue: 180,
      chroma: 0.15,
      lightnessScale: {
        50: 96, 100: 90, 200: 85, 300: 78, 400: 70,
        500: 65, 600: 55, 700: 45, 800: 35, 900: 25, 950: 18
      }
    }
  },

  // Spacing scale
  spacing: {
    '0': '0px',
    '1': '0.25rem',
    '2': '0.5rem',
    '4': '1rem',
    '8': '2rem',
    '16': '4rem'
  }
};
```

## Peer Dependencies

This CLI requires `apexcss` to be installed in your project:

```bash
npm install apexcss
```

Optional peer dependencies:
- `vite` - For building CSS (recommended)
- `sass` - For SCSS support

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/chris-briddock/apex-cli.git
cd apex-cli

# Install dependencies
npm install
```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage (LCOV report)
npm run test:coverage

# View coverage as text in terminal
npm run test:coverage:text

# Generate HTML coverage report
npm run test:coverage:html
# Then open coverage/index.html in your browser

# Run tests in watch mode
npm run test:watch

# Run unit tests only
npm run test:unit
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Fix auto-fixable linting issues
npm run lint:fix
```

### Coverage Summary

Current test coverage:

| Module | Statements | Branches | Functions | Lines |
|--------|-----------|----------|-----------|-------|
| cli/utils/config-loader.js | 99% | 95% | 100% | 99% |
| cli/utils/logger.js | 100% | 100% | 100% | 100% |
| cli/utils/framework-detector.js | 95% | 94% | 100% | 95% |
| cli/commands/doctor.js | 82% | 79% | 100% | 82% |
| cli/commands/watch.js | 67% | 100% | 83% | 67% |
| cli/commands/build.js | 54% | 100% | 67% | 54% |
| cli/commands/init.js | 41% | 96% | 50% | 41% |

**Total: 76% statements, 92% branches, 86% functions**

## How It Works

1. **Initialization** (`apexcss init`):
   - Detects your project framework from package.json
   - Creates a starter config file (apex.config.js)
   - Optionally adds CSS import to your framework's entry file
   - Sets up .gitignore for output directory

2. **Build Process** (`apexcss build`):
   - Reads your configuration
   - Generates SCSS based on enabled features
   - Uses Vite to compile CSS (if available)
   - Outputs minified CSS (with optional source maps)

3. **Watch Mode** (`apexcss watch`):
   - Monitors your config file for changes
   - Automatically rebuilds on change
   - Handles concurrent changes gracefully

## License

MIT
