module.exports = {
  contextSeparator: false,

  createOldCatalogs: true,

  defaultNamespace: 'translation',

  defaultValue: '',

  indentation: 2,

  keepRemoved: false,

  keySeparator: false,
  // Keys are plain english, so a `.` or `:` inside one must not be read as a
  // separator.

  lexers: {
    htm: ['HTMLLexer'],
    html: ['HTMLLexer'],
    mjs: ['JavascriptLexer'],

    js: ['JavascriptLexer'],
    jsx: ['JsxLexer'],
    ts: ['JavascriptLexer'],
    tsx: ['JsxLexer'],

    default: ['JavascriptLexer']
  },

  lineEnding: 'auto',

  locales: ['en'],

  namespaceSeparator: false,

  output: 'lang/casper-signer-v2.json',

  pluralSeparator: '_',

  input: undefined,

  sort: false,

  skipDefaultValues: false,

  useKeysAsDefaultValue: true,

  verbose: false,

  failOnWarnings: false,

  customValueTemplate: null
};
