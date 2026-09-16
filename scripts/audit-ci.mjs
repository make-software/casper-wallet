#!/usr/bin/env node
/**
 * Runtime dependency audit gate: a high or critical advisory fails the build unless
 * it is in ACCEPTED, whose entries stop suppressing past their `reviewBy` date so an
 * exception cannot quietly become permanent. `npm audit` reports one entry per node
 * in the dependency chain, so findings are deduplicated by advisory id.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const BLOCKING = new Set(['high', 'critical']);

/**
 * Advisories reviewed and found not to affect the shipped extension. Establish that
 * the vulnerable code cannot run in the product, and record how that was checked.
 */
const ACCEPTED = [];

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

function advisoryId(via) {
  const fromUrl = /GHSA-[a-z0-9-]+/i.exec(via.url ?? '');
  return fromUrl ? fromUrl[0] : `npm-${via.source}`;
}

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
