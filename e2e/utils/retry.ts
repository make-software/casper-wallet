interface RetryArgs {
  retries: number;
  delay?: number;
  rejectionMessage?: string;
}

export async function retry(
  { retries, delay = 0, rejectionMessage = 'Retry limit reached' }: RetryArgs,
  functionToRetry: () => void
): Promise<null | Error> {
  let attempts = 0;
  while (attempts <= retries) {
    if (attempts > 0 && delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    try {
      await functionToRetry();
      return null;
    } catch (error) {
      console.error(error);
    } finally {
      attempts += 1;
    }
  }

  throw new Error(rejectionMessage);
}
