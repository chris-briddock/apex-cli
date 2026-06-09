/**
 * ApexCSS CLI - TypeScript Type Definitions
 *
 * Provides first-class TypeScript support for configuration files
 * and programmatic API usage.
 */

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Feature toggle configuration
 * Set any feature to `false` to disable it and reduce bundle size.
 */
export interface FeatureToggles {
  // Core Layout
  display?: boolean;
  flexbox?: boolean;
  grid?: boolean;
  positioning?: boolean;
  visibility?: boolean;

  // Core Spacing
  spacing?: boolean;
  sizing?: boolean;

  // Core Typography
  typography?: boolean;

  // Core Visual
  colors?: boolean;
  backgrounds?: boolean;
  borders?: boolean;
  shadows?: boolean;
  opacity?: boolean;
  overflow?: boolean;
  objectFit?: boolean;

  // Core Interaction
  cursor?: boolean;
  transitions?: boolean;

  // Extended Layout
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

  // Extended Typography
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

  // Extended Visual
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

  // Extended Interaction
  interaction?: boolean;
  userSelect?: boolean;
  willChange?: boolean;
  all?: boolean;
  caret?: boolean;
  scroll?: boolean;
  overscrollBehavior?: boolean;
  overscrollBehaviorExtended?: boolean;
  overflowExtended?: boolean;

  // Effects
  animations?: boolean;
  transforms?: boolean;
  transforms3d?: boolean;
  filters?: boolean;
  aspectRatio?: boolean;
  imageRendering?: boolean;
  transitionBehavior?: boolean;

  // Content
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

  // Advanced
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

  // State Variants
  states?: boolean;
  hover?: boolean;
  focus?: boolean;
  active?: boolean;
  disabled?: boolean;

  // Theme Support
  darkMode?: boolean;
  rtl?: boolean;
  accessibility?: boolean;
  zIndex?: boolean;
}

/**
 * Breakpoint configuration
 */
export interface Breakpoints {
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  xxl?: string;
  xxxl?: string;
  ultra?: string;
}

/**
 * Spacing scale configuration
 */
export interface SpacingScale {
  [key: string]: string;
}

/**
 * OKLCH color configuration
 */
export interface ColorConfig {
  hue: number;
  chroma: number;
  lightnessScale?: Record<number, number>;
}

/**
 * Colors configuration
 */
export interface ColorsConfig {
  primary?: ColorConfig;
  gray?: ColorConfig;
  success?: ColorConfig;
  warning?: ColorConfig;
  danger?: ColorConfig;
  info?: ColorConfig;
  extended?: Record<string, Pick<ColorConfig, 'hue' | 'chroma'>>;
}

/**
 * Typography configuration
 */
export interface TypographyConfig {
  fontFamily?: Record<string, string[]>;
  fontSize?: Record<string, string | [string, { lineHeight: string }]>;
  fontWeight?: Record<string, string>;
  letterSpacing?: Record<string, string>;
  lineHeight?: Record<string, string>;
}

/**
 * Shadow values configuration
 */
export interface ShadowsConfig {
  [key: string]: string;
}

/**
 * Transition configuration
 */
export interface TransitionConfig {
  duration?: Record<string, string>;
  timing?: Record<string, string>;
}

/**
 * Z-index configuration
 */
export interface ZIndexConfig {
  [key: string]: string;
}

/**
 * Opacity configuration
 */
export interface OpacityConfig {
  [key: string]: string;
}

/**
 * Border radius configuration
 */
export interface BorderRadiusConfig {
  [key: string]: string;
}

/**
 * Complete ApexCSS configuration object
 */
export interface ApexConfig {
  features?: FeatureToggles;
  breakpoints?: Breakpoints;
  spacing?: SpacingScale;
  colors?: ColorsConfig;
  typography?: TypographyConfig;
  shadows?: ShadowsConfig;
  transition?: TransitionConfig;
  zIndex?: ZIndexConfig;
  opacity?: OpacityConfig;
  borderRadius?: BorderRadiusConfig;
}

// ============================================================================
// CLI Option Types
// ============================================================================

/**
 * Global CLI options available on all commands
 */
export interface GlobalOptions {
  /** Path to config file (default: ./apex.config.js) */
  config?: string;
  /** Output directory (default: node_modules/apexcss/dist) */
  output?: string;
  /** Minify output CSS */
  minify?: boolean;
  /** Generate source maps */
  sourcemap?: boolean;
  /** Show verbose output */
  verbose?: boolean;
  /** Suppress non-error output */
  quiet?: boolean;
}

/**
 * Options for the `init` command
 */
export interface InitOptions extends GlobalOptions {
  /** Specify framework explicitly */
  framework?: string;
  /** Skip adding imports to entry files */
  import?: boolean;
}

/**
 * Options for the `build` command
 */
export interface BuildOptions extends GlobalOptions {
  /** Output format (css, scss, both) */
  format?: string;
  /** Build specific layers (base, utilities, themes, all) */
  layer?: string;
}

/**
 * Options for the `watch` command
 */
export interface WatchOptions extends GlobalOptions {
  // Inherits all global options
}

/**
 * Options for the `purge` command
 */
export interface PurgeOptions extends GlobalOptions {
  /** Comma-separated source directories to scan */
  src?: string;
  /** Show changes without applying them */
  dryRun?: boolean;
  /** Skip confirmation and apply changes automatically */
  yes?: boolean;
  /** Create backup before modifying config */
  backup?: boolean;
  /** Show detailed class usage statistics */
  verbose?: boolean;
}

/**
 * Options for the `doctor` command
 */
