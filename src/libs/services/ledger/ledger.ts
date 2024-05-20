import Transport from '@ledgerhq/hw-transport';
import { blake2b } from '@noble/hashes/blake2b';
import LedgerCasperApp from '@zondax/ledger-casper';
import { ResponseSign } from '@zondax/ledger-casper/src/types';
import { Buffer } from 'buffer';
import { DeployUtil } from 'casper-js-sdk';
import {
  BehaviorSubject,
  Observable,
  Observer,
  debounceTime,
  distinct
} from 'rxjs';

import { getBip44Path } from '@libs/crypto';

import {
  ILedgerEvent,
  LedgerAccount,
  LedgerAccountsOptions,
  LedgerEventStatus,
  SignResult
} from './types';

const CONNECTION_TIMEOUT_MS = 60000;
const CONNECTION_POLL_INTERVAL = 3000;

export class LedgerError extends Error {
  constructor(LedgerEventStatus: ILedgerEvent) {
    super(JSON.stringify(LedgerEventStatus));
  }
}

export class Ledger {
  cachedAccounts: LedgerAccount[] = [];

  #transport: Transport | null = null;
  #isBluetoothTransport: boolean = false;
  #ledgerApp: LedgerCasperApp | null = null;
  #ledgerConnected = false;
  #allowReconnect: boolean = true;
  #LedgerEventStatussSubject = new BehaviorSubject<ILedgerEvent>({
    status: LedgerEventStatus.Disconnected
  });

  subscribeToLedgerEventStatuss = (onData: (evt: ILedgerEvent) => void) =>
    this.#LedgerEventStatussSubject.pipe(debounceTime(300)).subscribe(onData);

  /** @throws {LedgerError} */
  async connect(
    transportCreator: () => Promise<Transport>,
    checkTransportAvailability: () => Promise<boolean>,
    isBluetoothTransport = false
  ): Promise<void> {
    this.#isBluetoothTransport = isBluetoothTransport;

    return new Promise(async (resolve, reject) => {
      const available = await checkTransportAvailability();

      if (!available) {
        const evt = { status: LedgerEventStatus.NotAvailable };
        this.#LedgerEventStatussSubject.next(evt);
        reject(new LedgerError(evt));
      }

      const connectionObserver: Observer<ILedgerEvent> = {
        next: data => {
          this.#LedgerEventStatussSubject.next(data);

          if (
            data.status === LedgerEventStatus.Timeout ||
            data.status === LedgerEventStatus.ErrorOpeningDevice
          ) {
            reject(new LedgerError(data));
          }
        },
        error: () => {
          const evt: ILedgerEvent = {
            status: LedgerEventStatus.ErrorOpeningDevice
          };
          this.#LedgerEventStatussSubject.next(evt);
          reject(new LedgerError(evt));
        },
        complete: async () => {
          resolve();
        }
      };

      try {
        this.#transport = await transportCreator();
        this.#transport?.on('disconnect', this.#onDisconnect);
        this.#ledgerApp = new LedgerCasperApp(this.#transport);
      } catch (e) {
        if (!this.#transport) {
          const evt = { status: LedgerEventStatus.LedgerPermissionRequired };
          this.#LedgerEventStatussSubject.next(evt);
          reject(new LedgerError(evt));
          return;
        }
      }

      this.#connectToLedger(transportCreator, connectionObserver);
    });
  }

  async disconnect(): Promise<boolean> {
    if (this.#ledgerConnected) {
      try {
        await this.#transport?.close();
        this.#LedgerEventStatussSubject.next({
          status: LedgerEventStatus.Disconnected
        });
      } catch (err: any) {
        console?.error(
          'Error disconnecting from ledger: ' + err.name + ' - ' + err.message
        );
      }

      this.#ledgerConnected = false;
    }

    this.cachedAccounts = [];

    return true;
  }

  get isConnected(): boolean {
    return this.#ledgerConnected;
  }

  async checkAppInfo(): Promise<LedgerEventStatus | null> {
    if (this.#ledgerConnected && this.#ledgerApp) {
      const appInfo = await this.#ledgerApp?.getAppInfo();

      await this.#processDelayAfterAction();

      if (appInfo.returnCode === 65535) {
        return LedgerEventStatus.WaitingToSignPrevDeploy;
      }

      return appInfo.returnCode === 0x9000 && appInfo.appName === 'Casper'
        ? null
        : LedgerEventStatus.WaitingResponseFromDevice;
    }

    return LedgerEventStatus.WaitingResponseFromDevice;
  }

  /** @throws {LedgerError} message - ILedgerEvent JSON */
  getAccountList = async ({
    size,
    offset
  }: LedgerAccountsOptions): Promise<void> => {
    try {
      if (!this.#ledgerApp || !this.#ledgerConnected) return;

      this.#LedgerEventStatussSubject.next({
        status: LedgerEventStatus.LoadingAccountsList
      });

      const response = await this.#ledgerApp.getAddressAndPubKey(
        this.#getAccountPath(offset)
      );
      await this.#processDelayAfterAction();

      if (!response || response.returnCode !== 0x9000) {
        if (response?.returnCode === 0xffff || response.returnCode === 21781) {
          this.#LedgerEventStatussSubject.next({
            status: LedgerEventStatus.DeviceLocked
          });
        } else if (response?.returnCode === 0x6e01) {
          this.#LedgerEventStatussSubject.next({
            status: LedgerEventStatus.CasperAppNotLoaded
          });
        } else {
          this.#processError({ status: LedgerEventStatus.AccountListFailed });
        }
      }

      const publicKeys: string[] = [this.#encodePublicKey(response.publicKey)];

      for (let i = 1; i < size; i++) {
        const key = await this.#ledgerApp.getAddressAndPubKey(
          this.#getAccountPath(offset + i)
        );
        await this.#processDelayAfterAction();

        publicKeys.push(this.#encodePublicKey(key.publicKey));
      }

      const updatedAccountList = publicKeys.map<LedgerAccount>((pk, i) => ({
        publicKey: pk,
        index: offset + i
      }));

      this.#LedgerEventStatussSubject.next({
        status: LedgerEventStatus.AccountListUpdated,
        firstAcctIndex: offset,
        accounts: updatedAccountList
      });

      if (offset === this.cachedAccounts.length) {
        this.cachedAccounts.push(...updatedAccountList);
      }
    } catch (e) {
      if (e instanceof LedgerError) {
        throw e;
      } else {
        this.#processError({ status: LedgerEventStatus.AccountListFailed });
      }
    }
  };

  /** @throws {LedgerError} message - ILedgerEvent JSON */
  async singDeploy(
    deploy: DeployUtil.Deploy,
    account: Partial<LedgerAccount>
  ): Promise<SignResult> {
    try {
      if (account.index === undefined) {
        this.#processError({ status: LedgerEventStatus.InvalidIndex });
      }

      await this.#checkConnection(account.index);

      const deployHash = Buffer.from(deploy.hash).toString('hex');

      const devicePk =
        account.index !== undefined
          ? await this.#ledgerApp?.getAddressAndPubKey(
              this.#getAccountPath(account.index)
            )
          : undefined;
      await this.#processDelayAfterAction();

      if (!devicePk) {
        this.#processError({
          status: LedgerEventStatus.SignatureFailed,
          error: 'Could not retrieve key by index from device',
          publicKey: account.publicKey,
          deployHash
        });
      }

      const keyFromDevice: string = this.#encodePublicKey(devicePk.publicKey);

      if (account.publicKey !== keyFromDevice) {
        this.#processError({
          status: LedgerEventStatus.SignatureFailed,
          error:
            'Signing key not found on Ledger device. Signature process failed',
          publicKey: account.publicKey,
          deployHash
        });
      }

      const deployBytes = DeployUtil.deployToBytes(deploy);

      this.#LedgerEventStatussSubject.next({
        status: LedgerEventStatus.SignatureRequestedToUser,
        publicKey: account.publicKey,
        deployHash: deployHash
      });

      let result: ResponseSign;

      if (deploy.session.isModuleBytes()) {
        result = await this.#ledgerApp?.signWasmDeploy(
          this.#getAccountPath(account.index),
          Buffer.from(deployBytes)
        );
      } else {
        result = await this.#ledgerApp?.sign(
          this.#getAccountPath(account.index),
          Buffer.from(deployBytes)
        );
      }

      await this.#processDelayAfterAction();

      if (result.returnCode === 0x6986) {
        //transaction rejected
        this.#processError({
          status: LedgerEventStatus.SignatureCanceled,
          publicKey: account.publicKey,
          deployHash
        });
      }

      if (result.returnCode !== 0x9000) {
        this.#processError({
          status: LedgerEventStatus.SignatureFailed,
          error: result.errorMessage,
          publicKey: account.publicKey,
          deployHash
        });
      }

      // remove V byte if included
      const patchedSignature =
        result.signatureRSV.length > 64
          ? result.signatureRSV.subarray(0, 64)
          : result.signatureRSV;

      const signatureHex = `02${patchedSignature.toString('hex')}`;

      this.#LedgerEventStatussSubject.next({
        status: LedgerEventStatus.SignatureCompleted,
        publicKey: account.publicKey,
        deployHash,
        signatureHex
      });

      const prefix = new Uint8Array([0x02]);

      if (!signatureHex) {
        this.#processError({
          status: LedgerEventStatus.SignatureFailed,
          publicKey: account.publicKey,
          deployHash,
          error: `Empty signature`
        });
      }

      return {
        signatureHex,
        signature: new Uint8Array([...prefix, ...patchedSignature])
      };
    } catch (e) {
      if (e instanceof LedgerError) {
        throw e;
      } else {
        this.#processError({
          status: LedgerEventStatus.SignatureFailed,
          error: 'Unknown signature error'
        });
      }
    }
  }

  /** @throws {LedgerError} message - ILedgerEvent JSON */
  async signMessage(
    message: string,
    account: Partial<LedgerAccount>
  ): Promise<SignResult> {
    try {
      if (account.index === undefined) {
        this.#processError({ status: LedgerEventStatus.InvalidIndex });
      }

      await this.#checkConnection(account.index);

      const prefixedMessage = Buffer.from(
        `Casper Message:\n${message}`,
        'utf-8'
      );
      const hashedMessage = Buffer.from(
        blake2b(prefixedMessage, { dkLen: 32 })
      ).toString('hex');

      this.#LedgerEventStatussSubject.next({
        status: LedgerEventStatus.MsgSignatureRequestedToUser,
        publicKey: account.publicKey,
        message,
        msgHash: hashedMessage
      });

      this.#transport?.setExchangeTimeout(10000);

      const result: ResponseSign = await this.#ledgerApp?.signMessage(
        this.#getAccountPath(account.index),
        prefixedMessage
      );

      await this.#processDelayAfterAction();

      if (result.returnCode === 0x6986) {
        //transaction rejected
        this.#processError({ status: LedgerEventStatus.MsgSignatureCanceled });
      }

      if (result.returnCode !== 0x9000) {
        this.#processError({
          status: LedgerEventStatus.MsgSignatureFailed,
          error: `Error: ${result.errorMessage}`
        });
      }

      // remove V byte if included
      const patchedSignature =
        result.signatureRSV.length > 64
          ? result.signatureRSV.subarray(0, 64)
          : result.signatureRSV;

      this.#LedgerEventStatussSubject.next({
        status: LedgerEventStatus.MsgSignatureCompleted,
        publicKey: account.publicKey,
        message: message,
        msgHash: hashedMessage,
        signatureHex: patchedSignature.toString('hex')
      });

      return {
        signatureHex: patchedSignature.toString('hex'),
        signature: new Uint8Array(patchedSignature)
      };
    } catch (e) {
      if (e instanceof LedgerError) {
        throw e;
      } else {
        this.#processError({
          status: LedgerEventStatus.MsgSignatureFailed,
          error: 'Unknown msg signature error'
        });
      }
    }
  }

  #checkConnection = async (accountIndex?: number) => {
    let evt;

    if (Number.isNaN(Number(accountIndex))) {
      evt = { status: LedgerEventStatus.InvalidIndex };
    } else if (!this.#ledgerConnected) {
      evt = { status: LedgerEventStatus.CasperAppNotLoaded };
    } else {
      const status = await this.checkAppInfo();

      if (status) {
        evt = { status };
      }
    }

    if (evt) {
      this.#processError(evt);
    }
  };

  #onDisconnect = (evt: any) => {
    console.log('device disconnected.', evt);
    this.#ledgerConnected = false;
    this.#allowReconnect = false;
    this.cachedAccounts = [];
    this.#LedgerEventStatussSubject.next({
      status: LedgerEventStatus.Disconnected
    });
    this.#transport?.off('disconnect', this.#onDisconnect);
    this.#transport = null;

    setTimeout(() => {
      this.#allowReconnect = true;
    }, CONNECTION_POLL_INTERVAL * 1.2);
  };

  #getAccountPath = (acctIdx: number): string => getBip44Path(acctIdx);

  #encodePublicKey = (bytes: Uint8Array) =>
    '02' + Buffer.from(bytes).toString('hex');

  #connectToLedger(
    transportCreator: () => Promise<Transport>,
    observer: Observer<ILedgerEvent>
  ): void {
    const observable = new Observable<ILedgerEvent>(subscriber => {
      /** @return {boolean} is should stop retries */
      const retryConnection = async (): Promise<boolean> => {
        if (!this.#transport) {
          try {
            this.#transport = await transportCreator();
            this.#transport.on('disconnect', this.#onDisconnect);
            this.#ledgerApp = new LedgerCasperApp(this.#transport);
          } catch (error: any) {
            console.log('Error connecting to a Ledger device', error);
            subscriber.next({ status: LedgerEventStatus.ErrorOpeningDevice });

            return true;
          }
        }

        if (!this.#transport || !this.#ledgerApp) {
          console.debug('Cannot connect to device. Transport error');
          return false;
        }

        subscriber.next({
          status: LedgerEventStatus.WaitingResponseFromDevice
        });

        try {
          const appInfo = await this.#ledgerApp.getAppInfo();
          await this.#processDelayAfterAction();

          if (appInfo.returnCode === 0xffff || appInfo.returnCode === 21781) {
            subscriber.next({ status: LedgerEventStatus.DeviceLocked });

            return false;
          }

          if (appInfo.returnCode !== 0x9000) {
            // subscriber.next({ status: LedgerEventStatus.DeviceLocked });
            return false;
          }

          if (appInfo.appName !== 'Casper') {
            subscriber.next({ status: LedgerEventStatus.CasperAppNotLoaded });

            return false;
          }

          this.#ledgerConnected = true;
          subscriber.next({ status: LedgerEventStatus.Connected });

          return true;
        } catch (err) {
          console.error('-------- err', err);
        }

        return false;
      };

      retryConnection().then(async shouldStopRetries => {
        if (shouldStopRetries) {
          subscriber.complete();
        } else {
          let timeoutLoops = CONNECTION_TIMEOUT_MS / CONNECTION_POLL_INTERVAL;

          const timer = setInterval(async () => {
            if (--timeoutLoops <= 0) {
              clearInterval(timer);
              subscriber.next({ status: LedgerEventStatus.Timeout });
            } else if (!this.#allowReconnect) {
              console.debug('waiting before for a reconnection attempt');
              return;
            } else if (await retryConnection()) {
              clearInterval(timer);
              subscriber.complete();
            }
          }, CONNECTION_POLL_INTERVAL);
        }
      });
    });

    observable.pipe(distinct(({ status }) => status)).subscribe(observer);
  }

  /** @throws {LedgerError} message - ILedgerEvent JSON */
  #processError(evt: ILedgerEvent): never {
    this.#LedgerEventStatussSubject.next(evt);
    throw new LedgerError(evt);
  }

  /** Even though the Promise is resolved, bluetooth has not had time to process the messages
   * We need to wait a bit due to errors
   * */
  async #processDelayAfterAction() {
    if (this.#isBluetoothTransport) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
}

export const ledger = new Ledger();
