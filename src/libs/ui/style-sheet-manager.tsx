import isPropValid from '@emotion/is-prop-valid';
import React, { PropsWithChildren } from 'react';
import { StyleSheetManager } from 'styled-components';

const shouldForwardProp = (propName: string, target: unknown) =>
  typeof target === 'string' ? isPropValid(propName) : true;

export const CspStyleSheetManager = ({ children }: PropsWithChildren) => (
  <StyleSheetManager
    shouldForwardProp={shouldForwardProp}
    // Chrome production stamps this on injected <style> tags to satisfy `style-src
    // 'nonce-…'`; `?? undefined` — a null would fork off the shared style sheet.
    nonce={__CSP_NONCE__ ?? undefined}
  >
    {children}
  </StyleSheetManager>
);
