import { scryptAsync } from '@noble/hashes/scrypt';

import { createScryptOptions } from '@libs/crypto/hashing';
import { convertHexToBytes } from '@libs/crypto/utils';

interface ScryptEvent extends MessageEvent {
  data: {
    password: string;
    saltHash: string;
  };
}

onmessage = async function (event: ScryptEvent) {
  const { password, saltHash } = event.data;

  try {
    const key = await scryptAsync(
      password,
      convertHexToBytes(saltHash),
      createScryptOptions()
    );

    postMessage({ key });
  } catch (error) {
    // a rejection inside an async onmessage raises no error event on the parent
    // Worker, so the failure has to travel back as a message
    console.error(error);
    postMessage({ error: true });
  }
};
