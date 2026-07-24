# `storage.local` key inventory

This document describes every key Casper Wallet writes to the extension's
`storage.local`, defined in
[`src/background/redux/get-main-store.ts`](../../src/background/redux/get-main-store.ts).
It exists so that anyone touching persistence understands two things before
they change a key string: **the names are immutable**, and **the names are
not a security control**.

## Key inventory

The obfuscated strings (e.g. `'zazXu8w9GyCtxZ'`) are `storage.local` **key
names**, not values and not cryptography. They only namespace what is stored
under them.

### Redux-slice-backed keys

These back a slice of the main Redux store. They are read on
`getExistingMainStoreSingletonOrInit` and re-written on every store
subscription tick (see `get-main-store.ts`).

| Constant                       | Obfuscated key   | Stores                                                                                           | Secret?                                                                                                                                                                  | Plaintext at rest?                                                     |
| ------------------------------ | ---------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `VAULT_CIPHER_KEY`             | `zazXu8w9GyCtxZ` | The encrypted vault blob (`vaultCipher` slice) — accounts, keys, and other secret vault contents | **Yes** — the vault's secret keys/mnemonic; the only slice encrypted at rest                                                                                             | No — AES-256-GCM ciphertext, `base64(iv[12]\|\|ciphertext\|\|tag[16])` |
| `KEYS_KEY`                     | `2yNVAEQJB5rxMg` | Password/salt hashes and key-derivation salt hash (`keys` slice)                                 | **Sensitive** — the password hash + salts are offline password-guessing material; treated as private state (P0.1), served only behind the trusted-sender gate at runtime | Yes                                                                    |
| `LOGIN_RETRY_KEY`              | `7ZVdMbk9yD8WGZ` | Failed-login retry counter (`loginRetryCount` slice)                                             | No                                                                                                                                                                       | Yes                                                                    |
| `LOGIN_RETRY_LOCKOUT_KEY`      | `p6nnYiaxcsaNG3` | Login-retry lockout state (`loginRetryLockoutTime` slice)                                        | No                                                                                                                                                                       | Yes                                                                    |
| `LAST_ACTIVITY_TIME`           | `j8d1dusn76EdD`  | Timestamp of last user activity, for auto-lock                                                   | No                                                                                                                                                                       | Yes                                                                    |
| `VAULT_SETTINGS`               | `Nmxd8BZh93MHua` | User/app settings (`settings` slice)                                                             | No                                                                                                                                                                       | Yes                                                                    |
| `RECENT_RECIPIENT_PUBLIC_KEYS` | `7c2WyRuGhEtaDX` | Recently used recipient public keys                                                              | No                                                                                                                                                                       | Yes                                                                    |
| `CONTACTS_KEY`                 | `teuwe6zH3A72gc` | Saved address-book contacts (`contacts` slice)                                                   | No                                                                                                                                                                       | Yes                                                                    |
| `RATE_APP`                     | `p4cGYubbwnd9ke` | "Rate the app" prompt state                                                                      | No                                                                                                                                                                       | Yes                                                                    |
| `APP_EVENTS`                   | `k4uL4wqkvCMoxB` | App-event tracking state                                                                         | No                                                                                                                                                                       | Yes                                                                    |
| `TRUSTED_WASM`                 | `k1uC4wqkwCMwxL` | Trusted-WASM allowlist state                                                                     | No                                                                                                                                                                       | Yes                                                                    |
| `CSPR_NAME_EXPIRATIONS`        | `TVn5HXvXCfYRpJ` | cspr.name expiration records per network (`csprNameExpirations` slice)                           | No                                                                                                                                                                       | Yes                                                                    |

### Standalone absolute-deadline keys

Added in DEP-99/PR3 to survive MV3 service-worker restarts. These are written
directly to `storage.local` by the vault sagas — they are **not** part of the
Redux state shape and are not covered by `selectPopupState` or the
subscription-driven persistence above. See the deadline-key comment block in
`get-main-store.ts` for why they exist.

| Constant                           | Obfuscated key   | Stores                                                                              | Secret? | Plaintext at rest? |
| ---------------------------------- | ---------------- | ----------------------------------------------------------------------------------- | ------- | ------------------ |
| `LOGIN_RETRY_LOCKOUT_DEADLINE_KEY` | `q9Tf3Lm4pRxVne` | Absolute timestamp (`Date.now() + remaining`, ms) when the login-retry lockout ends | No      | Yes                |
| `AUTO_LOCK_DEADLINE_KEY`           | `r3Wj7Nc8vBhQyD` | Absolute timestamp (`Date.now() + remaining`, ms) when auto-lock inactivity fires   | No      | Yes                |

## Immutability

Once a key string ships, it is permanent. Two failure modes if that rule is
broken:

- **Renaming `VAULT_CIPHER_KEY`** strands the existing encrypted vault blob
  under the old key name. On next load the wallet finds nothing under the new
  key, which looks identical to a wiped wallet — every existing user is
  bricked, with no recovery short of restoring from their seed phrase.
- **Renaming any other key** silently drops that slice's persisted state
  (settings, contacts, lockout deadlines, etc.) on upgrade. The user doesn't
  lose funds, but they lose data and the app can end up in an inconsistent
  state until it re-initializes defaults.

The rule that follows: **keys are append-only**. Never rename an existing key
and never repurpose one for a different shape of data — add a new key instead
and, if needed, migrate/clean up the old one explicitly.

## Opacity is not encryption

The obfuscated key _names_ (`zazXu8w9GyCtxZ`, `2yNVAEQJB5rxMg`, ...) look
random, but they are not a security boundary. Anyone with access to
`storage.local` — a malicious extension with the right permissions, a local
device compromise, browser devtools — can enumerate and read every value
regardless of what the key is called. The obfuscation exists only to reduce
casual collisions and to make casual inspection (e.g. skimming devtools)
slightly less self-describing; it provides no protection against a motivated
reader.

The real at-rest protection for secret material is the vault-cipher
encryption itself (AES-256-GCM, keyed by a password-derived key that is never
persisted — see
[`src/libs/crypto/vault.ts`](../../src/libs/crypto/vault.ts) and
[`src/libs/crypto/aes.ts`](../../src/libs/crypto/aes.ts)). Every other key in
the tables above is plaintext at rest: readable directly from `storage.local`
without decrypting anything.

## Future direction

This is a direction, not a committed roadmap:

- Encrypt-at-rest for the remaining plaintext slices (settings, contacts,
  activity timestamps, deadlines), not just the vault.
- A versioned storage schema: today there is no schema-version key, so shape
  changes to any slice rely on defensive/optional reads in the store's
  preload path (`getExistingMainStoreSingletonOrInit`) rather than an
  explicit migration step.
- A rotation scheme for the vault-cipher encryption key, decoupled from the
  storage key name itself (rotation should never require touching
  `VAULT_CIPHER_KEY`).
