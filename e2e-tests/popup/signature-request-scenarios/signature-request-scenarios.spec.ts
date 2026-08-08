import {
  DEFAULT_FIRST_ACCOUNT,
  PLAYGROUND_URL,
  VALIDATOR_FOR_SIGNATURE_REQUEST
} from '../../constants';
import { popup, popupExpect } from '../../fixtures';

const waitForContentScript = async (page: any) => {
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(
    () => typeof (window as any).CasperWalletProvider !== 'undefined',
    null,
    { timeout: 10000 }
  );
};

popup.describe('Popup UI: signature request scenarios', () => {
  popup.beforeEach(async ({ connectAccounts, page }) => {
    await connectAccounts();
    // need to wait for the connection status modal to disappear
    await page.waitForTimeout(4000);
  });

  popup('should signing the transfer deploy', async ({ page, context }) => {
    await page.goto(PLAYGROUND_URL);
    await waitForContentScript(page);

    const [signatureRequestPage] = await Promise.all([
      context.waitForEvent('page', { timeout: 15000 }),
      page.getByRole('button', { name: 'Transfer' }).first().click()
    ]);

    await page.waitForTimeout(2000);

    await popupExpect(
      signatureRequestPage.getByRole('heading', { name: 'Signature Request' })
    ).toBeVisible();

    await popupExpect(signatureRequestPage.getByText('Transfer')).toBeVisible();

    await popupExpect(signatureRequestPage.getByText('0.1 CSPR')).toBeVisible();
    await popupExpect(
      signatureRequestPage.getByText('Transaction ID')
    ).toBeVisible();
    await popupExpect(signatureRequestPage.getByText('1234')).toBeVisible();

    const [dialog] = await Promise.all([
      page.waitForEvent('dialog', { timeout: 15000 }),
      signatureRequestPage.getByRole('button', { name: 'Sign' }).click()
    ]);

    popupExpect(dialog.message()).toContain('Sign successful');
    await dialog.accept();
  });

  popup('should signing the delegate deploy', async ({ page, context }) => {
    await page.goto(PLAYGROUND_URL);
    await waitForContentScript(page);

    const [signatureRequestPage] = await Promise.all([
      context.waitForEvent('page', { timeout: 15000 }),
      page.getByRole('button', { name: 'Delegate', exact: true }).click()
    ]);

    await page.waitForTimeout(2000);

    await popupExpect(
      signatureRequestPage.getByRole('heading', { name: 'Signature Request' })
    ).toBeVisible();

    await popupExpect(signatureRequestPage.getByText('Delegate')).toBeVisible();

    await popupExpect(
      signatureRequestPage.getByText(
        VALIDATOR_FOR_SIGNATURE_REQUEST.truncatedPublicKey
      )
    ).toBeVisible();

    await popupExpect(signatureRequestPage.getByText('2.5 CSPR')).toBeVisible();

    const [dialog] = await Promise.all([
      page.waitForEvent('dialog', { timeout: 15000 }),
      signatureRequestPage.getByRole('button', { name: 'Sign' }).click()
    ]);

    popupExpect(dialog.message()).toContain('Sign successful');
    await dialog.accept();
  });

  popup('should signing the undelegate deploy', async ({ page, context }) => {
    await page.goto(PLAYGROUND_URL);
    await waitForContentScript(page);

    const [signatureRequestPage] = await Promise.all([
      context.waitForEvent('page', { timeout: 15000 }),
      page.getByRole('button', { name: 'Undelegate', exact: true }).click()
    ]);

    await page.waitForTimeout(2000);

    await popupExpect(
      signatureRequestPage.getByRole('heading', { name: 'Signature Request' })
    ).toBeVisible();

    await popupExpect(
      signatureRequestPage.getByText('Undelegate')
    ).toBeVisible();

    await popupExpect(
      signatureRequestPage
        .getByText(DEFAULT_FIRST_ACCOUNT.truncatedPublicKey)
        .first()
    ).toBeVisible();

    await popupExpect(signatureRequestPage.getByText('2.5 CSPR')).toBeVisible();

    const [dialog] = await Promise.all([
      page.waitForEvent('dialog', { timeout: 15000 }),
      signatureRequestPage.getByRole('button', { name: 'Sign' }).click()
    ]);

    popupExpect(dialog.message()).toContain('Sign successful');
    await dialog.accept();
  });

  popup('should signing the redelegate deploy', async ({ page, context }) => {
    await page.goto(PLAYGROUND_URL);
    await waitForContentScript(page);

    const [signatureRequestPage] = await Promise.all([
      context.waitForEvent('page', { timeout: 15000 }),
      page.getByRole('button', { name: 'Redelegate', exact: true }).click()
    ]);

    await page.waitForTimeout(2000);

    await popupExpect(
      signatureRequestPage.getByRole('heading', { name: 'Signature Request' })
    ).toBeVisible();

    await popupExpect(
      signatureRequestPage.getByText('Redelegate')
    ).toBeVisible();

    await popupExpect(signatureRequestPage.getByText('2.5 CSPR')).toBeVisible();

    const [dialog] = await Promise.all([
      page.waitForEvent('dialog', { timeout: 15000 }),
      signatureRequestPage.getByRole('button', { name: 'Sign' }).click()
    ]);

    popupExpect(dialog.message()).toContain('Sign successful');
    await dialog.accept();
  });

  popup('should cancel the signing process', async ({ page, context }) => {
    await page.goto(PLAYGROUND_URL);
    await waitForContentScript(page);

    const [signatureRequestPage] = await Promise.all([
      context.waitForEvent('page', { timeout: 15000 }),
      page.getByRole('button', { name: 'Transfer' }).first().click()
    ]);
    await signatureRequestPage.waitForLoadState('domcontentloaded');

    const [dialog] = await Promise.all([
      page.waitForEvent('dialog', { timeout: 15000 }),
      signatureRequestPage.getByRole('button', { name: 'Cancel' }).click()
    ]);

    popupExpect(dialog.message()).toContain('Sign cancelled');
    await dialog.accept();
  });
});
