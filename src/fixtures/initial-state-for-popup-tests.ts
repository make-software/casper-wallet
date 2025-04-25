import { RootState } from 'typesafe-actions';

import { NetworkSetting } from '@src/constants';

import { TimeoutDurationSetting } from '@popup/constants';

import { ThemeMode } from '@background/redux/settings/types';

export const initialStateForPopupTests: RootState = {
  keys: {
    passwordHash:
      '83a08650bfee28f7c8fa850828cfa9800590f0385d964d03d1cd1b2ef05f42a8',
    passwordSaltHash:
      '088da9fc6cc474e408acfc9a2d4a2f83776332d53008b1c3ee0b9f52f10c8201',
    keyDerivationSaltHash:
      '5a92932f02799e90c2e6b994b6b8b23220dd3022570c43837f318e1d0379f1e2'
  },
  loginRetryCount: 0,
  session: {
    encryptionKeyHash:
      '7b55663cb7cd7d96765373ce0ee8d6901244de1ed241d20f9afe18a81149ea71',
    isLocked: true,
    isContactEditingAllowed: false
  },
  vault: {
    secretPhrase: [
      'hold',
      'matrix',
      'spider',
      'subway',
      'bottom',
      'jazz',
      'charge',
      'fire',
      'lawn',
      'valley',
      'stay',
      'coil',
      'moral',
      'hospital',
      'dream',
      'cycle',
      'multiply',
      'december',
      'agree',
      'huge',
      'major',
      'tower',
      'devote',
      'old'
    ],
    accounts: [
      {
        publicKey:
          '0202b1943511b8c23b1b2b8ed7ddcedffcc7be70d9366a5005c7beab08a81b7ae633',
        secretKey: 'Go8sSp3u/hSaDFCjFK6wdM4VZuWjqxEaNB38RaZHLA0=',
        name: 'Account 1',
        hidden: false
      },
      {
        publicKey:
          '0203b2e05f074452f5e69ba512310deceaca152ebd3394eadcec26c6e68e91aa7724',
        secretKey: 'TCDeehVWtWeWP2PM/UKh2gQ6hgUpZ6v1D6lzmonYpm4=',
        name: 'Account 2',
        hidden: false
      }
    ],
    accountNamesByOriginDict: {},
    siteNameByOriginDict: {},
    activeAccountName: 'Account 1',
    jsonById: {}
  },
  windowManagement: {
    windowId: null
  },
  ledger: {
    windowId: null,
    deploy: null,
    transaction: null,
    recipientToSaveOnSuccess: null
  },
  vaultCipher:
    'G89IRk1Zc+l46uPzkhTwSy09IUM5Q4R1JoIfOCeyMZEn47OnFK7Rk1fSPJ9gsSVsiq+d00AqKuW/lTV+s1OTGOucftVqKBF6XSyR9tG7P2sgRyJ6o5vS/h+tVSyqHt6wHFuTcee1IResAfxPJEjiKbMMm7gN1eFosvqM8utdBOgIkR17+HiojfvdI0Q07kWZXy0SuUceSxnXGHZU2LdMikZI2JmkaEgk+Qgm/nNzqlN2hAKxQRhr+68opUiIN/lpOYPLS64nZou6vuqSKu+Uogd8znNZOcFA+4+1zXlbJEp8HksSqy+fblAxDALpauljIogoPfwLIaSPU1GSwTfG63yuCiMVlAE+FwOAt31J+m0N++obOTomfp6ZjN0uOG700Kfm5NSWMMXqCp/f/M8C466/ONqsl0og/R1KXOw0nPYybzmgXCyS35yZyOXmxzKrKtXRdYVTBz79pjMbR8p1CCDnVLHJyKKIGbsGrX3ADjwkJHmBEjGPL2Qb4Ez7ATzcQ/XEdcK+VfzbNkJivssPMBV+6ETNWrwPbIR4BxfN12TbmdAej7nbP+oaM1plKhcoW1hp0oD60Ngwh8D1ztD9i+3R9yDGVNwjh56ytvk5E1Fo7e02NYBJgjvHFoBz+fX4iHlliHczRRVC3OVceZcPPMCeVuigkz7wirqscxBfnrc+EBXrziOrEc4NobSKJI33UEZAMLjxLZSD8CR9J9RrJzFCrda44P65uSypiSyw49EPdsG4etW9Eop2iHNO5Ny7oCr7mITsFvFkGtXDh+tQ4r6D4b7ZGe2AD2Jm/4t9jcBsPO3wHxPfS7eIHq8RUJZUK7DL90s8gt0wXzIFgIeMIc+mcK0HigU+zYaBHO9O+PUfetEHZANmSwsRu3nmiHogEZaPJAT+ATY3+3GjNMQ=',
  loginRetryLockoutTime: null,
  lastActivityTime: null,
  activeOrigin: null,
  settings: {
    activeNetwork: NetworkSetting.Testnet,
    casperNetworkApiVersion: '1.5.8',
    activeTimeoutDuration: TimeoutDurationSetting['5 min'],
    isDarkMode: false,
    themeMode: ThemeMode.SYSTEM
  },
  recentRecipientPublicKeys: [],
  accountInfo: {
    pendingDeployHashes: [],
    accountTrackingIdOfSentNftTokens: {}
  },
  contacts: {
    contacts: [],
    lastModified: null
  },
  rateApp: {
    ratedInStore: false,
    askForReviewAfter: null
  },
  promotion: {
    showCSPRNamePromotion: true
  }
};
