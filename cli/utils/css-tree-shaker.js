/**
 * CSS Tree Shaker Utility
 * Removes unused CSS rules based on classes found in source files
 * Works as a post-processor after Sass compilation
 */

import { readFile, writeFile } from 'node:fs/promises';
import { scanDirectories } from './purge-analyzer.js';

/**
 * Normalizes a class name by unescaping colons
 * @param {string} className - Class name to normalize
 * @returns {string} Normalized class name
 */
function normalizeClassName(className) {
  return className.replaceAll(String.raw`\:`, ':');
}

/**
 * Extract media queries from CSS
 * @param {string} css - CSS content
 * @returns {Array<{start: number, end: number, condition: string, content: string}>} Media queries
 */
function extractMediaQueries(css) {
  const mediaQueries = [];
  const mediaQueryPattern = /@media[^{]+\{/;
  let remainingCss = css;
  let offset = 0;

  let mediaMatch;
  while ((mediaMatch = mediaQueryPattern.exec(remainingCss)) !== null) {
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
  }

  return mediaQueries;
}

/**
 * Parse CSS rules from a chunk of CSS
 * @param {string} cssChunk - CSS content to parse
 * @param {string} [media] - Optional media query condition
 * @returns {Array<{selector: string, declarations: string, media?: string}>} Parsed rules
 */
function parseRulesFromChunk(cssChunk, media) {
  const rules = [];
  const rulePattern = /([^{]+)\{([^}]+)\}/;
  let remaining = cssChunk;

  let ruleMatch;
  while ((ruleMatch = rulePattern.exec(remaining)) !== null) {
    const selector = ruleMatch[1].trim();
    const declarations = ruleMatch[2].trim();

    if (!selector.startsWith('@')) {
      const rule = { selector, declarations };
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
 * @param {string} css - CSS content
 * @returns {Array<{selector: string, declarations: string, media?: string}>} Parsed rules
 */
export function parseCSS(css) {
  const rules = [];
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
 * @param {string} selector - CSS selector
 * @returns {string[]} Array of class names
 */
export function extractClassesFromSelector(selector) {
  // Match class names including those with escaped colons (sm\:flex)
  const classPattern = /\.((?:[a-zA-Z_-][a-zA-Z0-9_-]*|\\:)+)/;
  const classes = [];
  let remaining = selector;

  let match;
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
 * @param {string} selector - CSS selector
 * @param {Set<string>} usedClasses - Set of classes used in the codebase
 * @returns {boolean} Whether to keep the rule
 */
export function shouldKeepSelector(selector, usedClasses) {
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
    /^\d+%/, // @keyframes percentage
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
    if (usedClasses.has(baseWithoutPseudo)) {
      return true;
    }

    return false;
  });
}

/**
 * Tree-shake CSS by removing unused rules
 * @param {string} css - Original CSS content
 * @param {Set<string>} usedClasses - Set of classes used in the codebase
 * @returns {string} Tree-shaken CSS
 */
export function treeShakeCSS(css, usedClasses) {
  const rules = parseCSS(css);
  const keptRules = [];
  const mediaRules = new Map();

  for (const rule of rules) {
    if (shouldKeepSelector(rule.selector, usedClasses)) {
      if (rule.media) {
        // Group by media query
        if (!mediaRules.has(rule.media)) {
          mediaRules.set(rule.media, []);
        }
        mediaRules.get(rule.media).push(rule);
      } else {
        keptRules.push(rule);
      }
    }
  }

  // Build output CSS
  const output = [];

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
    const mediaContent = [];
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
 * @param {string[]} directories - Directories to scan
 * @returns {Promise<Set<string>>} Set of used class names
 */
export async function getUsedClasses(directories) {
  const allClasses = new Set();

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
 * @param {string} inputPath - Path to input CSS file
 * @param {string} outputPath - Path to output CSS file
 * @param {Set<string>} usedClasses - Set of used classes
 * @returns {Promise<{originalSize: number, newSize: number, reduction: number}>} Size stats
 */
export async function treeShakeFile(inputPath, outputPath, usedClasses) {
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
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
export function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
