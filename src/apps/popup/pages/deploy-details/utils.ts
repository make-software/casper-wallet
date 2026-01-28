import { IDeploy, isWasmDeploy } from 'casper-wallet-core';
import { isWasmProxyDeploy } from 'casper-wallet-core/src/utils/deploy';

import {
  DeployActionEntryPointNameMap,
  DeployPlateEntryPointNameMap,
  ExecutionTypesMap
} from '@src/constants';

export const getEntryPointName = (
  deploy: IDeploy,
  isAction?: boolean,
  isHeader = false
) => {
  if (deploy?.type === 'CSPR_NATIVE') {
    return 'Transfer';
  } else if (deploy?.type === 'ASSOCIATED_KEYS') {
    return 'Update account';
  } else if (isWasmDeploy(deploy)) {
    return 'WASM transaction';
  } else if (isWasmProxyDeploy(deploy) && isHeader) {
    return 'WASM transaction';
  }

  const entryPointName = deploy?.entryPoint
    ? isAction
      ? DeployActionEntryPointNameMap[deploy.entryPoint]
      : DeployPlateEntryPointNameMap[deploy.entryPoint]
    : ExecutionTypesMap[deploy.executionTypeId ?? 2];

  return entryPointName ?? deploy?.entryPoint;
};
