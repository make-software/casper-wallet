import {
  type BrowserContext,
  Page,
  test as base,
  chromium
} from '@playwright/test';
import path from 'path';

import {
  DEFAULT_FIRST_ACCOUNT,
  PLAYGROUND_URL,
  newPassword,
  vaultPassword
} from './constants';

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    // For now playwright only support chrome extensions
    // https://github.com/microsoft/playwright/issues/7297
    const pathToExtension = path.join(__dirname, `../build/chrome`);
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
    let [background] = context.serviceWorkers();

    if (!background) {
      background = await context.waitForEvent('serviceworker');
    }

    const extensionId = background.url().split('/')[2];

    await use(extensionId);
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
  createOnboardingPassword: async ({ page }, use) => {
    const createOnboardingPassword = async () => {
      await onboardingExpect(
        page.getByRole('heading', {
          name: 'Ready to create your new wallet?'
        })
      ).toBeVisible();

      await page.getByRole('button', { name: 'Get started' }).click();

      await onboardingExpect(page).toHaveURL(/.*create-vault-password/);

      await page
        .getByPlaceholder('Password', { exact: true })
        .fill(vaultPassword);
      await page
        .getByPlaceholder('Confirm password', { exact: true })
        .fill(vaultPassword);
      await page.getByTestId('terms-checkbox').click();
      await page.getByRole('button', { name: 'Create password' }).click();
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
  addContact: () => Promise<void>;
  providePassword: (popupPage?: Page) => Promise<void>;
  passwordTimeout: (popupPage?: Page) => Promise<void>;
  changePassword: (popupPage?: Page) => Promise<void>;
  provideNewPassword: (popupPage?: Page) => Promise<void>;
  unlockVaultNewPassword: (popupPage?: Page) => Promise<void>;
  passwordDontMatch: (popupPage?: Page) => Promise<void>;
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
      await page.waitForSelector('text=Total balance', {
        state: 'visible',
        timeout: 20000
      });
    };

    await use(unlockVault);
  },
  unlockVaultNewPassword: async ({ page }, use) => {
    const unlockVaultNewPassword = async (popupPage?: Page) => {
      const currentPage = popupPage || page;

      await currentPage
        .getByPlaceholder('Password', { exact: true })
        .fill(newPassword);
      await currentPage.getByRole('button', { name: 'Unlock wallet' }).click();
    };

    await use(unlockVaultNewPassword);
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
  },
  addContact: async ({ page }, use) => {
    const addContact = async () => {
      await page.getByTestId('menu-open-icon').click();
      await page.getByText('Contacts').click();

      await page.getByRole('button', { name: 'Add contact' }).click();

      await page
        .getByPlaceholder('Name', { exact: true })
        .fill(DEFAULT_FIRST_ACCOUNT.accountName);
      await page
        .getByPlaceholder('Public key', { exact: true })
        .fill(DEFAULT_FIRST_ACCOUNT.publicKey);

      await page.getByRole('button', { name: 'Add contact' }).click();

      await page.getByRole('button', { name: 'Done' }).click();
    };

    await use(addContact);
  },

  providePassword: async ({ page }, use) => {
    const providePassword = async (popupPage?: Page) => {
      const currentPage = popupPage || page;

      await currentPage
        .getByPlaceholder('Password', { exact: true })
        .fill(vaultPassword);
      await currentPage.getByRole('button', { name: 'Continue' }).click();
    };

    await use(providePassword);
  },
  provideNewPassword: async ({ page }, use) => {
    const provideNewPassword = async (popupPage?: Page) => {
      const currentPage = popupPage || page;

      await currentPage
        .getByPlaceholder('Password', { exact: true })
        .fill(newPassword);
      await currentPage.getByRole('button', { name: 'Continue' }).click();
    };

    await use(provideNewPassword);
  },
  changePassword: async ({ page }, use) => {
    const changePassword = async (popupPage?: Page) => {
      const currentPage = popupPage || page;

      await currentPage
        .getByPlaceholder('Password', { exact: true })
        .fill(newPassword);
      await currentPage.getByPlaceholder('Confirm password').fill(newPassword);

      await currentPage.getByRole('button', { name: 'Continue' }).click();

      await page.waitForTimeout(2000);
    };

    await use(changePassword);
  },
  passwordDontMatch: async ({ page }, use) => {
    const changePassword = async (popupPage?: Page) => {
      const currentPage = popupPage || page;

      await currentPage
        .getByPlaceholder('Password', { exact: true })
        .fill(newPassword);
      await currentPage
        .getByPlaceholder('Confirm password')
        .fill(vaultPassword);

      await currentPage.getByRole('button', { name: 'Continue' }).click();

      await page.waitForTimeout(2000);
    };

    await use(changePassword);
  },

  passwordTimeout: async ({ page }, use) => {
    const passwordTimeout = async (popupPage?: Page) => {
      const currentPage = popupPage || page;

      await currentPage
        .getByPlaceholder('Password', { exact: true })
        .fill('wrong password');

      for (let i = 0; i < 5; i++) {
        await currentPage.getByRole('button', { name: 'Continue' }).click();
      }
    };

    await use(passwordTimeout);
  }
});
export const popupExpect = popup.expect;
