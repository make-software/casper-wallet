import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider } from 'styled-components';

import { lightTheme } from '@libs/ui/theme-config';

import { SagaErrorBanner } from './saga-error-banner';
import {
  dismissUiError,
  getUiErrorsSnapshot,
  reportUiError
} from './ui-error-channel';

// The banner pulls the `@libs/layout` / `@libs/ui/components` barrels, and those
// transitively load two modules that cannot survive this environment:
// `webextension-polyfill` throws on import outside an extension, and
// `mac-scrollbar` ships only an ESM entry (no `main`), which jest cannot resolve.
// The banner itself touches neither.
jest.mock('webextension-polyfill', () => ({
  windows: {},
  runtime: {},
  tabs: {},
  storage: { local: {} }
}));

jest.mock(
  'mac-scrollbar',
  () => ({
    __esModule: true,
    MacScrollbar: ({ children }: { children?: React.ReactNode }) => children,
    GlobalScrollbar: () => null
  }),
  // `virtual` because jest cannot resolve the real module either — a plain
  // factory mock still resolves the path first.
  { virtual: true }
);

// jest runs in 'node' here — no jsdom. `renderToStaticMarkup` is how this repo
// tests components (see remote-icon.test.tsx / svg-icon.test.tsx).
jest.mock('react-inlinesvg', () => ({
  __esModule: true,
  default: () => null
}));

// `t` returns its key so the assertions read as the English copy.
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: ({ children }: { children: React.ReactNode }) => children
}));

// The banner's background half reads the replica store through `useSelector`.
// Feeding the selector a fake state is lighter than standing up a Provider, and
// it keeps this suite about the merge, not about redux.
let fakeState: unknown;

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector(fakeState)
}));

// Importing the real module would pull in `webextension-polyfill`, which throws
// outside an extension. Dismissing a background row is not what this suite tests.
jest.mock('@background/redux/utils', () => ({
  dispatchToMainStore: jest.fn()
}));

const withNoBackgroundErrors = () => {
  fakeState = {
    appEvents: { errors: [], dismissedEventIds: [], nextErrorId: 1 }
  };
};

const withBackgroundError = () => {
  fakeState = {
    appEvents: {
      errors: [
        { id: 1, source: 'lockVaultSaga', message: 'vault would not lock' }
      ],
      dismissedEventIds: [],
      nextErrorId: 2
    }
  };
};

// `renderToStaticMarkup` escapes the apostrophe in the copy to `&#x27;`. Decode
// it so the assertions read as the text a user actually sees.
const render = () =>
  renderToStaticMarkup(
    <ThemeProvider theme={lightTheme}>
      <SagaErrorBanner />
    </ThemeProvider>
  ).replace(/&#x27;/g, "'");

describe('SagaErrorBanner', () => {
  afterEach(() => {
    getUiErrorsSnapshot().forEach(error => dismissUiError(error.id));
  });

  it('renders nothing when neither channel has an error', () => {
    withNoBackgroundErrors();

    expect(render()).toBe('');
  });

  it('renders a background saga error as before', () => {
    withBackgroundError();

    const html = render();

    expect(html).toContain('lockVaultSaga');
    expect(html).toContain('vault would not lock');
  });

  it('renders a dropped dispatch with translated copy and no action type', () => {
    // The action type is a developer identifier: it names no dapp and suggests
    // no next step, so it stays in the console.
    withNoBackgroundErrors();
    reportUiError('dispatch-failed', 'LOCK_VAULT_SAGA');

    const html = render();

    expect(html).toContain(
      "Couldn't reach the wallet. Nothing was changed — please try again."
    );
    expect(html).not.toContain('LOCK_VAULT_SAGA');
  });

  it('renders a failed window open with its own copy', () => {
    withNoBackgroundErrors();
    reportUiError('window-open-failed', 'ImportAccount');

    const html = render();

    expect(html).toContain("Couldn't open the window. Please try again.");
    expect(html).not.toContain('ImportAccount');
  });

  it('renders both channels at once', () => {
    withBackgroundError();
    reportUiError('dispatch-failed', 'LOCK_VAULT_SAGA');

    const html = render();

    expect(html).toContain('vault would not lock');
    expect(html).toContain("Couldn't reach the wallet");
  });
});
