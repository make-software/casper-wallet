// @ts-nocheck — semgrep pattern fixture, not type-checked code.
// Test fixture for cw-no-hardcoded-secrets.
// Values below are random filler, not real credentials.

// ruleid: cw-no-hardcoded-secrets
const apiKey = 'AbCdEf0123456789xyz';

// ruleid: cw-no-hardcoded-secrets
const secret = 'abcdefghijklmnop';

// ruleid: cw-no-hardcoded-secrets
const PRIVATE_KEY = 'MIIEvQIBADANBgkqhkiG9w0BA';

const config = {
  // ruleid: cw-no-hardcoded-secrets
  password: 'p4ssw0rdp4ssw0rdp4ss'
};

// ok: cw-no-hardcoded-secrets
const ChangePassword = '/change-password';

// ok: cw-no-hardcoded-secrets
const token = 'short';

// ok: cw-no-hardcoded-secrets
const apiKeyHeader = 'X-Api-Key';

// ok: cw-no-hardcoded-secrets
const dbPassword = process.env.DB_PASSWORD;

export {
  apiKey,
  secret,
  PRIVATE_KEY,
  config,
  ChangePassword,
  token,
  apiKeyHeader,
  dbPassword
};
