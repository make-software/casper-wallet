/** The slice of DMK the gate needs. Injected so it is testable without a device. */
export interface RefresherControl {
  disableDeviceSessionRefresher(args: {
    sessionId: string;
    blockerId: string;
  }): () => void;
}

export interface RefresherGate {
  /**
   * Lets the refresher run while at least one caller holds the returned release. Calling a
   * release more than once is a no-op.
   */
  beginObserving(): () => void;
  /** Suppresses the refresher for the span of `exchange`, including when it rejects. */
  duringExchange<T>(exchange: () => Promise<T>): Promise<T>;
  /** Drops every hold the gate is holding. */
  dispose(): void;
}

/**
 * Runs the device session's refresher only while its state is being observed, and never
 * during an exchange the caller initiated.
 */
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
