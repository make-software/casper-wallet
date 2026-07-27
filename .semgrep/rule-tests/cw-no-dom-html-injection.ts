// @ts-nocheck — semgrep pattern fixture, not type-checked code.
// Test fixture for cw-no-dom-html-injection.

export function inject(el, html, node) {
  // ruleid: cw-no-dom-html-injection
  el.innerHTML = html;
  // ruleid: cw-no-dom-html-injection
  el.outerHTML = html;
  // ruleid: cw-no-dom-html-injection
  el.insertAdjacentHTML('beforeend', html);
  // ruleid: cw-no-dom-html-injection
  document.write(html);

  if (node) {
    // ruleid: cw-no-dom-html-injection
    node.innerHTML = '<b>nested</b>';
  }
}

export function safeDom(el, text, node) {
  // ok: cw-no-dom-html-injection
  el.textContent = text;
  // ok: cw-no-dom-html-injection
  el.append(node);
  // ok: cw-no-dom-html-injection
  const current = el.innerHTML;
  // ok: cw-no-dom-html-injection
  el.setAttribute('title', text);
  return current;
}
