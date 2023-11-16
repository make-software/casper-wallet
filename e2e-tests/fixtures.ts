import {
  test as base,
  chromium,
  type BrowserContext,
  Page
} from '@playwright/test';
import path from 'path';

import { PLAYGROUND_URL, vaultPassword } from './common';

const getBrowserConfig = () => {
  switch (process.env.PLAYWRIGHT_BROWSER) {
    case 'chromium': {
      return {
        browser: 'chrome',
        manifest: 3
      };
    }
    case 'firefox': {
      return {
        browser: 'firefox',
        manifest: 2
      };
    }
    default: {
      return {
        browser: 'chrome',
        manifest: 3
      };
    }
  }
};

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
  createPassword: () => Promise<void>;
}>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const { browser } = getBrowserConfig();
    const pathToExtension = path.join(__dirname, `../build/${browser}`);
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--headless=new`,
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`
      ]
    });

    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    const { manifest } = getBrowserConfig();
    let background;

    if (manifest === 3) {
      [background] = context.serviceWorkers();

      if (!background) {
        background = await context.waitForEvent('serviceworker');
      }
    } else {
      [background] = context.backgroundPages();

      if (!background) {
        background = await context.waitForEvent('backgroundpage');
      }
    }

    const extensionId = background.url().split('/')[2];

    await use(extensionId);
  },
  createPassword: async ({ page }, use) => {
    const createPassword = async () => {
      await page
        .getByPlaceholder('Password', { exact: true })
        .fill(vaultPassword);
      await page
        .getByPlaceholder('Confirm password', { exact: true })
        .fill(vaultPassword);
      await page.getByTestId('terms-checkbox').click();
      await page.getByRole('button', { name: 'Create password' }).click();
    };

    await use(createPassword);
  }
});

export const onboarding = test.extend<{
  page: Page;
  createOnboardingPassword: () => Promise<void>;
  createSecretPhrase: () => Promise<void>;
  copySecretPhrase: () => Promise<string[]>;
  confirmSecretPhraseSuccess: (phrase: string[]) => Promise<void>;
  confirmSecretPhraseFailure: (phrase: string[]) => Promise<void>;
}>({
  page: async ({ extensionId, page }, use) => {
    await page.goto(`chrome-extension://${extensionId}/onboarding.html`);
    await use(page);
  },
  createOnboardingPassword: async ({ page, createPassword }, use) => {
    const createOnboardingPassword = async () => {
      await onboardingExpect(
        page.getByRole('heading', {
          name: 'Ready to create your new wallet?'
        })
      ).toBeVisible();

      await page.getByRole('button', { name: 'Get started' }).click();

      await onboardingExpect(page).toHaveURL(/.*create-vault-password/);

      // Create password
      await createPassword();
    };

    await use(createOnboardingPassword);
  },
  createSecretPhrase: async ({ page }, use) => {
    const createSecretPhrase = async () => {
      await onboardingExpect(
        page.getByText('Create secret recovery phrase')
      ).toBeVisible();

      await page
        .getByRole('button', { name: 'Create my secret recovery phrase' })
        .click();

      await onboardingExpect(
        page.getByText(
          'Before we generate your secret recovery phrase, please remember'
        )
      ).toBeVisible();

      await page
        .getByText(
          'I understand that I am solely responsible for storing and protecting my secret recovery phrase. Access to my funds depend on it.'
        )
        .click();

      await page.getByRole('button', { name: 'Next' }).click();
    };

    await use(createSecretPhrase);
  },
  copySecretPhrase: async ({ page }, use) => {
    const copySecretPhrase = async () => {
      await onboardingExpect(
        page.getByText('Write down your secret recovery phrase')
      ).toBeVisible();

      await page.getByText('Copy secret recovery phrase').click();

      const copiedPhrase = await page.evaluate(() =>
        navigator.clipboard.readText()
      );
      const phrase = copiedPhrase.split(' ');

      onboardingExpect(phrase.length).toEqual(24);

      await page
        .getByText(
          'I confirm I have written down and securely stored my secret recovery phrase'
        )
        .click();

      await page.getByRole('button', { name: 'Next' }).click();

      return phrase;
    };

    await use(copySecretPhrase);
  },
  confirmSecretPhraseSuccess: async ({ page }, use) => {
    const confirmSecretPhraseSuccess = async (phrase: string[]) => {
      await onboardingExpect(
        page.getByText('Confirm your secret recovery phrase')
      ).toBeVisible();
      onboardingExpect(
        page.getByRole('button', { name: 'Confirm' }).isDisabled()
      );

      const wordPicker = page.getByTestId('word-picker');
      const visibleWords = (
        await page.getByTestId('word-list').innerText()
      ).split('\n');

      const hiddenWords = phrase.filter(
        word => !visibleWords.includes(word) && isNaN(Number(word))
      );

      for (let i = 0; i < phrase.length; i++) {
        const word = phrase[i];

        if (hiddenWords.includes(word)) {
          await wordPicker.getByText(word, { exact: true }).click();
        }
      }

      onboardingExpect(
        page.getByRole('button', { name: 'Confirm' }).isEnabled()
      );

      await page.getByRole('button', { name: 'Confirm' }).click();
    };

    await use(confirmSecretPhraseSuccess);
  },
  confirmSecretPhraseFailure: async ({ page }, use) => {
    const confirmSecretPhraseFailure = async (phrase: string[]) => {
      await onboardingExpect(
        page.getByText('Confirm your secret recovery phrase')
      ).toBeVisible();
      onboardingExpect(
        page.getByRole('button', { name: 'Confirm' }).isDisabled()
      );

      const wordPicker = page.getByTestId('word-picker');
      const pickerWords = (await wordPicker.innerText()).split('\n');

      for (let i = phrase.length; i > 0; i--) {
        const word = phrase[i];

        if (pickerWords.includes(word)) {
          await wordPicker.getByText(word, { exact: true }).click();
        }
      }

      onboardingExpect(
        page.getByRole('button', { name: 'Confirm' }).isEnabled()
      );

      await page.getByRole('button', { name: 'Confirm' }).click();
    };

    await use(confirmSecretPhraseFailure);
  }
});

