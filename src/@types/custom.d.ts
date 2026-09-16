declare module '*.svg' {
  const content: any;
  export default content;
}

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.css';

declare module '*.wasm' {
  /** Base64 of the file's bytes — see the `base64-loader` rule in webpack.config.js. */
  const value: string;
  export default value;
}

/**
 * Build-time CSP nonce, substituted by webpack's DefinePlugin.
 *
 * A real base64 string only on Chrome production builds, the one target whose CSP
 * pins `style-src` to a nonce; `null` everywhere else, which every reader must handle.
 */
declare const __CSP_NONCE__: string | null;
