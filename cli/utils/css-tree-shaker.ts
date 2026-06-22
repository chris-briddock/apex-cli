/**
 * CSS Tree Shaker Utility
 * Removes unused CSS rules based on classes found in source files
 * Works as a post-processor after Sass compilation
 */

import { readFile, writeFile } from 'node:fs/promises';
import { scanDirectories } from './purge-analyzer.ts';

interface AtRuleBlock {
  start: number;
  end: number;
  keyword: string;
  condition: string;
  content: string;
  raw: string;
}

interface CSSRule {
  selector: string;
  declarations: string;
  atRule?: AtRuleBlock;
  /** Convenience alias: condition string of the parent @media / @layer / @supports block. */
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
 * Extract at-rule blocks (@media, @layer, @supports) from CSS.
 * Correctly handles nested braces.
 */
function extractAtRuleBlocks(css: string): AtRuleBlock[] {
  const blocks: AtRuleBlock[] = [];
  // Match any at-rule that opens a block: @media ..., @layer ..., @supports ...
  const atRuleStart = /@(media|layer|supports|keyframes|font-face)[^{]*\{/g;
  let match: RegExpExecArray | null;

  while ((match = atRuleStart.exec(css)) !== null) {
    const keyword = match[1];
    const blockStart = match.index;
    const conditionRaw = match[0].slice(0, -1).trim(); // e.g. "@media (min-width: 640px)"
    const condition = conditionRaw;

    // Walk forward to find the matching closing brace
    let depth = 1;
    let pos = match.index + match[0].length;

    while (pos < css.length && depth > 0) {
      if (css[pos] === '{') depth++;
      else if (css[pos] === '}') depth--;
      pos++;
    }

    const blockEnd = pos;
    const innerContent = css.slice(match.index + match[0].length, pos - 1);

    blocks.push({
      start: blockStart,
      end: blockEnd,
      keyword,
      condition,
      content: innerContent,
      raw: css.slice(blockStart, blockEnd)
    });
  }

  return blocks;
}

/**
 * Parse CSS rules from a chunk of CSS (no nested at-rules).
 * Handles multi-selector rules and declarations that may contain braces (e.g. calc).
 */
function parseRulesFromChunk(cssChunk: string, atRule?: AtRuleBlock): CSSRule[] {
  const rules: CSSRule[] = [];
  let pos = 0;
  const len = cssChunk.length;

  while (pos < len) {
    // Skip whitespace
    while (pos < len && /\s/.test(cssChunk[pos])) pos++;
    if (pos >= len) break;

    // Skip at-rules inside the chunk (nested @keyframes etc.)
    if (cssChunk[pos] === '@') {
      // find the next { and skip the block
      const braceIdx = cssChunk.indexOf('{', pos);
      if (braceIdx === -1) break;
      let depth = 1;
      let i = braceIdx + 1;
      while (i < len && depth > 0) {
        if (cssChunk[i] === '{') depth++;
        else if (cssChunk[i] === '}') depth--;
        i++;
      }
      pos = i;
      continue;
    }

    // Find the opening brace
    const braceIdx = cssChunk.indexOf('{', pos);
    if (braceIdx === -1) break;

    const selector = cssChunk.slice(pos, braceIdx).trim();

    // Find the matching closing brace (track depth for calc() etc.)
    let depth = 1;
    let i = braceIdx + 1;
    while (i < len && depth > 0) {
      if (cssChunk[i] === '{') depth++;
      else if (cssChunk[i] === '}') depth--;
      i++;
    }

    const declarations = cssChunk.slice(braceIdx + 1, i - 1).trim();

    if (selector && !selector.startsWith('@')) {
      const rule: CSSRule = { selector, declarations };
      if (atRule) {
        rule.atRule = atRule;
        rule.media = atRule.condition;
      }
      rules.push(rule);
    }

    pos = i;
  }

  return rules;
}

/**
 * Parse CSS into structured rules.
 * At-rule blocks (@media, @layer, @supports) are extracted first;
 * their contents are parsed and tagged with the parent block.
 * Everything outside at-rule blocks is parsed as regular rules.
 */
export function parseCSS(css: string): CSSRule[] {
  const rules: CSSRule[] = [];
  const atRuleBlocks = extractAtRuleBlocks(css);

  // Sort blocks by start position
  atRuleBlocks.sort((a, b) => a.start - b.start);

  let lastEnd = 0;

  for (const block of atRuleBlocks) {
    // Parse regular rules before this block
    if (block.start > lastEnd) {
      const chunk = css.slice(lastEnd, block.start);
      rules.push(...parseRulesFromChunk(chunk));
    }

    // For @keyframes / @font-face, keep as-is (do not try to tree-shake inside)
    if (block.keyword === 'keyframes' || block.keyword === 'font-face') {
      // Represent as a single "rule" with a special selector so shouldKeepSelector always keeps it
      rules.push({ selector: `@${block.keyword}`, declarations: block.content, atRule: block });
    } else {
      // Parse inner rules for @media, @layer, @supports
      rules.push(...parseRulesFromChunk(block.content, block));
    }

    lastEnd = block.end;
  }

  // Parse remaining CSS after last block
  if (lastEnd < css.length) {
    rules.push(...parseRulesFromChunk(css.slice(lastEnd)));
  }

  return rules;
}

/**
 * Extract class selectors from a CSS selector string.
 * Handles multi-selector rules (comma-separated) and escaped colons.
 */
export function extractClassesFromSelector(selector: string): string[] {
  // Match class names including those with escaped colons (sm\:flex) and slashes (1\/2)
  const classPattern = /\.((?:[a-zA-Z0-9_-]|\\[:/[\].])+)/g;
  const classes: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = classPattern.exec(selector)) !== null) {
    classes.push(normalizeClassName(match[1]));
  }

  return classes;
}

/**
 * Check if a selector should be kept based on used classes.
 */
export function shouldKeepSelector(selector: string, usedClasses: Set<string>): boolean {
  const trimmed = selector.trim();

  // Always keep these selector types
  const alwaysKeepPatterns = [
    /^\*/, // Universal selector
    /:root/, // CSS variables
    /\bhtml\b/,
    /\bbody\b/,
    /^\[/, // Attribute selectors
    /^::/, // Pseudo-elements
    /:where\(/,
    /:is\(/,
    /^@/, // At-rules (keyframes, font-face)
    /^from\b/,
    /^to\b/,
    /^\d+%/
  ];

  for (const pattern of alwaysKeepPatterns) {
    if (pattern.test(trimmed)) return true;
  }

  // Multi-selector: keep if ANY sub-selector matches
  const subSelectors = trimmed.split(',').map(s => s.trim());
  return subSelectors.some(sub => isSubSelectorUsed(sub, usedClasses));
}

function isSubSelectorUsed(selector: string, usedClasses: Set<string>): boolean {
  const classes = extractClassesFromSelector(selector);

  if (classes.length === 0) {
    // No classes — keep simple element selectors (h1, p, a, etc.)
    return /^[a-zA-Z][a-zA-Z0-9]*$/.test(selector.trim());
  }

  return classes.some(cls => {
    if (usedClasses.has(cls)) return true;

    // Strip responsive prefix: sm:flex → flex
    const withoutResponsive = cls.replace(/^(?:sm|md|lg|xl|2xl):/, '');
    if (usedClasses.has(withoutResponsive)) return true;

    // Strip any pseudo-class suffix: hover:flex → flex
    const withoutPseudo = cls.split(':').pop();
    if (withoutPseudo && usedClasses.has(withoutPseudo)) return true;

    // Partial prefix match: text-gray-900 kept if text-gray is in use
    const twoPartBase = cls.split('-').slice(0, 2).join('-');
    if (twoPartBase && usedClasses.has(twoPartBase)) return true;

    return false;
  });
}

/**
 * Tree-shake CSS by removing unused rules.
 * Preserves @layer / @media / @supports wrappers even if partially pruned.
 * Empty wrappers are dropped entirely.
 */
export function treeShakeCSS(css: string, usedClasses: Set<string>): string {
  const rules = parseCSS(css);

  // Group rules by their at-rule block (using start position as key, or null for top-level)
  const topLevelRules: CSSRule[] = [];
  const atRuleGroups = new Map<string, { block: AtRuleBlock; rules: CSSRule[] }>();

  for (const rule of rules) {
    if (!rule.atRule) {
      topLevelRules.push(rule);
    } else {
      const key = `${rule.atRule.start}`;
      if (!atRuleGroups.has(key)) {
        atRuleGroups.set(key, { block: rule.atRule, rules: [] });
      }
      atRuleGroups.get(key)?.rules.push(rule);
    }
  }

  const output: string[] = [];

  // Emit top-level rules
  for (const rule of topLevelRules) {
    if (shouldKeepSelector(rule.selector, usedClasses)) {
      output.push(formatRule(rule.selector, rule.declarations, ''));
    }
  }

  // Emit at-rule groups
  for (const [, group] of atRuleGroups) {
    const { block, rules: groupRules } = group;

    // @keyframes / @font-face: keep as-is if any rule matches
    if (block.keyword === 'keyframes' || block.keyword === 'font-face') {
      output.push(block.raw);
      continue;
    }

    // Filter kept rules within the block
    const kept = groupRules.filter(r => shouldKeepSelector(r.selector, usedClasses));
    if (kept.length === 0) continue;

    // Rebuild the at-rule block with only kept rules
    const innerLines = kept.map(r => formatRule(r.selector, r.declarations, '  '));
    output.push(`${block.condition} {\n${innerLines.join('\n\n')}\n}`);
  }

  return output.join('\n\n');
}

function formatRule(selector: string, declarations: string, indent: string): string {
  const formattedDecls = declarations
    .split(';')
    .map(d => d.trim())
    .filter(d => d.length > 0)
    .map(d => `${indent}  ${d};`)
    .join('\n');
  return `${indent}${selector} {\n${formattedDecls}\n${indent}}`;
}

/**
 * Get used classes from source directories.
 */
export async function getUsedClasses(directories: string[]): Promise<Set<string>> {
  const result = await scanDirectories(directories);
  return result.classes;
}

/**
 * Tree-shake a CSS file and write the result.
 */
export async function treeShakeFile(
  inputPath: string,
  outputPath: string,
  usedClasses: Set<string>
): Promise<TreeShakeStats> {
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
    reductionPercent: originalSize > 0 ? ((reduction / originalSize) * 100).toFixed(1) : '0.0'
  };
}

/**
 * Format bytes to human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
