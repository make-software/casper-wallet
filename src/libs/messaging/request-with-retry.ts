const FETCH_TIMEOUT_MS = 5000;
/** Targets the MV3 SW-restart race: a rejected sendMessage usually succeeds on re-send */
const RETRY_DELAYS_MS = [250, 500];

function withTimeout<T>(send: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Background request timed out')),
      FETCH_TIMEOUT_MS
    );

    send().then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export async function requestWithRetry<T>(send: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) {
      await new Promise(resolve =>
        setTimeout(resolve, RETRY_DELAYS_MS[attempt - 1])
      );
    }

    try {
      return await withTimeout(send);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}
