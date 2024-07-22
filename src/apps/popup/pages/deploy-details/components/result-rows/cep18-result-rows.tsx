import React from 'react';

import { DeployIcon, FTActionTypeEnum } from '@src/constants';

import {
  AccountInfoRow,
  AmountRow,
  ContractInfoRow,
  SimpleContainer
} from '@popup/pages/deploy-details/components/common';

import { FTActionsResult } from '@libs/types/deploy';

const ftResultActionNameMap: { [key in number]: string } = {
  [FTActionTypeEnum.Approve]: 'Granted transfer rights',
  [FTActionTypeEnum.Transfer]: 'Transferred',
  [FTActionTypeEnum.Burn]: 'Burned',
  [FTActionTypeEnum.Mint]: 'Minted'
};

interface Cep18ResultRowsProps {
  ftAction: FTActionsResult;
}

export const Cep18ResultRows = ({ ftAction }: Cep18ResultRowsProps) => {
  const isTransfer = ftAction.ft_action_type_id === FTActionTypeEnum.Transfer;
  const isMint = ftAction.ft_action_type_id === FTActionTypeEnum.Mint;
  const isBurn = ftAction.ft_action_type_id === FTActionTypeEnum.Burn;
  const isApprove = ftAction.ft_action_type_id === FTActionTypeEnum.Approve;

  if (isApprove) {
    return (
      <SimpleContainer
        entryPointName={ftResultActionNameMap[ftAction.ft_action_type_id]}
      >
        <AmountRow amount={'amount'} symbol={'symbol'} label="for" />
        <ContractInfoRow
          contractLink={'contractLink'}
          contractName={'contractName'}
          iconUrl={'iconUrl' || DeployIcon.Cep18Default}
          additionalInfo="token(s)"
        />
        <AccountInfoRow
          publicKey={
            '02028a04ab5ff8435f19581484643cadfd755ee9f0985e402d646ae6f3bd040912f5'
          }
          label="to"
        />
      </SimpleContainer>
    );
  }

  if (isBurn) {
    return (
      <SimpleContainer
        entryPointName={ftResultActionNameMap[ftAction.ft_action_type_id]}
      >
        <AmountRow amount={'amount'} symbol={'symbol'} />
        <ContractInfoRow
          contractLink={'contractLink'}
          contractName={'contractName'}
          iconUrl={'iconUrl' || DeployIcon.Cep18Default}
          additionalInfo="token(s)"
        />
        <AccountInfoRow
          publicKey={
            '02028a04ab5ff8435f19581484643cadfd755ee9f0985e402d646ae6f3bd040912f5'
          }
          label="owned by"
        />
      </SimpleContainer>
    );
  }

  if (isMint) {
    return (
      <SimpleContainer
        entryPointName={ftResultActionNameMap[ftAction.ft_action_type_id]}
      >
        <AmountRow amount={'amount'} symbol={'symbol'} />
        <ContractInfoRow
          contractLink={'contractLink'}
          contractName={'contractName'}
          iconUrl={'iconUrl' || DeployIcon.Cep18Default}
          additionalInfo="token(s)"
        />
        <AccountInfoRow
          publicKey={
            '02028a04ab5ff8435f19581484643cadfd755ee9f0985e402d646ae6f3bd040912f5'
          }
          label="to"
        />
      </SimpleContainer>
    );
  }

  if (isTransfer) {
    return (
      <SimpleContainer
        entryPointName={ftResultActionNameMap[ftAction.ft_action_type_id]}
      >
        <AmountRow amount={'amount'} symbol={'symbol'} />
        <ContractInfoRow
          contractLink={'contractLink'}
          contractName={'contractName'}
          iconUrl={'iconUrl' || DeployIcon.Cep18Default}
          additionalInfo="token(s)"
        />
        <AccountInfoRow
          publicKey={
            '02028a04ab5ff8435f19581484643cadfd755ee9f0985e402d646ae6f3bd040912f5'
          }
          label="from"
        />
        <AccountInfoRow
          publicKey={
            '02028a04ab5ff8435f19581484643cadfd755ee9f0985e402d646ae6f3bd040912f5'
          }
          label="to"
        />
      </SimpleContainer>
    );
  }

  return null;
};
