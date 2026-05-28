#!/usr/bin/env node
/**
 * lint-inline-js.cjs
 *
 * Scans dist/_worker.js for the specific class of bugs that break inline JS:
 *
 * 1. Broken onclick patterns: onclick="fn('' + var + '')"
 *    → Should use data-* attributes instead of inline string quoting
 *
 * 2. Unescaped single-quotes breaking inline onclick strings:
 *    onclick="fn('..." where the argument is built by string concat with \\'
 *    collapsing to empty string in the HTML output
 *
 * 3. Also checks that the inline <script> block exists in the build.
 */
'use strict';
const fs   = require('fs');
const path = require('path');

const workerPath = path.join(__dirname, '..', 'dist', '_worker.js');
if (!fs.existsSync(workerPath)) {
  console.error('lint-inline-js: dist/_worker.js not found — run npm run build first');
  process.exit(1);
}

const raw = fs.readFileSync(workerPath, 'utf8');

let errors = 0;

// ── Check 1: inline <script> block exists ─────────────────────────────────
const OPEN  = '<script>\n';
const CLOSE = '<\\/script>';
const sIdx  = raw.lastIndexOf(OPEN);
const eIdx  = raw.lastIndexOf(CLOSE);
if (sIdx < 0 || eIdx < 0 || eIdx < sIdx) {
  console.error('❌ lint-inline-js: could not locate <script> block. sIdx=' + sIdx + ' eIdx=' + eIdx);
  process.exit(1);
}
const js = raw.slice(sIdx + OPEN.length, eIdx);
console.log('   Script block: ' + js.length + ' chars (lines ~' + js.split('\n').length + ')');

// ── Check 2: broken onclick="fn('' + varName + '')" pattern ───────────────
// This happens when \' in the TSX source collapses to ' in the output,
// turning onclick="fn(\''+var+'\'')" into onclick="fn(''+var+'')"
// which is a JS syntax error (unexpected string in expression context).
const brokenOnclick = /onclick="[^"]*\('' \+ [^)]*\+ ''\)/g;
let m;
const lines = js.split('\n');
while ((m = brokenOnclick.exec(js)) !== null) {
  // find line number
  const lineNo = js.slice(0, m.index).split('\n').length;
  console.error('❌ Broken onclick string concat at line ' + lineNo + ':');
  console.error('   ' + lines[lineNo - 1].trim().slice(0, 120));
  errors++;
}

// ── Check 3: onclick with raw string arg that has unmatched quotes ─────────
// Pattern: onclick="someFunc('...') where ' appears bare inside double-quoted attr
const onclickBareQuote = /onclick="[^"]*\('[^'"]*'/g;
// (This is a heuristic — only fire if it looks like a broken string)
// Skip — too many false positives with valid patterns like onclick="switchTab('executive',this)"

// ── Check 4: No use of \' escape in dynamically built onclick strings ──────
// In TSX template, building onclick with escaped single quotes is fragile.
// Detect: safePM.*replace.*\\\\' patterns in source (build-time warning)
const sourceFile = path.join(__dirname, '..', 'src', 'index.tsx');
if (fs.existsSync(sourceFile)) {
  const src = fs.readFileSync(sourceFile, 'utf8');
  const fragilePattern = /onclick.*\\\\'+\s*\+\s*\w+\s*\+\s*\\''/g;
  let fm;
  while ((fm = fragilePattern.exec(src)) !== null) {
    const lineNo = src.slice(0, fm.index).split('\n').length;
    console.warn('⚠ Fragile onclick string quoting at src/index.tsx line ' + lineNo + ' — use data-* + event delegation instead');
    errors++;
  }
}

// ── Result ─────────────────────────────────────────────────────────────────
if (errors > 0) {
  console.error('\n❌ lint-inline-js: ' + errors + ' issue(s) found — build aborted');
  console.error('   Fix: use data-* attributes + addEventListener delegation instead of onclick string quoting');
  process.exit(1);
}

console.log('✅ Inline JS lint OK — no broken onclick patterns found');
