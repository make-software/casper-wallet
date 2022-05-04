import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Link, Typography } from '@src/libs/ui';

const Container = styled.div`
  height: 56px;
  background-color: ${({ theme }) => theme.color.backgroundPrimary};

  display: flex;
  padding: ${({ theme }) => theme.padding[1.6]};
  border-bottom: 0.5px solid ${({ theme }) => theme.color.borderPrimary};
`;

// TODO: implement `back` and `cancel` types
interface SubmenuBarProps {
  actionType: 'back' | 'close' | 'cancel';
}

export function SubmenuBar({ actionType }: SubmenuBarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  switch (actionType) {
    case 'close':
      return (
        <Container>
          <Typography type="body" weight="semiBold">
            <Link onClick={() => navigate(-1)} color="fillBlue">
              {t('Close')}
            </Link>
          </Typography>
        </Container>
      );
    default:
      throw new Error('Unknown Link type');
  }
}
