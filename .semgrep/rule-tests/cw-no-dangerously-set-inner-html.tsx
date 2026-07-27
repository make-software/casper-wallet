// @ts-nocheck — semgrep pattern fixture, not type-checked code.
// Test fixture for cw-no-dangerously-set-inner-html.
// This rule is pattern-regex over raw text — do not spell the React prop name
// in comments here, it would be flagged.

export const Unsafe = ({ html }) => (
  // ruleid: cw-no-dangerously-set-inner-html
  <div dangerouslySetInnerHTML={{ __html: html }} />
);

export const UnsafeSpaced = ({ html }) => (
  // ruleid: cw-no-dangerously-set-inner-html
  <span dangerouslySetInnerHTML={{ __html: html }} />
);

export const Safe = ({ text }) => (
  // ok: cw-no-dangerously-set-inner-html
  <div>{text}</div>
);

export const SafeAttr = ({ text }) => (
  // ok: cw-no-dangerously-set-inner-html
  <div title={text}>{text}</div>
);
