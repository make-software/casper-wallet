// @ts-nocheck — semgrep pattern fixture, not type-checked code.
// Test fixture for cw-no-eval.

export function dangerous(src, flag) {
  // ruleid: cw-no-eval
  eval(src);
  // ruleid: cw-no-eval
  const fn = new Function('a', 'return a + 1');

  if (flag) {
    // ruleid: cw-no-eval
    return eval('1 + 1');
  }
  return fn;
}

export function safe(src) {
  // ok: cw-no-eval
  const parsed = JSON.parse(src);
  // ok: cw-no-eval
  const evaluated = myEvaluator(src);
  // ok: cw-no-eval
  const fn = function namedFn() {};
  return { parsed, evaluated, fn };
}
