import Big from 'big.js';

import { formatNumber } from '@libs/ui/utils/formatters';
import { ContractPackageWithBalance } from '@libs/services/erc20-service';

export const tokenDivider = (decimals: number) => Big(10).pow(decimals || 0);
export const MINIMUM_SHOWING_BALANCE = 0.00001;

export const formatErc20TokenBalance = (
  erc20Tokens: ContractPackageWithBalance[] | null
) => {
  return erc20Tokens
    ?.map(token => {
      const calculatedErc20Balance = token?.balance
        ? Big(token?.balance || 0)
            .div(tokenDivider(token.metadata?.decimals))
            .toString()
        : '0';

      const formattedErc20Amount = calculatedErc20Balance
        ? formatNumber(calculatedErc20Balance, { precision: { max: 5 } })
        : '-';

      const erc20Amount =
        parseFloat(formattedErc20Amount) >= MINIMUM_SHOWING_BALANCE
          ? formattedErc20Amount
          : '0';

      return {
        id: token.contract_package_hash,
        name: token.contract_name,
        amount: erc20Amount,
        symbol: token.metadata.symbol,
        decimals: token.metadata.decimals.toString(),
        amountFiat: null,
        icon: 'assets/icons/erc20-avatar.svg'
      };
    })
    .sort((a, b) => {
      const first = a.amount.split(',').join('');
      const second = b.amount.split(',').join('');

      return Number(second) - Number(first);
    });
};
