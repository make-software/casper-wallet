declare module '*.svg' {
  const content: any;
  export default content;
}

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.css';

/**
 * Build-time CSP nonce, substituted by webpack's DefinePlugin.
 *
 * A real base64 string on Chrome production builds — the only target whose CSP
 * pins `style-src` to a nonce — and `null` everywhere else (dev, Firefox, Safari),
 * where `style-src` keeps 'unsafe-inline'. Under jest it is `null` too, via
 * `globals` in jest.config.js.
 *
 * The `null` in this type is load-bearing: it forces every reader to handle the
 * non-Chrome case explicitly. See webpack.config.js.
 */
declare const __CSP_NONCE__: string | null;
