import { hashPassword, verifyPassword } from './password';
import { VAULT_PASSWORD } from './__fixtures';

it('verifyPassword fn should correctly verify hashed passwords', async () => {
  const passwordHash = await hashPassword(VAULT_PASSWORD);
  const result = await verifyPassword(VAULT_PASSWORD, passwordHash);
  expect(result).toBeTruthy();
});
