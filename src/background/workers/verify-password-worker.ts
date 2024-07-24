import { verifyPasswordAgainstHash } from '@libs/crypto/hashing';

interface VerifyPasswordEvent extends MessageEvent {
  data: {
    passwordHash: string;
    passwordSaltHash: string;
    password: string;
  };
}

onmessage = async (event: VerifyPasswordEvent) => {
  const { passwordHash, passwordSaltHash, password } = event.data;
  const isPasswordCorrect = await verifyPasswordAgainstHash(
    passwordHash,
    passwordSaltHash,
    password
  );

  postMessage({
    isPasswordCorrect
  });
};
