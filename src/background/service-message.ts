import { ActionType, createAction } from 'typesafe-actions';

import { FetchBalanceResponse } from '@libs/services/balance-service';

type Meta = void;

export const serviceMessage = {
  fetchBalanceRequest: createAction('FETCH_ACCOUNT_BALANCE')<
    { publicKey: string },
    Meta
  >(),
  fetchBalanceResponse: createAction('FETCH_ACCOUNT_BALANCE_RESPONSE')<
    FetchBalanceResponse,
    Meta
  >()
};

export type ServiceMessage = ActionType<typeof serviceMessage>;
