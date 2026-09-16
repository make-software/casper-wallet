// One per document, like the transport it guards.
let inFlight: Promise<void> | null = null;

/**
 * Runs a Ledger connection attempt, joining the one in flight rather than
 * starting a second. `CasperLedgerService.connect` polls the device for a
 * minute with no way to stop, and a second poller's `getAppInfo` lands mid
 * signature and fails that exchange as a race. WALLET-1452.
 */
export function connectLedgerOnce(connect: () => Promise<void>): Promise<void> {
  if (inFlight) {
    return inFlight;
  }

  // Released on settle: a failed attempt must not lock out the retry.
  const attempt: Promise<void> = connect().finally(() => {
    if (inFlight === attempt) {
      inFlight = null;
    }
  });

  inFlight = attempt;

  return attempt;
}
