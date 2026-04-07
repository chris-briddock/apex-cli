# @apexcss/cli

ApexCSS CLI - Build and customize your CSS framework

## Installation

```bash
npm install -g @apexcss/cli
# or
npx @apexcss/cli <command>
```

## Usage

```bash
# Initialize configuration
apexcss init

# Build complete CSS
apexcss build

# Build specific layers
apexcss build --layer base
apexcss build --layer utilities
apexcss build --layer themes
apexcss build --layer base,themes

# Watch for changes
apexcss watch

# Run diagnostics
apexcss doctor
```

## Options

- `-c, --config <path>` - Config file path (default: ./apex.config.js)
- `-o, --output <dir>` - Output directory (default: ./dist/)
- `-l, --layer <layers>` - Build specific layers (base, utilities, themes, all)
- `--minify` - Minify output CSS
- `--sourcemap` - Generate source maps
- `--format <format>` - Output format (css, scss, both)

## Peer Dependencies

This CLI requires `apexcss` to be installed in your project:

```bash
npm install apexcss
```

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

## Configuration

Create an `apex.config.js` file in your project root:

```javascript
export default {
  features: {
    display: true,
    flexbox: true,
    grid: true,
    // ... other features
  },
  breakpoints: {
    sm: '320px',
    md: '768px',
    lg: '1024px',
    xl: '1280px'
  },
  colors: {
    primary: {
      hue: 250,
      chroma: 0.2,
      lightnessScale: {
        50: 96, 100: 90, 200: 85, 300: 78, 400: 70,
        500: 65, 600: 55, 700: 45, 800: 35, 900: 25, 950: 18
      }
    }
  }
};
```

## License

MIT
