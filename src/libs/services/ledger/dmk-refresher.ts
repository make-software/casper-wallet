/** The slice of DMK the gate needs. Injected so it is testable without a device. */
export interface RefresherControl {
  disableDeviceSessionRefresher(args: {
    sessionId: string;
    blockerId: string;
  }): () => void;
}

export interface RefresherGate {
  /** Runs the refresher while a caller holds the returned release; releasing twice is a no-op. */
  beginObserving(): () => void;
  /** Suppresses the refresher for the span of `exchange`, including when it rejects. */
  duringExchange<T>(exchange: () => Promise<T>): Promise<T>;
  dispose(): void;
}

/** Runs the refresher only while device state is observed, and never during an exchange. */
export function createRefresherGate(
  dmk: RefresherControl,
  sessionId: string
): RefresherGate {
  const block = (blockerId: string) =>
    dmk.disableDeviceSessionRefresher({ sessionId, blockerId });

  let unobserved: (() => void) | undefined = block('unobserved');
  let observers = 0;
  const exchangeReleases = new Set<() => void>();

  return {
    beginObserving() {
      if (++observers === 1) {
        unobserved?.();
        unobserved = undefined;
      }

      let released = false;

      return () => {
        if (released) return;

        released = true;

        if (--observers === 0) unobserved = block('unobserved');
      };
    },
    async duringExchange(exchange) {
      const release = block('exchange');
      exchangeReleases.add(release);

      try {
        return await exchange();
      } finally {
        exchangeReleases.delete(release);
        release();
      }
    },
    dispose() {
      unobserved?.();
      unobserved = undefined;
      observers = 0;
      exchangeReleases.forEach(release => release());
      exchangeReleases.clear();
    }
  };
}
