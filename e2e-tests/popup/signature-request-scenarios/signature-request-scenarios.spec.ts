import {
  DEFAULT_FIRST_ACCOUNT,
  NEW_VALIDATOR,
  PLAYGROUND_URL,
  VALIDATOR
} from '../../constants';
import { popup, popupExpect } from '../../fixtures';

popup.describe('Popup UI: signature request scenarios', () => {
  popup.beforeEach(async ({ connectAccounts, page }) => {
    await connectAccounts();
    // need to wait for the connection status modal to disappear
    await page.waitForTimeout(3000);
  });

  popup('should signing the transfer deploy', async ({ page, context }) => {
    await page.goto(PLAYGROUND_URL);

    const [signatureRequestPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: 'Transfer' }).click()
    ]);

    await popupExpect(
      signatureRequestPage.getByRole('heading', { name: 'Signature Request' })
    ).toBeVisible();

    await signatureRequestPage.getByText('Transfer Data').click();

    await popupExpect(
      signatureRequestPage.getByText('Transfer Call')
    ).toBeVisible();

    await popupExpect(
      signatureRequestPage.getByText('Recipient (Key)')
    ).toBeVisible();
    await popupExpect(
      signatureRequestPage.getByText(VALIDATOR.truncatedPublicKey)
    ).toBeVisible();
    await popupExpect(signatureRequestPage.getByText('Amount')).toBeVisible();
    await popupExpect(signatureRequestPage.getByText('2.5 CSPR')).toBeVisible();
    await popupExpect(
      signatureRequestPage.getByText('Transfer ID')
    ).toBeVisible();
    await popupExpect(signatureRequestPage.getByText('1234')).toBeVisible();

    page.on('dialog', async dialog => {
      popupExpect(dialog.message()).toContain('Sign successful');
      await dialog.accept();
    });

    await signatureRequestPage.getByRole('button', { name: 'Sign' }).click();
  });

  popup('should signing the delegate deploy', async ({ page, context }) => {
    await page.goto(PLAYGROUND_URL);

    const [signatureRequestPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: 'Delegate', exact: true }).click()
    ]);

    await popupExpect(
      signatureRequestPage.getByRole('heading', { name: 'Signature Request' })
    ).toBeVisible();

    await signatureRequestPage.getByText('Contract arguments').click();

    await popupExpect(
      signatureRequestPage.getByText('Contract Call')
    ).toBeVisible();

    await popupExpect(signatureRequestPage.getByText('delegate')).toBeVisible();

    await popupExpect(
      signatureRequestPage.getByText('Delegator')
    ).toBeVisible();
    await popupExpect(
      signatureRequestPage
        .getByText(DEFAULT_FIRST_ACCOUNT.truncatedPublicKey)
        .nth(2)
    ).toBeVisible();
    await popupExpect(
      signatureRequestPage.getByText(VALIDATOR.name)
    ).toBeVisible();
    await popupExpect(
      signatureRequestPage.getByText(VALIDATOR.truncatedPublicKey)
    ).toBeVisible();
    await popupExpect(signatureRequestPage.getByText('Amount')).toBeVisible();
    await popupExpect(
      signatureRequestPage.getByText('2.5 CSPR').nth(1)
    ).toBeVisible();

    page.on('dialog', async dialog => {
      popupExpect(dialog.message()).toContain('Sign successful');
      await dialog.accept();
    });

    await signatureRequestPage.getByRole('button', { name: 'Sign' }).click();
  });

  popup('should signing the undelegate deploy', async ({ page, context }) => {
    await page.goto(PLAYGROUND_URL);

    const [signatureRequestPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: 'Undelegate', exact: true }).click()
    ]);

    await popupExpect(
      signatureRequestPage.getByRole('heading', { name: 'Signature Request' })
    ).toBeVisible();

    await signatureRequestPage.getByText('Contract arguments').click();

    await popupExpect(
      signatureRequestPage.getByText('Contract Call')
    ).toBeVisible();

    await popupExpect(
      signatureRequestPage.getByText('undelegate')
    ).toBeVisible();

    await popupExpect(
      signatureRequestPage.getByText('Delegator')
    ).toBeVisible();
    await popupExpect(
      signatureRequestPage
        .getByText(DEFAULT_FIRST_ACCOUNT.truncatedPublicKey)
        .nth(2)
    ).toBeVisible();
    await popupExpect(
      signatureRequestPage.getByText(VALIDATOR.name)
    ).toBeVisible();
    await popupExpect(
      signatureRequestPage.getByText(VALIDATOR.truncatedPublicKey)
    ).toBeVisible();
    await popupExpect(signatureRequestPage.getByText('Amount')).toBeVisible();
    await popupExpect(signatureRequestPage.getByText('2.5 CSPR')).toBeVisible();

    page.on('dialog', async dialog => {
      popupExpect(dialog.message()).toContain('Sign successful');
      await dialog.accept();
    });

    await signatureRequestPage.getByRole('button', { name: 'Sign' }).click();
  });

  popup('should signing the redelegate deploy', async ({ page, context }) => {
    await page.goto(PLAYGROUND_URL);

    const [signatureRequestPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: 'Redelegate', exact: true }).click()
    ]);

    await popupExpect(
      signatureRequestPage.getByRole('heading', { name: 'Signature Request' })
    ).toBeVisible();

    await signatureRequestPage.getByText('Contract arguments').click();

    await popupExpect(
      signatureRequestPage.getByText('Contract Call')
    ).toBeVisible();

    await popupExpect(
      signatureRequestPage.getByText('redelegate')
    ).toBeVisible();

    await popupExpect(
      signatureRequestPage.getByText('Delegator')
    ).toBeVisible();
    await popupExpect(
      signatureRequestPage
        .getByText(DEFAULT_FIRST_ACCOUNT.truncatedPublicKey)
        .nth(2)
    ).toBeVisible();
    await popupExpect(
      signatureRequestPage.getByText(VALIDATOR.name, { exact: true })
    ).toBeVisible();
    await popupExpect(
      signatureRequestPage.getByText(VALIDATOR.truncatedPublicKey)
    ).toBeVisible();
    await popupExpect(signatureRequestPage.getByText('Amount')).toBeVisible();
    await popupExpect(signatureRequestPage.getByText('2.5 CSPR')).toBeVisible();
    await popupExpect(
      signatureRequestPage.getByText(NEW_VALIDATOR.name)
    ).toBeVisible();
    await popupExpect(
      signatureRequestPage.getByText(NEW_VALIDATOR.truncatedPublicKey)
    ).toBeVisible();

    page.on('dialog', async dialog => {
      popupExpect(dialog.message()).toContain('Sign successful');
      await dialog.accept();
    });

    await signatureRequestPage.getByRole('button', { name: 'Sign' }).click();
  });

  popup('should cancel the signing process', async ({ page, context }) => {
    await page.goto(PLAYGROUND_URL);

    const [signatureRequestPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: 'Transfer' }).click()
    ]);

    page.on('dialog', async dialog => {
      popupExpect(dialog.message()).toContain('Sign cancelled');
      await dialog.accept();
    });

    await signatureRequestPage.getByRole('button', { name: 'Cancel' }).click();
  });
});
