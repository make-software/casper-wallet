import isPropValid from '@emotion/is-prop-valid';
import React, { PropsWithChildren } from 'react';
import { StyleSheetManager } from 'styled-components';

const shouldForwardProp = (propName: string, target: unknown) =>
  typeof target === 'string' ? isPropValid(propName) : true;

export const CspStyleSheetManager = ({ children }: PropsWithChildren) => (
  <StyleSheetManager
    shouldForwardProp={shouldForwardProp}
    // styled-components stamps this nonce on its injected <style> tags so they pass the
    // Chrome-prod `style-src 'self' 'nonce-<value>'` CSP; value comes from webpack DefinePlugin
    // (inert on dev + Firefox/Safari, whose CSP keeps 'unsafe-inline'). See webpack.config.js.
    nonce={process.env.CSP_NONCE}
  >
    {children}
  </StyleSheetManager>
);
