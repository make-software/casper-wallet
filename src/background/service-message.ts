import { ActionType, createAction } from 'typesafe-actions';

import { FetchBalanceResponse } from '@libs/services/balance-service';
import { AccountInfo } from '@libs/services/account-info';

type Meta = void;

export const serviceMessage = {
  fetchBalanceRequest: createAction('FETCH_ACCOUNT_BALANCE')<
    { publicKey: string },
    Meta
  >(),
  fetchBalanceResponse: createAction('FETCH_ACCOUNT_BALANCE_RESPONSE')<
    FetchBalanceResponse,
    Meta
  >(),
  fetchAccountInfoRequest: createAction('FETCH_ACCOUNT_INFO')<
    { accountHash: string },
    Meta
  >(),
  fetchAccountInfoResponse: createAction('FETCH_ACCOUNT_INFO_RESPONSE')<
    AccountInfo,
    Meta
  >()
};

export type ServiceMessage = ActionType<typeof serviceMessage>;