export interface DoctorOptions {
  // No specific options
}

// ============================================================================
// Framework Detection Types
// ============================================================================

/**
 * Detected framework information
 */
export interface FrameworkInfo {
  /** Framework identifier */
  id: string;
  /** Human-readable framework name */
  name: string;
  /** Whether a framework was detected */
  detected: boolean;
  /** Whether a package.json was found */
  hasPackageJson: boolean;
  /** Detected entry file path */
  entryFile?: string;
  /** Parsed package.json contents */
  packageJson?: Record<string, unknown>;
  /** Whether package.json parsing failed */
  parseError?: boolean;
}

// ============================================================================
// Logger Types
// ============================================================================

/**
 * Log level for controlling output verbosity
 */
export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'verbose' | 'debug';

/**
 * Logger interface
 */
export interface Logger {
  /** Set the current log level */
  setLevel(level: LogLevel): void;
  /** Get the current log level */
  getLevel(): LogLevel;
  /** Info message */
  info(message: string): void;
  /** Success message */
  success(message: string): void;
  /** Warning message */
  warn(message: string): void;
  /** Error message */
  error(message: string): void;
  /** Debug message (only shown with DEBUG env var or verbose level) */
  debug(message: string): void;
  /** New line */
  newline(): void;
  /** Section header */
  header(title: string): void;
  /** List items */
  list(items: string[]): void;
  /** Format file path */
  path(filepath: string): string;
  /** Format command */
  cmd(command: string): string;
}

// ============================================================================
// Purge / Analysis Types
// ============================================================================

/**
 * Feature usage analysis result
 */
export interface FeatureUsageAnalysis {
  /** Total number of relevant features */
  totalFeatures: number;
  /** Features detected in the codebase */
  usedFeatures: string[];
  /** Features not detected in the codebase */
  unusedFeatures: string[];
  /** Unused features that are currently enabled */
  enabledUnused: string[];
  /** Unused features that are already disabled */
  alreadyDisabled: string[];
  /** Estimated KB saved by disabling enabled unused features */
  potentialSavings: number;
}

/**
 * Class usage statistics
 */
export interface ClassStatistics {
  /** Total unique classes */
  total: number;
  /** Classes with modifiers (hover:, dark:, etc.) */
  withModifiers: number;
  /** Dark mode variant classes */
  darkMode: number;
  /** Hover variant classes */
  hover: number;
  /** Focus variant classes */
  focus: number;
  /** Responsive variant classes */
  responsive: number;
  /** Most used prefixes with counts */
  topPrefixes: Array<[string, number]>;
}

// ============================================================================
// Config Validation Types
// ============================================================================

/**
 * Config validation result
 */
export interface ValidationResult {
  /** Whether the config is valid */
  valid: boolean;
  /** Array of error messages */
  errors: string[];
  /** Array of warning messages */
  warnings: string[];
}

// ============================================================================
// Plugin System Types (Future)
// ============================================================================

/**
 * Plugin hook context
 */
export interface PluginContext {
  /** Current working directory */
  cwd: string;
  /** Resolved configuration */
  config: ApexConfig;
  /** Build options */
  options: BuildOptions;
  /** Logger instance */
  logger: Logger;
}

/**
 * ApexCSS plugin interface
 */
export interface ApexPlugin {
  /** Plugin name */
  name: string;
  /** Hook called before build starts */
  preBuild?(context: PluginContext): Promise<void> | void;
  /** Hook called after CSS is compiled */
  postBuild?(context: PluginContext, css: string): Promise<string> | string;
  /** Hook called before CSS is written to disk */
  preWrite?(context: PluginContext, css: string): Promise<string> | string;
  /** Hook called after CSS is written to disk */
  postWrite?(context: PluginContext, outputPath: string): Promise<void> | void;
}

// ============================================================================
// Main CLI Entry Point
// ============================================================================

/**
 * Main CLI entry point
 * @param args - Command line arguments (typically `process.argv`)
 */
export function cli(args: string[]): void;

/**
 * Build command - Generate custom CSS from configuration
 * @param options - Build command options
 */
export function buildCommand(options: BuildOptions): Promise<void>;

/**
 * Init command - Initialize ApexCSS configuration in your project
 * @param options - Init command options
 */
export function initCommand(options: InitOptions): Promise<void>;

/**
 * Watch command - Watch for config changes and rebuild automatically
 * @param options - Watch command options
 */
export function watchCommand(options: WatchOptions): Promise<void>;

/**
 * Doctor command - Check system setup and diagnose issues
 */
export function doctorCommand(): Promise<void>;

/**
 * Purge command - Analyze project and optimize ApexCSS configuration
 * @param options - Purge command options
 */
export function purgeCommand(options: PurgeOptions): Promise<void>;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Load and validate configuration from file
 * @param configPath - Path to config file
 * @returns Merged configuration object
 */
export function loadConfig(configPath: string): ApexConfig;

/**
 * Detect the framework being used in the current project
 * @param cwd - Current working directory (default: process.cwd())
 * @returns Detected framework info
 */
export function detectFramework(cwd?: string): FrameworkInfo;

/**
 * Logger instance for consistent CLI output
 */
export const logger: Logger;

// ============================================================================
// Default Export
// ============================================================================

declare const _default: {
  cli: typeof cli;
  buildCommand: typeof buildCommand;
  initCommand: typeof initCommand;
  watchCommand: typeof watchCommand;
  doctorCommand: typeof doctorCommand;
  purgeCommand: typeof purgeCommand;
  loadConfig: typeof loadConfig;
  detectFramework: typeof detectFramework;
  logger: typeof logger;
};

export default _default;
