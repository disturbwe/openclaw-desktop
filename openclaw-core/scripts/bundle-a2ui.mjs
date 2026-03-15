#!/usr/bin/env node
/**
 * Cross-platform A2UI bundler (replaces bundle-a2ui.sh for Windows support)
 */

import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const HASH_FILE = path.join(ROOT_DIR, 'src/canvas-host/a2ui/.bundle.hash');
const OUTPUT_FILE = path.join(ROOT_DIR, 'src/canvas-host/a2ui/a2ui.bundle.js');
const A2UI_RENDERER_DIR = path.join(ROOT_DIR, 'vendor/a2ui/renderers/lit');
const A2UI_APP_DIR = path.join(ROOT_DIR, 'apps/shared/OpenClawKit/Tools/CanvasA2UI');

function normalize(p) {
  return p.split(path.sep).join('/');
}

async function walk(entryPath, files = []) {
  const st = await fs.stat(entryPath);
  if (st.isDirectory()) {
    const entries = await fs.readdir(entryPath);
    for (const entry of entries) {
      await walk(path.join(entryPath, entry), files);
    }
  } else {
    files.push(entryPath);
  }
  return files;
}

async function computeHash() {
  const inputPaths = [
    path.join(ROOT_DIR, 'package.json'),
    path.join(ROOT_DIR, 'pnpm-lock.yaml'),
    A2UI_RENDERER_DIR,
    A2UI_APP_DIR,
  ];

  const files = [];
  for (const input of inputPaths) {
    try {
      await walk(input, files);
    } catch {
      // Directory may not exist
    }
  }

  files.sort((a, b) => normalize(a).localeCompare(normalize(b)));

  const hash = createHash('sha256');
  for (const filePath of files) {
    const rel = normalize(path.relative(ROOT_DIR, filePath));
    hash.update(rel);
    hash.update('\0');
    hash.update(await fs.readFile(filePath));
    hash.update('\0');
  }

  return hash.digest('hex');
}

async function main() {
  // Docker builds exclude vendor/apps via .dockerignore.
  // In that environment we can keep a prebuilt bundle only if it exists.
  const rendererExists = await fs.stat(A2UI_RENDERER_DIR).catch(() => null);
  const appExists = await fs.stat(A2UI_APP_DIR).catch(() => null);

  if (!rendererExists?.isDirectory() || !appExists?.isDirectory()) {
    const outputExists = await fs.stat(OUTPUT_FILE).catch(() => null);
    if (outputExists?.isFile()) {
      console.log('A2UI sources missing; keeping prebuilt bundle.');
      process.exit(0);
    }
    console.error(`A2UI sources missing and no prebuilt bundle found at: ${OUTPUT_FILE}`);
    process.exit(1);
  }

  const currentHash = await computeHash();
  const hashExists = await fs.stat(HASH_FILE).catch(() => null);

  if (hashExists?.isFile()) {
    const previousHash = await fs.readFile(HASH_FILE, 'utf8');
    const outputExists = await fs.stat(OUTPUT_FILE).catch(() => null);
    if (previousHash === currentHash && outputExists?.isFile()) {
      console.log('A2UI bundle up to date; skipping.');
      process.exit(0);
    }
  }

  try {
    // TypeScript compilation
    execSync(`pnpm -s exec tsc -p "${A2UI_RENDERER_DIR}/tsconfig.json"`, {
      stdio: 'inherit',
      cwd: ROOT_DIR,
    });

    // Rolldown bundling
    try {
      execSync('rolldown --version', { stdio: 'pipe', cwd: ROOT_DIR });
      execSync(`rolldown -c "${A2UI_APP_DIR}/rolldown.config.mjs"`, {
        stdio: 'inherit',
        cwd: ROOT_DIR,
      });
    } catch {
      execSync(`pnpm -s dlx rolldown -c "${A2UI_APP_DIR}/rolldown.config.mjs"`, {
        stdio: 'inherit',
        cwd: ROOT_DIR,
      });
    }

    await fs.writeFile(HASH_FILE, currentHash);
  } catch (error) {
    console.error('A2UI bundling failed. Re-run with: pnpm canvas:a2ui:bundle');
    console.error('If this persists, verify pnpm deps and try again.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});