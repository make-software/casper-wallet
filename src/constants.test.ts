import { CasperNetworkName } from 'casper-js-sdk';

import {
  AuctionManagerEntryPoint,
  NetworkName,
  NetworkSetting,
  chainNameToNetworkSettingsMap,
  coreAuctionEntryPointMap,
  networkNameToSdkNetworkNameMap
} from './constants';

/**
 * WALLET-1381 stopped sourcing these chain names from the `CasperNetworkName`
 * enum — a value import pulled `casper-js-sdk` onto every page entry's startup
 * path — and spelled the four strings out by hand.
 *
 * The `` `${CasperNetworkName}` `` annotation catches a typo but is the union of
 * all four values, so any *mis-pairing* still compiles:
 * `[NetworkName.Mainnet]: 'casper-test'` type-checks and no test read either
 * map. These values are signed into deploys, so a permutation means a mainnet
 * transfer signed for `casper-test`.
 */
describe('network name maps', () => {
  const NETWORKS = Object.values(NetworkName);

  it('covers every NetworkName', () => {
    // Guards the loops below against silently iterating nothing.
    expect(NETWORKS).toHaveLength(4);
  });

  it.each([
    [NetworkName.Mainnet, CasperNetworkName.Mainnet, NetworkSetting.Mainnet],
    [NetworkName.Testnet, CasperNetworkName.Testnet, NetworkSetting.Testnet],
    [NetworkName.Devnet, CasperNetworkName.DevNet, NetworkSetting.Devnet],
    [
      NetworkName.Integration,
      CasperNetworkName.Integration,
      NetworkSetting.Integration
    ]
  ])(
    'maps %s to the right chain name and back',
    (network, chainName, setting) => {
      expect(networkNameToSdkNetworkNameMap[network]).toBe(chainName);
      expect(chainNameToNetworkSettingsMap[chainName]).toBe(setting);
    }
  );

  it('assigns a distinct chain name to each network', () => {
    // A permutation that duplicated a value would still satisfy the pairing
    // above for the survivor, and go unnoticed for the shadowed network.
    const chainNames = NETWORKS.map(n => networkNameToSdkNetworkNameMap[n]);

    expect(new Set(chainNames).size).toBe(NETWORKS.length);
  });
});

/**
 * The type system cannot check the pairing: `Record<enum, Union>` enforces exhaustive keys and a
 * member of the union, not that `delegate` maps to `'DELEGATE'`. Mapping it to `'UNDELEGATE'` is
 * a one-token edit that type-checks and moves the stake the opposite way from the confirmed
 * screen — the deploy the Ledger shows is a contract call either way.
 */
describe('coreAuctionEntryPointMap', () => {
  it('delegates on delegate', () => {
    expect(coreAuctionEntryPointMap[AuctionManagerEntryPoint.delegate]).toBe(
      'DELEGATE'
    );
  });

  it('undelegates on undelegate', () => {
    expect(coreAuctionEntryPointMap[AuctionManagerEntryPoint.undelegate]).toBe(
      'UNDELEGATE'
    );
  });

  it('redelegates on redelegate', () => {
    expect(coreAuctionEntryPointMap[AuctionManagerEntryPoint.redelegate]).toBe(
      'REDELEGATE'
    );
  });

  it('never sends two stake types to the same entry point', () => {
    const entryPoints = Object.values(AuctionManagerEntryPoint).map(
      stakeType => coreAuctionEntryPointMap[stakeType]
    );

    expect(new Set(entryPoints).size).toBe(entryPoints.length);
  });
});
