export enum DownloadAccountKeysSteps {
  Instruction = 'instruction',
  Download = 'download',
  Success = 'success'
}

export const downloadFile = (content: Blob, filename: string): void => {
  // allocation
  const url = window.URL.createObjectURL(content);

  const downloadFileLink = document.createElement('a');
  downloadFileLink.href = url;
  downloadFileLink.setAttribute('download', filename);
  downloadFileLink.click();
  downloadFileLink.remove();

  // cleanup
  window.URL.revokeObjectURL(url);
};

export const safetyTips = [
  {
    id: 1,
    header: 'Save files in secure locations.',
    icon: 'assets/icons/secure.svg'
  },
  {
    id: 2,
    header: 'Never share files with anyone.',
    icon: 'assets/icons/lock.svg'
  },
  {
    id: 3,
    header: 'Be careful of phishing',
    description:
      'Casper Wallet will never spontaneously ask you for your private key files.',
    icon: 'assets/icons/error.svg'
  },
  {
    id: 4,
    header: 'Casper Wallet can’t recover it',
    description: 'Casper Wallet does not keep a copy of your secret phrase.',
    icon: 'assets/icons/cross-in-circle.svg'
  }
];
