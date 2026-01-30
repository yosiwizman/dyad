/**
 * Bundle Utilities
 *
 * Creates a tarball/zip of an app directory for publishing.
 * Handles exclusion of development files and computes SHA256 hash.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { pipeline } from "node:stream/promises";
import archiver from "archiver";
import log from "electron-log";
import type { BundleInfo } from "../../lib/broker/types";

const logger = log.scope("bundle-utils");

// --- Exclusion Patterns ---

/**
 * Directories to always exclude from the bundle
 */
export const EXCLUDED_DIRECTORIES = [
  "node_modules",
  ".git",
  ".svn",
  ".hg",
  "dist",
  "build",
  "out",
  ".next",
  ".vercel",
  ".netlify",
  ".cache",
  ".turbo",
  ".parcel-cache",
  "coverage",
  ".nyc_output",
  "__pycache__",
  ".pytest_cache",
  "venv",
  ".venv",
  "vendor",
  ".idea",
  ".vscode",
  ".fleet",
  ".vs",
];

/**
 * File patterns to exclude from the bundle
 */
export const EXCLUDED_FILE_PATTERNS = [
  // Environment and secrets
  /^\.env.*$/,
  /^\.secret.*$/,
  /.*\.key$/,
  /.*\.pem$/,
  /.*\.p12$/,
  /.*\.pfx$/,

  // OS junk
  /^\.DS_Store$/,
  /^Thumbs\.db$/,
  /^desktop\.ini$/,
  /^\._.*$/,

  // Editor files
  /.*\.swp$/,
  /.*\.swo$/,
  /.*~$/,
  /^\.#.*$/,

  // Lock files (will be regenerated)
  /^package-lock\.json$/,
  /^pnpm-lock\.yaml$/,
  /^yarn\.lock$/,
  /^bun\.lockb$/,

  // Logs
  /.*\.log$/,
  /^npm-debug\.log.*$/,
  /^yarn-debug\.log.*$/,
  /^yarn-error\.log.*$/,

  // Other
  /^\.npmrc$/,
  /^\.yarnrc.*$/,
];

// --- Bundle Creation ---

export interface CreateBundleOptions {
  /** Source directory to bundle */
  sourceDir: string;
  /** Output path for the bundle file */
  outputPath: string;
  /** Optional progress callback */
  onProgress?: (progress: BundleProgress) => void;
}

export interface BundleProgress {
  phase: "scanning" | "archiving" | "hashing" | "complete";
  filesProcessed: number;
  totalFiles: number;
  currentFile?: string;
}

/**
 * Check if a path should be excluded from the bundle
 */
export function shouldExclude(
  relativePath: string,
  isDirectory: boolean,
): boolean {
  const basename = path.basename(relativePath);
  // Split by both forward and backward slashes for cross-platform support
  const parts = relativePath.split(/[\\/]/);

  // Check if any parent directory is excluded
  for (const part of parts) {
    if (EXCLUDED_DIRECTORIES.includes(part)) {
      return true;
    }
  }

  // Check directory exclusions
  if (isDirectory && EXCLUDED_DIRECTORIES.includes(basename)) {
    return true;
  }

  // Check file pattern exclusions
  if (!isDirectory) {
    for (const pattern of EXCLUDED_FILE_PATTERNS) {
      if (pattern.test(basename)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Recursively scan a directory and return list of files to include
 */
async function scanDirectory(
  dir: string,
  baseDir: string,
): Promise<{ relativePath: string; fullPath: string }[]> {
  const results: { relativePath: string; fullPath: string }[] = [];

  const entries = await fs.promises.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (shouldExclude(relativePath, entry.isDirectory())) {
      continue;
    }

    if (entry.isDirectory()) {
      const subResults = await scanDirectory(fullPath, baseDir);
      results.push(...subResults);
    } else if (entry.isFile()) {
      results.push({ relativePath, fullPath });
    }
  }

  return results;
}

/**
 * Create a bundle (zip archive) of the app directory
 *
 * @param options - Bundle creation options
 * @returns Bundle info including hash and size
 */
export async function createBundle(
  options: CreateBundleOptions,
): Promise<BundleInfo> {
  const { sourceDir, outputPath, onProgress } = options;

  logger.info(`Creating bundle from ${sourceDir} to ${outputPath}`);

  // Phase 1: Scan directory
  onProgress?.({
    phase: "scanning",
    filesProcessed: 0,
    totalFiles: 0,
  });

  const files = await scanDirectory(sourceDir, sourceDir);
  logger.info(`Found ${files.length} files to bundle`);

  // Phase 2: Create archive
  onProgress?.({
    phase: "archiving",
    filesProcessed: 0,
    totalFiles: files.length,
  });

  // Ensure output directory exists
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

  const output = fs.createWriteStream(outputPath);
  const archive = archiver("zip", {
    zlib: { level: 9 }, // Maximum compression
  });

  let filesProcessed = 0;

  archive.on("entry", (entry) => {
    filesProcessed++;
    onProgress?.({
      phase: "archiving",
      filesProcessed,
      totalFiles: files.length,
      currentFile: entry.name,
    });
  });

  archive.pipe(output);

  // Add files to archive
  for (const { relativePath, fullPath } of files) {
    archive.file(fullPath, { name: relativePath });
  }

  await archive.finalize();

  // Wait for output stream to finish
  await new Promise<void>((resolve, reject) => {
    output.on("close", resolve);
    output.on("error", reject);
  });

  // Phase 3: Compute hash
  onProgress?.({
    phase: "hashing",
    filesProcessed: files.length,
    totalFiles: files.length,
  });

  const hash = await computeFileHash(outputPath);
  const stat = await fs.promises.stat(outputPath);

  const bundleInfo: BundleInfo = {
    hash,
    size: stat.size,
    fileCount: files.length,
    path: outputPath,
  };

  logger.info(
    `Bundle created: ${bundleInfo.fileCount} files, ${bundleInfo.size} bytes, hash=${bundleInfo.hash.slice(0, 16)}...`,
  );

  onProgress?.({
    phase: "complete",
    filesProcessed: files.length,
    totalFiles: files.length,
  });

  return bundleInfo;
}

/**
 * Compute SHA256 hash of a file
 */
export async function computeFileHash(filePath: string): Promise<string> {
  const hash = crypto.createHash("sha256");
  const stream = fs.createReadStream(filePath);

  await pipeline(stream, hash);

  return hash.digest("hex");
}

/**
 * Clean up a bundle file
 */
export async function cleanupBundle(bundlePath: string): Promise<void> {
  try {
    await fs.promises.unlink(bundlePath);
    logger.info(`Cleaned up bundle: ${bundlePath}`);
  } catch (error) {
    // Ignore if file doesn't exist
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      logger.warn(`Failed to cleanup bundle: ${bundlePath}`, error);
    }
  }
}
