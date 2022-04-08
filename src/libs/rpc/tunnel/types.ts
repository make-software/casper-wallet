import { Runtime } from 'webextension-polyfill-ts';

export type CallbackType = (
  msg: Request,
  sender: Runtime.MessageSender
) => Promise<Response> | void;
export type PostMessageType = (msg: Request) => Promise<Response>;

export type AddListenerType = (callback: CallbackType) => void;

export interface Caller {
  url?: string;
  id?: string;
}

export type MessageHandlerType = (msg: any, caller: Caller) => any;

export interface Request {
  payload: any;
  source: string;
  destination: string;
  type: 'casperlabs-plugin';
}

export interface Response<TYPE = any> {
  destination: string;
  error?: string;
  payload?: TYPE;
  source: string;
  type: 'casperlabs-plugin';
}

export interface TunnelOptions {
  source: string;
  destination: RequestDestination;
  postMessage?: PostMessageType;
  addListener?: AddListenerType;
  messageHandler?: MessageHandlerType;
  logMessages?: boolean;
}
