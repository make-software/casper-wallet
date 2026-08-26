// @ts-nocheck — semgrep pattern fixture, not type-checked code.
// Test fixture for cw-storage-session-access-level.
// No `paths` block on this rule — forbidden everywhere, background included.

export async function bare() {
  // ruleid: cw-storage-session-access-level
  await storage.session.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });
}

export async function namespaced() {
  // ruleid: cw-storage-session-access-level
  await browser.storage.session.setAccessLevel({
    accessLevel: 'TRUSTED_CONTEXTS'
  });
  // ruleid: cw-storage-session-access-level
  await chrome.storage.session.setAccessLevel({
    accessLevel: 'TRUSTED_CONTEXTS'
  });
}

export async function widenedAccessLevelIsAlsoCaught() {
  // The dangerous call is the target regardless of which value is passed —
  // the rule flags the call, not the argument.
  // ruleid: cw-storage-session-access-level
  await storage.session.setAccessLevel({
    accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS'
  });
}

export async function safeAlternatives() {
  // Deliberately NOT `storage.session.get`/`set` here — those are also
  // matched by cw-storage-local-outside-background's patterns, and an
  // un-annotated cross-rule match on the same line confuses semgrep's
  // --test rule resolution for the whole file (observed empirically).
  // ok: cw-storage-session-access-level
  await storage.sync.get('a');
  // ok: cw-storage-session-access-level
  await storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });
}
