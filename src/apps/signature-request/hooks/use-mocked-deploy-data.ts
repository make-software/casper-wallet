import {
  AuctionManagerEntryPoint,
  casperDelegateDeploy,
  casperUndelegateDeploy,
  casperRedelegateDeploy,
  casperTransferDeploy
} from '../mocked-data';

export function useMockedDeployData(testEntryPoint: string) {
  switch (testEntryPoint) {
    case 'transfer':
      return casperTransferDeploy;
    case AuctionManagerEntryPoint.delegate:
      return casperDelegateDeploy;
    case AuctionManagerEntryPoint.undelegate:
      return casperUndelegateDeploy;
    case AuctionManagerEntryPoint.redelegate:
      return casperRedelegateDeploy;
    default:
      throw new Error('Unknown deploy entry point');
  }
}
