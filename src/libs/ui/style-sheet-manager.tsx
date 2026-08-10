import isPropValid from '@emotion/is-prop-valid';
import React, { PropsWithChildren } from 'react';
import { StyleSheetManager } from 'styled-components';

const shouldForwardProp = (propName: string, target: unknown) =>
  typeof target === 'string' ? isPropValid(propName) : true;

export const CspStyleSheetManager = ({ children }: PropsWithChildren) => (
  <StyleSheetManager
    shouldForwardProp={shouldForwardProp}
    // On Chrome production styled-components stamps this nonce on its injected <style>
    // tags so they pass the `style-src 'self' 'nonce-<value>'` CSP. On dev + Firefox/Safari
    // __CSP_NONCE__ is null, so no nonce is passed at all and styled-components falls
    // through to its own discovery chain (meta[property="csp-nonce"] → meta[name="sc-nonce"]
    // → __webpack_nonce__), which resolves to nothing here — harmless, since those CSPs
    // keep 'unsafe-inline'. See webpack.config.js.
    //
    // `?? undefined` is required, not cosmetic: styled-components branches on
    // `props.nonce !== undefined`, so a null would pull these components off the shared
    // style sheet. The `string | null` type of __CSP_NONCE__ makes tsc enforce it.
    nonce={__CSP_NONCE__ ?? undefined}
  >
    {children}
  </StyleSheetManager>
);
