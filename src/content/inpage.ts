function sendRequestMessage<T>(message: string): Promise<T> {
  return new Promise(resolve => {
    window.postMessage({ type: 'request', message }, '*');

    const transact = (e: MessageEvent) => {
      if (e.data.type === 'reply' && e.data.message === message) {
        window.removeEventListener('message', transact, false);
        resolve(e.data.value);
      }
    };

    window.addEventListener('message', transact, false);
  });
}

window.casperlabsHelper = {
  requestConnection: async () => {
    const event = new CustomEvent('request-connection-from-app');
    window.dispatchEvent(event);
  },
  disconnectFromSite(): void {
    const event = new CustomEvent('disconnected-from-app');
    window.dispatchEvent(event);
  },
  getActivePublicKey(): Promise<string> {
    return sendRequestMessage('get-active-public-key');
  },
  getVersion(): Promise<string> {
    return sendRequestMessage('get-version');
  },
  isConnected(): Promise<boolean> {
    return sendRequestMessage('get-is-connected');
  },
  // mocks
  getSelectedPublicKeyBase64(): Promise<string> {
    return Promise.resolve('');
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
