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

  try {
    const isPasswordCorrect = await verifyPasswordAgainstHash(
      passwordHash,
      passwordSaltHash,
      password
    );

    postMessage({
      isPasswordCorrect
    });
  } catch (error) {
    // a rejection inside an async onmessage raises no error event on the parent
    // Worker, so the failure has to travel back as a message
    console.error(error);
    postMessage({ error: true });
  }
};
