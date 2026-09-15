import * as matchers from 'redux-saga-test-plan/matchers';
import { combineReducers } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';
import { throwError } from 'redux-saga-test-plan/providers';

import { NetworkSetting, getCasperNetwork } from '@src/constants';

import { sagaError } from '@background/redux/app-events/actions';
import {
  activeNetworkSettingChanged,
  casperNetworkApiVersionChanged
} from '@background/redux/settings/actions';
import { reducer as settingsReducer } from '@background/redux/settings/reducer';
import {
  selectActiveNetworkSetting,
  selectCasperNetworkApiVersion,
  selectIsCasper2Network
} from '@background/redux/settings/selectors';
import { casperTransactionsRepository } from '@background/signing-repositories';

import { unlockVault } from './actions';
import { watchCasper2NetworkSaga } from './check-casper2-network-saga';

const combinedReducer = () =>
  combineReducers({ settings: settingsReducer }) as never;

describe('watchCasper2NetworkSaga', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Matrix row: Unlock.
  it('dispatches the resolved api version on unlockVault', async () => {
    jest
      .spyOn(casperTransactionsRepository, 'getNetworkApiVersion')
      .mockResolvedValue('1.5.8');

    await expectSaga(watchCasper2NetworkSaga)
      .provide([
        [
          matchers.select.selector(selectActiveNetworkSetting),
          NetworkSetting.Testnet
        ]
      ])
      .call(
        [casperTransactionsRepository, 'getNetworkApiVersion'],
        getCasperNetwork(NetworkSetting.Testnet)
      )
      .put(casperNetworkApiVersionChanged('1.5.8'))
      .dispatch(
        unlockVault({
          vault: {} as never,
          newKeyDerivationSaltHash: 'salt',
          newVaultCipher: 'cipher',
          newEncryptionKeyHash: 'key-hash'
        })
      )
      .silentRun(50);
  });

  // Matrix row: Network switch.
  it('dispatches the resolved api version for the new network on activeNetworkSettingChanged', async () => {
    jest
      .spyOn(casperTransactionsRepository, 'getNetworkApiVersion')
      .mockResolvedValue('2.0.0');

    await expectSaga(watchCasper2NetworkSaga)
      .provide([
        [
          matchers.select.selector(selectActiveNetworkSetting),
          NetworkSetting.Devnet
        ]
      ])
      .call(
        [casperTransactionsRepository, 'getNetworkApiVersion'],
        getCasperNetwork(NetworkSetting.Devnet)
      )
      .put(casperNetworkApiVersionChanged('2.0.0'))
      .dispatch(activeNetworkSettingChanged(NetworkSetting.Devnet))
      .silentRun(50);
  });

  // Matrix row: Node unreachable — error dispatched, not thrown; no version put.
  it('dispatches sagaError and leaves the stored version alone when the RPC call throws', async () => {
    const { storeState, effects } = await expectSaga(watchCasper2NetworkSaga)
      .withReducer(combinedReducer())
      .provide([
        [
          matchers.select.selector(selectActiveNetworkSetting),
          NetworkSetting.Mainnet
        ],
        [
          matchers.call.fn(casperTransactionsRepository.getNetworkApiVersion),
          throwError(new Error('node unreachable'))
        ]
      ])
      .put(
        sagaError({
          source: 'checkCasper2NetworkSaga',
          message: 'node unreachable'
        })
      )
      .dispatch(activeNetworkSettingChanged(NetworkSetting.Mainnet))
      .silentRun(50);

    // Untouched pre-2.0 default: the failure path leaves it in place.
    expect(selectCasperNetworkApiVersion(storeState)).toBe('1.5.8');
    const putTypes = (effects.put ?? []).map(
      (e: { payload: { action: { type: string } } }) => e.payload.action.type
    );
    expect(putTypes).not.toContain(casperNetworkApiVersionChanged.type);
  });

  // Matrix row: Derived flag — a '2.0.0' response flips selectIsCasper2Network.
  it('flips selectIsCasper2Network to true once a 2.x api version is stored', async () => {
    jest
      .spyOn(casperTransactionsRepository, 'getNetworkApiVersion')
      .mockResolvedValue('2.0.0');

    const { storeState } = await expectSaga(watchCasper2NetworkSaga)
      .withReducer(combinedReducer())
      .provide([
        [
          matchers.select.selector(selectActiveNetworkSetting),
          NetworkSetting.Mainnet
        ]
      ])
      .dispatch(activeNetworkSettingChanged(NetworkSetting.Mainnet))
      .silentRun(50);

    expect(selectIsCasper2Network(storeState)).toBe(true);
  });
});
