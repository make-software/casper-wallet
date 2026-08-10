#!/usr/bin/env node
/**
 * Runs the annotated unit tests for the custom rules in .semgrep.yml.
 *
 * Why a script instead of a plain `semgrep --test` call:
 *
 * 1. `semgrep --test --config=<file> <directory>` crashes in semgrep 1.157
 *    (test.py `relatively_eq` -> IndexError: tuple index out of range). When the
 *    config is a single file, semgrep tries to name-match it against each test
 *    file and indexes an empty relative path. Only `--config=<file> <file>` — a
 *    file target, not a directory — takes the branch that runs every rule in the
 *    config against the target. So each test file needs its own invocation.
 *
 * 2. A rule can only be considered tested if some test file actually exercises
 *    it. This script fails when a rule in .semgrep.yml has no annotations
 *    anywhere, so a new rule cannot be added without tests.
 *
 * Caveat: `semgrep --test` ignores each rule's `paths:` include/exclude globs,
 * so these tests validate patterns only, never path scoping.
 */

import { spawn } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const configPath = join(repoRoot, '.semgrep.yml');
const testsDir = join(repoRoot, '.semgrep', 'rule-tests');
const CONCURRENCY = 4;

/** Rule ids declared in .semgrep.yml, in file order. */
function declaredRuleIds() {
  const yaml = readFileSync(configPath, 'utf8');
  return [...yaml.matchAll(/^\s*-\s+id:\s*(\S+)\s*$/gm)].map(m => m[1]);
}

function testFiles() {
  return readdirSync(testsDir)
    .filter(name => /\.tsx?$/.test(name))
    .sort()
    .map(name => join(testsDir, name));
}

function runSemgrepTest(file) {
  return new Promise(resolvePromise => {
    const args = ['--test', '--config', configPath, file, '--metrics=off', '--json'];
    const child = spawn('semgrep', args, { cwd: repoRoot });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => (stdout += chunk));
    child.stderr.on('data', chunk => (stderr += chunk));

    child.on('error', err =>
      resolvePromise({ file, fatal: `failed to spawn semgrep: ${err.message}` })
    );

    child.on('close', () => {
      let parsed;
      try {
        parsed = JSON.parse(stdout);
      } catch {
        resolvePromise({ file, fatal: stderr.trim() || 'semgrep produced no JSON output' });
        return;
      }
      resolvePromise({ file, parsed });
    });
  });
}

/** Flattens semgrep's nested --test --json shape into per-rule check records. */
function extractChecks(parsed) {
  const checks = [];
  for (const configResult of Object.values(parsed.results ?? {})) {
    for (const [ruleId, check] of Object.entries(configResult.checks ?? {})) {
      const matches = Object.values(check.matches ?? {});
      const expected = matches.flatMap(m => m.expected_lines ?? []);
      const reported = matches.flatMap(m => m.reported_lines ?? []);
      // A rule with no annotations in this file is not a test, just a no-op.
      if (expected.length === 0 && reported.length === 0) continue;
      checks.push({
        ruleId,
        passed: check.passed === true,
        missed: expected.filter(line => !reported.includes(line)),
        unexpected: reported.filter(line => !expected.includes(line)),
      });
    }
  }
  return checks;
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await fn(items[index]);
      }
    })
  );
  return results;
}

const declared = declaredRuleIds();
const files = testFiles();

if (files.length === 0) {
  console.error(`No test files found in ${testsDir}`);
  process.exit(1);
}

const runs = await mapWithConcurrency(files, CONCURRENCY, runSemgrepTest);

const exercised = new Set();
let failed = 0;
let passed = 0;

for (const run of runs) {
  const relative = run.file.slice(repoRoot.length + 1);

  if (run.fatal) {
    console.error(`✖ ${relative}\n    ${run.fatal}`);
    failed++;
    continue;
  }

  const checks = extractChecks(run.parsed);
  if (checks.length === 0) {
    console.error(`✖ ${relative}\n    no ruleid:/ok: annotations were exercised`);
    failed++;
    continue;
  }

  for (const check of checks) {
    exercised.add(check.ruleId);
    if (check.passed) {
      passed++;
      continue;
    }
    failed++;
    const details = [
      check.missed.length ? `expected a finding on line(s) ${check.missed.join(', ')}` : null,
      check.unexpected.length
        ? `unexpected finding on line(s) ${check.unexpected.join(', ')}`
        : null,
    ].filter(Boolean);
    console.error(`✖ ${check.ruleId}  (${relative})\n    ${details.join('\n    ')}`);
  }
}

const untested = declared.filter(id => !exercised.has(id));
if (untested.length > 0) {
  console.error(
    `✖ ${untested.length} rule(s) in .semgrep.yml have no tests:\n    ${untested.join('\n    ')}` +
      `\n    Add a fixture under .semgrep/rule-tests/ — see .semgrep/README.md.`
  );
}

const total = declared.length;
console.log(
  `\n${passed} check(s) passed, ${failed} failed — ` +
    `${exercised.size}/${total} rule(s) covered across ${files.length} file(s).`
);

process.exit(failed > 0 || untested.length > 0 ? 1 : 0);
