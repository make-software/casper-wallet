import { Page } from '@playwright/test';
import { vaultPassword } from './constants';

export const createPassword = async (page: Page) => {
  await page.getByPlaceholder('Password', { exact: true }).fill(vaultPassword);
  await page
    .getByPlaceholder('Confirm password', { exact: true })
    .fill(vaultPassword);
  await page.getByTestId('terms-checkbox').click();
  await page.getByRole('button', { name: 'Create password' }).click();
};
