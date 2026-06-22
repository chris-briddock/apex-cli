/**
 * Build Cache Utility
 * Content-hash based caching for Sass compilation results.
 * Cache is stored in .apexcss-cache/ relative to the project root.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const CACHE_DIR_NAME = '.apexcss-cache';
const CACHE_INDEX_FILE = 'index.json';

interface CacheEntry {
  key: string;
  files: Record<string, string>; // outputFile → content hash of the file
  timestamp: number;
}

interface CacheIndex {
  version: number;
  entries: Record<string, CacheEntry>;
}

const CACHE_VERSION = 1;

/**
 * Get the cache directory path.
 */
export function getCacheDir(cwd = process.cwd()): string {
  return resolve(cwd, CACHE_DIR_NAME);
}

/**
 * Ensure the cache directory exists.
 */
function ensureCacheDir(cacheDir: string): void {
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }
}

/**
 * Load the cache index from disk.
 */
function loadIndex(cacheDir: string): CacheIndex {
  const indexPath = join(cacheDir, CACHE_INDEX_FILE);
  if (!existsSync(indexPath)) {
    return { version: CACHE_VERSION, entries: {} };
  }
  try {
    const raw = readFileSync(indexPath, 'utf-8');
    const parsed = JSON.parse(raw) as CacheIndex;
    if (parsed.version !== CACHE_VERSION) {
      return { version: CACHE_VERSION, entries: {} };
    }
    return parsed;
  } catch {
    return { version: CACHE_VERSION, entries: {} };
  }
}

/**
 * Save the cache index to disk.
 */
function saveIndex(cacheDir: string, index: CacheIndex): void {
  ensureCacheDir(cacheDir);
  writeFileSync(join(cacheDir, CACHE_INDEX_FILE), JSON.stringify(index, null, 2), 'utf-8');
}

/**
 * Hash a string using SHA-256.
 */
function hashString(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Hash a file's content. Returns empty string if file cannot be read.
 */
function hashFile(filePath: string): string {
  try {
    return hashString(readFileSync(filePath, 'utf-8'));
  } catch {
    return '';
  }
}

/**
 * Hash all SCSS files in a directory recursively.
 */
async function hashDirectory(dirPath: string): Promise<string> {
  const hashes: string[] = [];

  async function walk(dir: string): Promise<void> {
    if (!existsSync(dir)) return;
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.scss') || entry.name.endsWith('.css'))) {
          hashes.push(`${fullPath}:${hashFile(fullPath)}`);
        }
      }
    } catch {
      // Skip inaccessible directories
    }
  }

  await walk(dirPath);
  return hashString(hashes.join('\n'));
}

interface CacheKeyOptions {
  configPath: string;
  sourceDir: string;
  layers: string[];
  minify?: boolean;
  sourcemap?: boolean;
}

/**
 * Compute a cache key from the build inputs.
 */
export async function computeCacheKey(options: CacheKeyOptions): Promise<string> {
  const configHash = hashFile(options.configPath);
  const sourceHash = await hashDirectory(options.sourceDir);

  const keyContent = [
    configHash,
    sourceHash,
    options.layers.sort().join(','),
    options.minify ? '1' : '0',
    options.sourcemap ? '1' : '0'
  ].join(':');

  return hashString(keyContent);
}

/**
 * Check if a cache entry is still valid by comparing output file mtimes
 * against the cache timestamp.
 */
async function isCacheEntryFresh(entry: CacheEntry, outputDir: string): Promise<boolean> {
  for (const outputFile of Object.keys(entry.files)) {
    const fullPath = join(outputDir, outputFile);
    if (!existsSync(fullPath)) return false;
    try {
      const s = await stat(fullPath);
      if (s.mtimeMs < entry.timestamp) return false;
    } catch {
      return false;
    }
  }
  return true;
}

/**
 * Look up a cache entry by key. Returns the entry if it's a hit, null otherwise.
 */
export async function cacheGet(cacheKey: string, outputDir: string, cwd = process.cwd()): Promise<CacheEntry | null> {
  const cacheDir = getCacheDir(cwd);
  const index = loadIndex(cacheDir);
  const entry = index.entries[cacheKey];
  if (!entry) return null;
  if (entry.key !== cacheKey) return null;
  const fresh = await isCacheEntryFresh(entry, outputDir);
  return fresh ? entry : null;
}

/**
 * Store a cache entry after a successful build.
 * Records which output files were produced and their content hashes.
 */
export function cacheSet(cacheKey: string, outputFiles: string[], outputDir: string, cwd = process.cwd()): void {
  const cacheDir = getCacheDir(cwd);
  ensureCacheDir(cacheDir);

  const files: Record<string, string> = {};
  for (const file of outputFiles) {
    const fullPath = join(outputDir, file);
    files[file] = hashFile(fullPath);
  }

  const index = loadIndex(cacheDir);
  index.entries[cacheKey] = {
    key: cacheKey,
    files,
    timestamp: Date.now()
  };

  saveIndex(cacheDir, index);
}

/**
 * Invalidate a specific cache entry.
 */
export function cacheInvalidate(cacheKey: string, cwd = process.cwd()): void {
  const cacheDir = getCacheDir(cwd);
  const index = loadIndex(cacheDir);
  delete index.entries[cacheKey];
  saveIndex(cacheDir, index);
}

/**
 * Clear the entire cache.
 */
export function cacheClear(cwd = process.cwd()): void {
  const cacheDir = getCacheDir(cwd);
  const index: CacheIndex = { version: CACHE_VERSION, entries: {} };
  saveIndex(cacheDir, index);
}
