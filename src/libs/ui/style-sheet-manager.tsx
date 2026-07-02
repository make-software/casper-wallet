import isPropValid from '@emotion/is-prop-valid';
import React, { PropsWithChildren } from 'react';
import { StyleSheetManager } from 'styled-components';

const shouldForwardProp = (propName: string, target: unknown) =>
  typeof target === 'string' ? isPropValid(propName) : true;

export const CspStyleSheetManager = ({ children }: PropsWithChildren) => (
  <StyleSheetManager
    shouldForwardProp={shouldForwardProp}
    nonce={process.env.CSP_NONCE}
  >
    {children}
  </StyleSheetManager>
);
