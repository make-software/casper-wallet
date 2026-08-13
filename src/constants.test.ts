import { CasperNetworkName } from 'casper-js-sdk';

import {
  NetworkName,
  NetworkSetting,
  chainNameToNetworkSettingsMap,
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
