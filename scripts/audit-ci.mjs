#!/usr/bin/env node
/**
 * Runtime dependency audit gate.
 *
 * Replaces `npm audit --omit=dev --audit-level=high`, which could not express the
 * rule the CI step actually wants: fail on a high or critical advisory **that
 * reaches the shipped bundle**. Plain `npm audit` has no notion of reachability,
 * so a package that is declared a runtime dependency but never bundled fails the
 * build with nothing to fix.
 *
 * This script keeps the same threshold and adds a reviewed allowlist:
 *
 * - Any high/critical advisory NOT in ACCEPTED fails the build. New advisories
 *   still break CI, which is the whole point of the gate.
 * - Every ACCEPTED entry carries the reason it does not apply and a `reviewBy`
 *   date. Past that date the entry stops suppressing and the build fails, so an
 *   exception cannot quietly become permanent.
 * - Accepted advisories are always printed. Suppressed-and-invisible is how a
 *   real finding gets lost.
 *
 * Note that `npm audit` reports one entry per node in the dependency chain, so a
 * single advisory shows up several times (brace-expansion, minimatch, glob,
 * casper-js-sdk, casper-wallet-core = one advisory). Findings are deduplicated by
 * advisory id.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/** Severities that fail the build. */
const BLOCKING = new Set(['high', 'critical']);

/**
 * Advisories reviewed and found not to affect the shipped extension.
 *
 * Before adding an entry, establish that the vulnerable code cannot run in the
 * product — not merely that it is inconvenient to fix. Record how that was
 * checked, so the next person can repeat it instead of trusting this comment.
 */
const ACCEPTED = [];

/** Runs npm audit. A non-zero exit is expected when advisories exist. */
async function runNpmAudit() {
  try {
    const { stdout } = await execFileAsync(
      'npm',
      ['audit', '--omit=dev', '--json'],
      { maxBuffer: 64 * 1024 * 1024 }
    );
    return stdout;
  } catch (error) {
    // npm exits 1 when vulnerabilities are found; the JSON is still on stdout.
    if (error.stdout) return error.stdout;
    throw new Error(`npm audit could not be run: ${error.message}`);
  }
}

/** Extracts the GHSA id from an advisory entry. */
function advisoryId(via) {
  const fromUrl = /GHSA-[a-z0-9-]+/i.exec(via.url ?? '');
  return fromUrl ? fromUrl[0] : `npm-${via.source}`;
}

/** Collects distinct blocking advisories across every reported package. */
function collectBlockingAdvisories(report) {
  const byId = new Map();
  for (const entry of Object.values(report.vulnerabilities ?? {})) {
    for (const via of entry.via ?? []) {
      // A string `via` is a propagation link to another package, not an advisory.
      if (typeof via !== 'object') continue;
      if (!BLOCKING.has(via.severity)) continue;
      const id = advisoryId(via);
      if (!byId.has(id)) {
        byId.set(id, {
          id,
          title: via.title ?? '(no title)',
          url: via.url ?? '',
          severity: via.severity,
          range: via.range ?? '',
          packages: new Set(),
        });
      }
      byId.get(id).packages.add(via.name ?? entry.name);
    }
  }
  return [...byId.values()];
}

let raw;
try {
  raw = await runNpmAudit();
} catch (error) {
  // No advisory data means no evidence of safety — fail closed rather than pass.
  console.error(`✖ ${error.message}`);
  process.exit(1);
}

let report;
try {
  report = JSON.parse(raw);
} catch {
  console.error('✖ npm audit did not return parsable JSON. Failing closed.');
  console.error(raw.slice(0, 2000));
  process.exit(1);
}

const advisories = collectBlockingAdvisories(report);
const accepted = new Map(ACCEPTED.map(entry => [entry.id, entry]));
const today = new Date().toISOString().slice(0, 10);

const unexpected = [];
const suppressed = [];
const expired = [];

for (const advisory of advisories) {
  const entry = accepted.get(advisory.id);
  if (!entry) {
    unexpected.push(advisory);
  } else if (today > entry.reviewBy) {
    expired.push({ advisory, entry });
  } else {
    suppressed.push({ advisory, entry });
  }
}

const matchedIds = new Set(advisories.map(a => a.id));
const stale = ACCEPTED.filter(entry => !matchedIds.has(entry.id));

if (suppressed.length > 0) {
  console.log(`Accepted advisories (reviewed, not reaching the shipped bundle):\n`);
  for (const { advisory, entry } of suppressed) {
    console.log(`  • ${advisory.id} — ${entry.package} [${advisory.severity}]`);
    console.log(`    ${advisory.title}`);
    console.log(`    review by ${entry.reviewBy}`);
    console.log(`    ${entry.reason.replace(/(.{95}\s)/g, '$1\n    ')}\n`);
  }
}

for (const entry of stale) {
  console.log(
    `⚠ ${entry.id} (${entry.package}) is allowlisted but no longer reported — ` +
      `remove it from ACCEPTED in scripts/audit-ci.mjs.`
  );
}

for (const { advisory, entry } of expired) {
  console.error(
    `✖ ${advisory.id} — ${entry.package} [${advisory.severity}]\n` +
      `    The exception expired on ${entry.reviewBy}. Re-review it: confirm the advisory ` +
      `still does not\n    reach the shipped bundle and extend reviewBy, or fix the dependency.`
  );
}

for (const advisory of unexpected) {
  console.error(
    `✖ ${advisory.id} — ${[...advisory.packages].join(', ')} [${advisory.severity}]\n` +
      `    ${advisory.title}\n` +
      `    vulnerable: ${advisory.range}\n` +
      `    ${advisory.url}`
  );
}

const failures = unexpected.length + expired.length;
console.log(
  `\n${advisories.length} blocking advisor${advisories.length === 1 ? 'y' : 'ies'} in runtime ` +
    `dependencies: ${suppressed.length} accepted, ${failures} unresolved.`
);

if (failures > 0) {
  console.error(
    `\nRuntime audit gate failed. An advisory may only be allowlisted once it is shown not to ` +
      `reach the\nshipped bundle — see ACCEPTED in scripts/audit-ci.mjs for the required evidence.`
  );
  process.exit(1);
}
