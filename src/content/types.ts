import { CasperWalletProvider } from './sdk';

declare global {
  interface Window {
    CasperWalletProvider: typeof CasperWalletProvider;
  }
}