export const onboardingExpect = onboarding.expect;

export const popup = test.extend<{
  popupPage: Page;
  unlockVault: (popupPage?: Page) => Promise<void>;
  lockVault: () => Promise<void>;
  createAccount: (newAccountName: string) => Promise<void>;
  connectAccounts: () => Promise<void>;
}>({
  popupPage: async ({ extensionId, page }, use) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await use(page);
  },
  unlockVault: async ({ page }, use) => {
    const unlockVault = async (popupPage?: Page) => {
      const currentPage = popupPage || page;

      await currentPage
        .getByPlaceholder('Password', { exact: true })
        .fill(vaultPassword);
      await currentPage.getByRole('button', { name: 'Unlock wallet' }).click();
    };

    await use(unlockVault);
  },
  lockVault: async ({ page }, use) => {
    const lockVault = async () => {
      await page.getByTestId('menu-open-icon').click();
      await page.getByText('Lock wallet').click();
    };

    await use(lockVault);
  },
  createAccount: async ({ page }, use) => {
    const createAccount = async (newAccountName: string) => {
      await page.getByTestId('menu-open-icon').click();
      await page.getByText('Create account').click();

      await page
        .getByPlaceholder('Account name', { exact: true })
        .fill(newAccountName);
      await page.getByRole('button', { name: 'Create account' }).click();
    };

    await use(createAccount);
  },
  connectAccounts: async ({ page, unlockVault, context }, use) => {
    const connectAccounts = async () => {
      await page.goto(PLAYGROUND_URL);

      const [connectAccountPage] = await Promise.all([
        context.waitForEvent('page'),
        page.getByRole('button', { name: 'Connect', exact: true }).click()
      ]);

      await unlockVault(connectAccountPage);

      await connectAccountPage.getByText('select all', { exact: true }).click();

      await connectAccountPage.getByRole('button', { name: 'Next' }).click();
      await connectAccountPage
        .getByRole('button', { name: 'Connect to 2 accounts' })
        .click();
    };

    await use(connectAccounts);
  }
});

export const popupExpect = popup.expect;
