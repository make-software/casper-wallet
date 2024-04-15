export interface RPCResponse {
  api_version: string;
  deploy_hash: string;
}

export interface RPCErrorResponse {
  code: number;
  message: string;
  data: string | any;
}

export interface ICasperNodeStatusResponse {
  last_progress: string;
}

export interface ICasperNetworkSendDeployResponse {
  jsonrpc: '2.0';
  id: number;
  result: {
    api_version: string;
    deploy_hash: string;
  };
}
