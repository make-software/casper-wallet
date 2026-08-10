# Semgrep configuration for Casper Wallet

This directory documents the Semgrep setup used by this project. The setup
mirrors the one in CasperWalletMobile, adapted to the browser-extension
architecture (background script store singleton, content script, reselect).

## Files

- **`../.semgrep.yml`** — custom rules derived from `CLAUDE.md` and
  `.claude/docs` invariants (store singleton boundary, saga vs thunk,
  secret logging, no eval, XSS sinks, selector memoization, etc.).
- **`../.semgrepignore`** — paths excluded from all scans (build artifacts,
  node_modules, e2e reports, binary assets).
- **`rule-tests/`** — one annotated fixture per custom rule, run by
  `npm run semgrep:test`. See [Testing custom rules](#testing-custom-rules).

## Installation

```bash
brew install semgrep
semgrep --version
```

## Rule packs

Semgrep's YAML config does not support importing registry rule packs via
`extends:` — rule packs are passed through CLI `--config` flags. The command
below combines the registry packs recommended for this project with the local
custom rules file.

### Recommended registry packs

| Pack                     | Purpose                                                 |
| ------------------------ | ------------------------------------------------------- |
| `p/javascript`           | Core JavaScript correctness & security patterns         |
| `p/typescript`           | TypeScript-specific issues (unsafe casts, type escapes) |
| `p/react`                | React anti-patterns and common bugs                     |
| `p/react-best-practices` | Community best practices for React                      |
| `p/nodejsscan`           | Node.js security patterns (relevant for bundled JS)     |
| `p/security-audit`       | General security audit rules                            |
| `p/secrets`              | Hardcoded secrets / credentials detection               |
| `p/owasp-top-ten`        | OWASP Top 10 coverage                                   |
| `p/eslint`               | ESLint-equivalent rules ported to Semgrep               |

> Note: `p/crypto` is not a separately maintained pack at the time of writing.
> Crypto-specific checks are covered by `cw-no-math-random-for-crypto` and
> `cw-logging-secrets` in `.semgrep.yml`, plus rules from `p/security-audit`
> and `p/owasp-top-ten`.

## Disabled registry rules

Registry rules can only be turned off via the `--exclude-rule` CLI flag —
Semgrep's YAML config doesn't allow disabling rules from external packs.
The list below is the project-wide allowlist of suppressions; keep all
scan commands (and CI) in sync with it.

| Rule ID                                                                                    | Source pack              | Reason                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gitlab.eslint.detect-object-injection`                                                    | `p/eslint`               | Port of `eslint-plugin-security/detect-object-injection`. Fires on every `obj[var]` access regardless of where the key comes from. In a TypeScript codebase the key types are already constrained, so the rule produces near-100% false positives. Real prototype-pollution risk is audited at trust boundaries (content-script / SDK message handlers), not by this rule. |
| `typescript.react.portability.i18next.i18next-key-format.i18next-key-format`               | `p/typescript`           | Enforces `MODULE.FEATURE.*` dotted-hierarchy format for i18next keys. This project uses flat sentence-style keys maintained by i18next-parser, which is a valid i18next convention but does not match the rule's regex.                                                                                                                                                    |
| `typescript.react.best-practice.react-props-spreading.react-props-spreading`               | `p/typescript`           | Flags every JSX spread (`<Comp {...props} />`). The project relies on prop spreading for typed wrapper components and styled-components passthrough. TypeScript already enforces prop shape at compile time.                                                                                                                                                               |
| `typescript.react.portability.i18next.jsx-not-internationalized.jsx-not-internationalized` | `p/react-best-practices` | Flags every JSX text node not wrapped in a translation call (351 findings on first scan). Localization coverage is managed via i18next-parser (`locale:extract_pot`), not enforced per-JSX-node.                                                                                                                                                                           |

These suppressions were carried over from CasperWalletMobile; re-validate the
list against the findings of the first full scan of this repo and prune or
extend as needed.

Convenience shell variable — every scan command below references it:

```bash
SEMGREP_EXCLUDED_RULES="--exclude-rule=gitlab.eslint.detect-object-injection --exclude-rule=typescript.react.portability.i18next.i18next-key-format.i18next-key-format --exclude-rule=typescript.react.portability.i18next.jsx-not-internationalized.jsx-not-internationalized --exclude-rule=typescript.react.best-practice.react-props-spreading.react-props-spreading"
```

## Running a scan

### Full scan (local custom rules + all registry packs)

```bash
semgrep \
  --config=./.semgrep.yml \
  --config=p/javascript \
  --config=p/typescript \
  --config=p/react \
  --config=p/react-best-practices \
  --config=p/nodejsscan \
  --config=p/security-audit \
  --config=p/secrets \
  --config=p/owasp-top-ten \
  --config=p/eslint \
  --exclude-rule=gitlab.eslint.detect-object-injection \
  --exclude-rule=typescript.react.portability.i18next.i18next-key-format.i18next-key-format \
  --exclude-rule=typescript.react.portability.i18next.jsx-not-internationalized.jsx-not-internationalized \
  --exclude-rule=typescript.react.best-practice.react-props-spreading.react-props-spreading \
  --metrics=off \
  src/
```

### Quick scan (custom rules only)

For pre-commit or fast iteration, run only the project-specific rules:

```bash
semgrep --config=./.semgrep.yml --metrics=off src/
```

(Custom rules don't include the noisy registry rules, so no `--exclude-rule`
is needed here.)

### Scan only changed files (pre-commit style)

```bash
git diff --name-only --diff-filter=ACMR HEAD | \
  grep -E '\.(ts|tsx|js|jsx)$' | \
  xargs semgrep --config=./.semgrep.yml --metrics=off
```

## npm scripts

Wired into `package.json`:

- `npm run semgrep` — fast, project rules only, for local iteration
- `npm run semgrep:full` — full scan with all packs, for periodic audits
- `npm run semgrep:ci` — version-parity check plus a stricter pack subset with
  `--error` to fail CI on findings; runs as a blocking step in
  `.github/workflows/ci-check.yml` (semgrep pinned to 1.157.0 there)
- `npm run check:casper-sdk-version` — cross-file casper-js-sdk version parity
  check (see "Cross-file checks" below)

## Output formats

- **Human-readable (default):** `semgrep --config=./.semgrep.yml src/`
- **JSON for tooling:** add `--json > semgrep-results.json`
- **SARIF for GitHub Security tab:** add `--sarif > semgrep-results.sarif`
- **JUnit for CI reports:** add `--junit-xml > semgrep-junit.xml`

## Suppressing findings

When a finding is a false positive or an intentional exception, add an
inline comment above the offending line:

```typescript
// nosemgrep: cw-storage-local-outside-background
const data = await browser.storage.local.get(key);
```

Include a rule ID so the suppression is targeted. Generic `// nosemgrep`
without an ID suppresses all rules on that line and should be avoided.

## Baseline workflow

On a mature codebase, the first full scan will produce many findings.
Recommended approach:

1. Run a full scan and review findings by severity (`ERROR` first).
2. Fix real bugs; suppress false positives with `// nosemgrep: <rule-id>`.
3. Commit the suppressions together with a short justification in the commit
   message.
4. From that point on, CI enforces zero new `ERROR` findings via `semgrep:ci`.

## Cross-file checks

The `casper-js-sdk` version pinned in the root `package.json` must match the
version pinned by `casper-wallet-core` (read from
`node_modules/casper-wallet-core/package.json`). Drift between the two causes
subtle signing/serialization bugs.

This check is implemented as the `check:casper-sdk-version` npm script (plain
Node.js), which also runs as part of `semgrep:ci`. It requires `npm install`
to have run.

> **Why not a Semgrep rule?** CasperWalletMobile implements this check with
> Semgrep's experimental `mode: join`, but join mode is broken in current
> Semgrep versions (verified on 1.157.0): `pattern-regex` named capture groups
> no longer emit metavariables, so the join engine crashes with
> `AttributeError: ... has no attribute '$VER'` whenever the sub-rules match,
> and the rule fails `semgrep --validate` schema checks. The npm script is a
> deterministic replacement. (The mobile repo's join rule has the same problem
> — it only appears to work because its scan commands target `src/` and never
> feed it the two package.json files.)

## Adding custom rules

New rules go into `../.semgrep.yml` under the `rules:` list. Naming convention:

- ID prefix: `cw-` (Casper Wallet)
- Category: `store`, `storage`, `redux`, `logging`, `selector`, etc.
- Short description: kebab-case summary

Example skeleton for a new rule:

```yaml
- id: cw-<category>-<description>
  message: >
    Explanation of the issue and the fix, including a link back to the
    relevant CLAUDE.md section when applicable.
  severity: ERROR # or WARNING / INFO
  languages: [typescript, javascript]
  pattern-either:
    - pattern: <semgrep-pattern>
  paths:
    exclude:
      - '**/*.test.ts'
```

Every new rule needs a fixture in `rule-tests/` — `npm run semgrep:test` fails
if a rule in `../.semgrep.yml` has no test. See below.

## Testing custom rules

```bash
npm run semgrep:test
```

Each rule has one fixture at `rule-tests/<rule-id>.ts` (or `.tsx`) annotated
with Semgrep's test comments:

```ts
// ruleid: cw-no-eval
eval(src);

// ok: cw-no-eval
JSON.parse(src);
```

The annotation must be on the line **immediately before** the code, and must
contain nothing but the marker and the rule id. Cover the vulnerable case, the
safe alternative, and at least one near-miss that must not match.

`rule-tests/` is listed in `../.prettierignore`: the `@trivago` import-sort
plugin reorders imports away from their annotations, which silently breaks the
import-based fixtures.

### Two things the runner works around

`scripts/semgrep-test.mjs` exists rather than a plain `semgrep --test` call
because of two limitations:

1. **`semgrep --test --config=<file> <directory>` crashes** in semgrep 1.157
   (`test.py` → `relatively_eq` → `IndexError: tuple index out of range`). With
   a single-file config, semgrep tries to name-match the config against each
   test file and indexes an empty relative path. Only a **file** target takes
   the branch that runs every rule in the config against it, so each fixture
   needs its own invocation. (Same family as the `mode: join` breakage below —
   this config layout is off semgrep's tested path.)
2. **A rule with no fixture would pass silently.** The runner cross-checks the
   rule ids in `../.semgrep.yml` against the ids actually exercised and fails on
   any rule that has no test.

### What these tests do not cover

`semgrep --test` **ignores each rule's `paths:` include/exclude globs** —
verified against 1.157: a fixture placed outside `paths.include` still matches,
while a normal scan of the same file correctly reports nothing. So the fixtures
validate **patterns only**. A broken `paths:` block — a wrong `include` glob, a
missing `src/background/**` exclusion — will not be caught here. Check path
scoping with a real scan instead:

```bash
npm run semgrep
```

## Further reading

- [Semgrep rule syntax](https://semgrep.dev/docs/writing-rules/rule-syntax)
- [Registry](https://semgrep.dev/explore)
- [Suppressing findings](https://semgrep.dev/docs/ignoring-files-folders-code)
