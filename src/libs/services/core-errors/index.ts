import {
  CORE_ERROR_MESSAGE_KEYS,
  LedgerError,
  getNodeErrorDetails
} from 'casper-wallet-core';
import type { CoreErrorMessageKey } from 'casper-wallet-core';

import { ErrorMessages } from '@src/constants';

interface ICoreErrorCopy {
  message: string;
  description: string;
}

/**
 * Wallet copy for every i18n key `casper-wallet-core` can put in an error's `message`. Core
 * ships no strings of its own; an unmapped key renders on screen verbatim, because i18next
 * runs here with `nsSeparator: false` and returns an unknown key unchanged.
 */
const coreErrorCopy: Record<CoreErrorMessageKey, ICoreErrorCopy> = {
  'errors:already-signed': {
    message: 'Already signed',
    description: 'This account has already signed this transaction.'
  },
  'errors:cancel-request-error': {
    message: 'Request cancelled',
    description:
      'The request was cancelled before it finished. Please try again.'
  },
  'errors:client-validation': {
    message: 'Request rejected',
    description:
      'The server rejected the request as invalid. Please check the details and try again.'
  },
  'errors:connection-error': {
    message: 'Connection failed',
    description:
      'We couldn’t reach the server. Check your internet connection and try again.'
  },
  'errors:deploy-rpc-error': {
    message: 'The network didn’t accept the transaction',
    description:
      'The node returned no result for this transaction. Nothing was submitted — please try again in a moment.'
  },
  'errors:empty-signature': {
    message: 'Signing failed',
    description:
      'The signature came back empty, so nothing was submitted. Please try signing again.'
  },
  'errors:flow-runner-account-mismatch': {
    message: 'Account changed midway',
    description:
      'The active account changed while this operation was running. Please start over.'
  },
  'errors:forbidden': {
    message: 'Access denied',
    description: 'The server refused this request. Please try again later.'
  },
  'errors:invalid-deploy': {
    message: 'Invalid transaction',
    description:
      'The transaction couldn’t be processed. Please check the details and try again.'
  },
  'errors:invalid-signature-request': {
    message: 'Invalid signature request',
    description:
      'The signature request is malformed and can’t be processed. Please make the request again from the application.'
  },
  'errors:invalid-transaction-json-error': {
    message: 'Invalid transaction data',
    description:
      'The transaction data provided is invalid and cannot be processed. Please check the input and try again.'
  },
  'errors:key-pair-mismatch': {
    message: 'Account key mismatch',
    description:
      'This account’s public key doesn’t match the secret key stored for it, so nothing was signed. Try removing the account and importing it again.'
  },
  'errors:network-error': {
    message: 'Network error',
    description:
      'We couldn’t reach the network. Check your internet connection and try again.'
  },
  'errors:not-found': {
    message: 'Not found',
    description: 'The requested data isn’t available. Please try again later.'
  },
  'errors:server-500-error': {
    message: 'Server error',
    description:
      'The server ran into a problem handling the request. Please try again later.'
  },
  'errors:server-502-error': {
    message: 'Server unavailable',
    description:
      'The server returned a bad gateway response. Please try again later.'
  },
  'errors:server-503-error': {
    message: 'Server unavailable',
    description:
      'The service is temporarily unavailable. Please try again later.'
  },
  'errors:server-504-error': {
    message: 'Server timeout',
    description: 'The server took too long to respond. Please try again later.'
  },
  'errors:server-506-error': {
    message: 'Server configuration error',
    description:
      'The server is misconfigured and can’t complete the request. Please try again later.'
  },
  'errors:server-507-error': {
    message: 'Server out of storage',
    description:
      'The server has no space left to complete the request. Please try again later.'
  },
  'errors:server-508-error': {
    message: 'Server error',
    description:
      'The server detected a loop while handling the request. Please try again later.'
  },
  'errors:server-510-error': {
    message: 'Server error',
    description:
      'The server needs an extension it doesn’t support. Please try again later.'
  },
  'errors:server-error': {
    message: 'Server error',
    description:
      'The server ran into a problem handling the request. Please try again later.'
  },
  'errors:timeout-error': {
    message: 'Request timed out',
    description: 'The request took too long to complete. Please try again.'
  },
  'errors:transaction-settlement-timeout': {
    message: 'Still waiting on the network',
    description:
      'The transaction was sent but hasn’t settled yet. Check its status in your activity list in a few minutes.'
  },
  'errors:transaction-watch-cancelled': {
    message: 'Stopped tracking the transaction',
    description:
      'The wallet stopped waiting for this transaction. It may still settle — check your activity list.'
  },
  'errors:unauthorized': {
    message: 'Not authorized',
    description:
      'The server rejected this request as unauthorized. Please try again later.'
  },
  'errors:unexpected': {
    message: 'Something went wrong',
    description: 'An unexpected error occurred. Please try again.'
  },
  'errors:unexpected-http': {
    message: 'Something went wrong',
    description:
      'The server returned an unexpected response. Please try again later.'
  }
};

const isCoreErrorMessageKey = (value: string): value is CoreErrorMessageKey =>
  (CORE_ERROR_MESSAGE_KEYS as readonly string[]).includes(value);

/** A Ledger failure is rendered by the Ledger views; reporting it again would double up. */
export const isLedgerFailure = (error: unknown): boolean =>
  error instanceof LedgerError;

/** Copy for an error core signalled with one of its i18n keys; null for anything else. */
export const getCoreErrorCopy = (error: unknown): ICoreErrorCopy | null => {
  const message = error instanceof Error ? error.message : '';

  return isCoreErrorMessageKey(message) ? coreErrorCopy[message] : null;
};

/**
 * Header and content for the wallet's error page. Node-provided detail wins — it is the only
 * text that says what the network actually objected to — then core's mapped copy, then the
 * error's own message.
 */
export const getTransactionErrorCopy = (
  error: unknown,
  translate: (key: string) => string
): { header: string; content: string } => {
  const genericContent = translate(
    ErrorMessages.common.UNKNOWN_ERROR.description
  );
  const nodeDetails = getNodeErrorDetails(error);

  if (nodeDetails) {
    return {
      // Verbatim: node text is not a translation key, and an RPC `data` object carries
      // account hashes and full deploy JSON, so only an already-plain string is shown.
      header: nodeDetails.message,
      content:
        typeof nodeDetails.data === 'string' ? nodeDetails.data : genericContent
    };
  }

  const copy = getCoreErrorCopy(error);

  if (copy) {
    return {
      header: translate(copy.message),
      content: translate(copy.description)
    };
  }

  const message = error instanceof Error ? error.message : '';

  return {
    header: message || translate(ErrorMessages.common.UNKNOWN_ERROR.message),
    content: genericContent
  };
};
