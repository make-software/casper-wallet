import { IDeploy } from 'casper-wallet-core';

import {
  DeployActionEntryPointNameMap,
  DeployPlateEntryPointNameMap,
  ExecutionTypesMap
} from '@src/constants';

export const getEntryPointName = (deploy: IDeploy, isAction?: boolean) => {
  if (deploy?.type === 'CSPR_NATIVE') {
    return 'Transfer';
  } else if (deploy?.type === 'ASSOCIATED_KEYS') {
    return 'Update account';
  }

  const entryPointName = deploy?.entryPoint
    ? isAction
      ? DeployActionEntryPointNameMap[deploy.entryPoint]
      : DeployPlateEntryPointNameMap[deploy.entryPoint]
    : ExecutionTypesMap[deploy.executionTypeId ?? 2];

  return entryPointName ?? deploy?.entryPoint;
};
