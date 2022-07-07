window.casperlabsHelper = {
  requestConnection: async () => {
    const event = new CustomEvent('request-connection-from-app');
    window.dispatchEvent(event);
  },
  // mocks
  disconnectFromSite(): void {},
  getActivePublicKey(): Promise<string> {
    return Promise.resolve('');
  },
  getSelectedPublicKeyBase64(): Promise<string> {
    return Promise.resolve('');
  },
  getVersion(): Promise<string> {
    return Promise.resolve('');
  },
  isConnected(): Promise<boolean> {
    return Promise.resolve(false);
  },
  sign(
    deploy: { deploy: any },
    signingPublicKeyHex: string,
    targetPublicKeyHex: string | undefined
  ): Promise<{ deploy: any }> {
    return Promise.resolve({ deploy: undefined });
  },
  signMessage(rawMessage: string, signingPublicKey: string): Promise<string> {
    return Promise.resolve('');
  }
};
