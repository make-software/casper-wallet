import isPropValid from '@emotion/is-prop-valid';
import React, { PropsWithChildren } from 'react';
import { StyleSheetManager } from 'styled-components';

const shouldForwardProp = (propName: string, target: unknown) =>
  typeof target === 'string' ? isPropValid(propName) : true;

export const CspStyleSheetManager = ({ children }: PropsWithChildren) => (
  <StyleSheetManager
    shouldForwardProp={shouldForwardProp}
    // no-op until CSP-nonce hardening (WALLET-1337 follow-up) wires
    // process.env.CSP_NONCE via DefinePlugin; style-src is 'unsafe-inline' for now
    nonce={process.env.CSP_NONCE}
  >
    {children}
  </StyleSheetManager>
);
