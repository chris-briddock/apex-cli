/**
 * CSS Tree Shaker Utility
 * Removes unused CSS rules based on classes found in source files
 * Works as a post-processor after Sass compilation
 */

import { readFile, writeFile } from 'node:fs/promises';
import { scanDirectories } from './purge-analyzer.ts';

interface MediaQuery {
  start: number;
  end: number;
  condition: string;
  content: string;
}

interface CSSRule {
  selector: string;
  declarations: string;
  media?: string;
}

interface TreeShakeStats {
  originalSize: number;
  newSize: number;
  reduction: number;
  reductionPercent: string;
}

/**
 * Normalizes a class name by unescaping colons
 */
function normalizeClassName(className: string): string {
  return className.replaceAll(String.raw`\:`, ':');
}

/**
 * Extract media queries from CSS
 */
function extractMediaQueries(css: string): MediaQuery[] {
  const mediaQueries: MediaQuery[] = [];
  const mediaQueryPattern = /@media[^{]+\{/;
  let remainingCss = css;
  let offset = 0;

  let mediaMatch = mediaQueryPattern.exec(remainingCss);
  while (mediaMatch !== null) {
    const mediaStart = offset + mediaMatch.index;
    const mediaCondition = mediaMatch[0].slice(0, -1).trim();

    // Find the matching closing brace for this media query
    let braceCount = 1;
    let pos = mediaMatch.index + mediaMatch[0].length;

    while (braceCount > 0 && pos < remainingCss.length) {
      if (remainingCss[pos] === '{') braceCount++;
      if (remainingCss[pos] === '}') braceCount--;
      pos++;
    }

    const mediaEnd = offset + pos;
    const mediaContent = remainingCss.slice(mediaMatch.index + mediaMatch[0].length, pos - 1);

    mediaQueries.push({
      start: mediaStart,
      end: mediaEnd,
      condition: mediaCondition,
      content: mediaContent
    });

    // Update offset and remaining CSS
    offset = mediaEnd;
    remainingCss = css.slice(offset);

    // Find next media query
    mediaMatch = mediaQueryPattern.exec(remainingCss);
  }

  return mediaQueries;
}

/**
 * Parse CSS rules from a chunk of CSS
 */
function parseRulesFromChunk(cssChunk: string, media?: string): CSSRule[] {
  const rules: CSSRule[] = [];
  const rulePattern = /([^{]+)\{([^}]+)\}/;
  let remaining = cssChunk;

  let ruleMatch: RegExpExecArray | null;
  while ((ruleMatch = rulePattern.exec(remaining)) !== null) {
    const selector = ruleMatch[1].trim();
    const declarations = ruleMatch[2].trim();

    if (!selector.startsWith('@')) {
      const rule: CSSRule = { selector, declarations };
      if (media) {
        rule.media = media;
      }
      rules.push(rule);
    }

    remaining = remaining.slice(ruleMatch.index + ruleMatch[0].length);
  }

  return rules;
}

/**
 * Parse CSS into structured rules
 */
export function parseCSS(css: string): CSSRule[] {
  const rules: CSSRule[] = [];
  const mediaQueries = extractMediaQueries(css);

  // Parse regular rules from CSS before the first media query
  let lastEnd = 0;
  for (const mq of mediaQueries) {
    // Parse rules from lastEnd to mq.start
    const cssChunk = css.slice(lastEnd, mq.start);
    rules.push(...parseRulesFromChunk(cssChunk));

    // Parse rules inside this media query
    rules.push(...parseRulesFromChunk(mq.content, mq.condition));

    lastEnd = mq.end;
  }

  // Parse remaining CSS after last media query
  const remainingCSS = css.slice(lastEnd);
  rules.push(...parseRulesFromChunk(remainingCSS));

  return rules;
}

/**
 * Extract class selectors from a CSS selector
 */
export function extractClassesFromSelector(selector: string): string[] {
  // Match class names including those with escaped colons (sm\:flex)
  const classPattern = /\.((?:[a-zA-Z_-][a-zA-Z0-9_-]*|\\:)+)/;
  const classes: string[] = [];
  let remaining = selector;

  let match: RegExpExecArray | null;
  while ((match = classPattern.exec(remaining)) !== null) {
    // Normalize the class name (unescape colons)
    const className = normalizeClassName(match[1]);
    classes.push(className);
    remaining = remaining.slice(match.index + match[0].length);
  }

  return classes;
}

/**
 * Check if a selector should be kept based on used classes
 */
export function shouldKeepSelector(selector: string, usedClasses: Set<string>): boolean {
  // Trim the selector
  const trimmedSelector = selector.trim();

  // Always keep these selectors
  const alwaysKeep = [
    /^\*/, // Universal selector
    /:root/, // Root variables
    /\bhtml\b/, // HTML element
    /\bbody\b/, // Body element
    /^\[/, // Attribute selectors (like [hidden])
    /^::/, // Pseudo-elements (::before, ::after)
    /:where\(/, // :where() pseudo-class
    /:is\(/, // :is() pseudo-class
    /^@/, // At-rules
    /^from\b/, // @keyframes from
    /^to\b/, // @keyframes to
    /^\d+%/ // @keyframes percentage
  ];

  for (const pattern of alwaysKeep) {
    if (pattern.test(trimmedSelector)) {
      return true;
    }
  }

  // Extract class names from selector
  const selectorClasses = extractClassesFromSelector(selector);

  // If no classes in selector, check if it's an element selector we should keep
  if (selectorClasses.length === 0) {
    // Keep basic element selectors (h1, p, etc.) but not complex ones
    const isSimpleElement = /^[a-zA-Z][a-zA-Z0-9]*$/.test(trimmedSelector);
    if (isSimpleElement) {
      return true;
    }
  }

  // Check if any class in the selector is used
  return selectorClasses.some(cls => {
    // Check exact match
    if (usedClasses.has(cls)) {
      return true;
    }

    // Check without responsive prefix (e.g., 'sm:flex' -> 'flex')
    const withoutPrefix = cls.replace(/^(sm|md|lg|xl|2xl):/, '');
    if (usedClasses.has(withoutPrefix)) {
      return true;
    }

    // Check for partial matches (e.g., 'text-gray-900' matches if 'text-gray' is used)
    const baseClass = cls.split('-').slice(0, 2).join('-');
    if (usedClasses.has(baseClass)) {
      return true;
    }

    // Check for hover variants - if base class is used, keep hover variant
    const baseWithoutPseudo = cls.split(':').pop();
    if (baseWithoutPseudo && usedClasses.has(baseWithoutPseudo)) {
      return true;
    }

    return false;
  });
}

/**
 * Tree-shake CSS by removing unused rules
 */
export function treeShakeCSS(css: string, usedClasses: Set<string>): string {
  const rules = parseCSS(css);
  const keptRules: CSSRule[] = [];
  const mediaRules = new Map<string, CSSRule[]>();

  for (const rule of rules) {
    if (shouldKeepSelector(rule.selector, usedClasses)) {
      if (rule.media) {
        // Group by media query
        if (!mediaRules.has(rule.media)) {
          mediaRules.set(rule.media, []);
        }
        mediaRules.get(rule.media)!.push(rule);
      } else {
        keptRules.push(rule);
      }
    }
  }

  // Build output CSS
  const output: string[] = [];

  // Add regular rules
  for (const rule of keptRules) {
    const formattedDeclarations = rule.declarations
      .split(';')
      .filter(d => d.trim())
      .map(d => `  ${d.trim()};`)
      .join('\n');
    output.push(`${rule.selector} {\n${formattedDeclarations}\n}`);
  }

  // Add media query rules
  for (const [media, mediaQueryRules] of mediaRules) {
    const mediaContent: string[] = [];
    for (const rule of mediaQueryRules) {
      const formattedDeclarations = rule.declarations
        .split(';')
        .filter(d => d.trim())
        .map(d => `    ${d.trim()};`)
        .join('\n');
      mediaContent.push(`  ${rule.selector} {\n${formattedDeclarations}\n  }`);
    }
    output.push(`${media} {\n${mediaContent.join('\n\n')}\n}`);
  }

  return output.join('\n\n');
}

/**
 * Get used classes from source directories
 */
export async function getUsedClasses(directories: string[]): Promise<Set<string>> {
  const allClasses = new Set<string>();

  for (const dir of directories) {
    const result = await scanDirectories([dir]);
    for (const cls of result.classes) {
      allClasses.add(cls);
    }
  }

  return allClasses;
}

/**
 * Tree-shake a CSS file
 */
export async function treeShakeFile(inputPath: string, outputPath: string, usedClasses: Set<string>): Promise<TreeShakeStats> {
  const css = await readFile(inputPath, 'utf-8');
  const originalSize = Buffer.byteLength(css, 'utf8');

  const treeShaken = treeShakeCSS(css, usedClasses);
  await writeFile(outputPath, treeShaken, 'utf-8');

  const newSize = Buffer.byteLength(treeShaken, 'utf8');
  const reduction = originalSize - newSize;

  return {
    originalSize,
    newSize,
    reduction,
    reductionPercent: ((reduction / originalSize) * 100).toFixed(1)
  };
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
