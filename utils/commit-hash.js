const fs = require('fs');
const path = require('path');

/**
 * The commit stamp that ships inside the source package.
 *
 * scripts/build_src.sh zips `src scripts utils *.* .env` — and no `.git`. On the
 * tree a Firefox/AMO reviewer unpacks, the `HASH=$(git rev-parse HEAD)` that
 * every build script passes therefore resolves to the empty string. Writing the
 * sha into the package is what lets that rebuild stamp the same
 * `manifest.version_name` as the artifact it is being compared against.
 */
const BUILD_HASH_FILE = 'build-hash.json';

/**
 * What the config resolves to when it is evaluated outside a build — knip
 * harvesting entries, jest requiring the config. Deliberately constant: the
 * fallback this replaced was `Date.now()`, which made every build that reached
 * it unique and silently unreproducible.
 */
const UNKNOWN_COMMIT_HASH = '0000000';

/** Abbreviated or full; `version_name` only ever shows the first 7. */
const COMMIT_HASH_PATTERN = /^[0-9a-f]{7,40}$/;

/**
 * @param {string} root directory holding package.json.
 * @returns {string} the sha recorded in the source package, or `''` when the
 *   file is absent — the normal case for a build from a git checkout.
 * @throws when the file exists but carries no usable sha. A broken stamp is a
 *   build error; falling through to the placeholder would hand the reviewer a
 *   manifest that cannot match the upload, which is the failure being fixed.
 */
function readBuildHashFile(root) {
  const file = path.join(root, BUILD_HASH_FILE);
  let raw;

  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return '';
    }

    throw error;
  }

  let parsed;

  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`${BUILD_HASH_FILE} is not valid JSON: ${error.message}`);
  }

  const commitHash =
    parsed && typeof parsed.commitHash === 'string'
      ? parsed.commitHash.trim()
      : '';

  if (!COMMIT_HASH_PATTERN.test(commitHash)) {
    throw new Error(
      `${BUILD_HASH_FILE} must hold {"commitHash": "<git sha>"}, got ` +
        JSON.stringify(parsed && parsed.commitHash)
    );
  }

  return commitHash;
}

/**
 * Resolves the commit a build should stamp into `manifest.version_name`.
 *
 * @param {object} options
 * @param {string} options.root directory holding package.json.
 * @param {NodeJS.ProcessEnv} [options.env]
 * @param {boolean} [options.isDev] development builds are never compared
 *   against a published artifact, so they may carry a placeholder.
 * @returns {string}
 */
function resolveCommitHash({ root, env = process.env, isDev = false }) {
  const commitHash = env.HASH || env.GITHUB_SHA || readBuildHashFile(root);

  if (commitHash) {
    return commitHash;
  }

  if (isDev) {
    return UNKNOWN_COMMIT_HASH;
  }

  throw new Error(
    'Cannot stamp manifest.version_name: no commit hash available. A production ' +
      'build must record the commit it was built from, so run it inside the git ' +
      'checkout, or pass HASH=<git sha> explicitly, or place a ' +
      `${BUILD_HASH_FILE} holding {"commitHash": "<git sha>"} next to package.json.`
  );
}

module.exports = {
  BUILD_HASH_FILE,
  UNKNOWN_COMMIT_HASH,
  resolveCommitHash
};
