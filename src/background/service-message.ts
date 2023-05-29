import { ActionType, createAction } from 'typesafe-actions';

import { FetchBalanceResponse } from '@libs/services/balance-service';
import { AccountInfo } from '@libs/services/account-info';
import {
  ExtendedDeployResult,
  LedgerLiveDeploysResult
} from 'src/libs/services/account-activity-service';
import { PaginatedResponse } from '@libs/services/types';

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
  >(),
  fetchAccountActivityRequest: createAction('FETCH_ACCOUNT_ACTIVITY')<
    { publicKey: string; page: number },
    Meta
  >(),
  fetchAccountActivityResponse: createAction('FETCH_ACCOUNT_ACTIVITY_RESPONSE')<
    PaginatedResponse<LedgerLiveDeploysResult>,
    Meta
  >(),
  fetchExtendedDeploysInfoRequest: createAction('FETCH_EXTENDED_DEPLOYS_INFO')<
    { deployHash: string },
    Meta
  >(),
  fetchExtendedDeploysInfoResponse: createAction(
    'FETCH_EXTENDED_DEPLOYS_INFO_RESPONSE'
  )<ExtendedDeployResult, Meta>()
};

export type ServiceMessage = ActionType<typeof serviceMessage>;
