import {
  AuctionManagerEntryPoint,
  casperDelegateDeploy,
  casperUndelegateDeploy,
  casperRedelegateDeploy
} from '../../mocked-data';

export function useMockedDeployData(testEntryPoint: string | null) {
  switch (testEntryPoint) {
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
