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

// jest runs in 'node' here — no jsdom.
jest.mock('react-inlinesvg', () => ({
  __esModule: true,
  default: () => null
}));

// `t` returns its key so the assertions read as the English copy.
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: ({ children }: { children: React.ReactNode }) => children
}));

// Lighter than standing up a Provider, and keeps this suite about the merge.
let fakeState: unknown;

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector(fakeState)
}));

// The real module pulls in `webextension-polyfill`, which throws outside an extension.
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

// `renderToStaticMarkup` escapes the apostrophe; decode it so the assertions read
// as the text a user actually sees.
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
    // The action type is a developer identifier: it stays in the console.
    withNoBackgroundErrors();
    reportUiError('dispatch-failed', 'LOCK_VAULT_SAGA');

    const html = render();

    expect(html).toContain(
      "The wallet didn't respond. Your last action may not have been applied."
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
    expect(html).toContain("The wallet didn't respond");
  });
});
