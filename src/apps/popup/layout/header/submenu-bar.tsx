import React from 'react';
import styled from 'styled-components';
import { useTranslation, Trans } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Link, Typography, SvgIcon } from '@libs/ui';
import { RouterPath } from '@popup/router';

const Container = styled.div`
  height: 56px;
  background-color: ${({ theme }) => theme.color.backgroundPrimary};

  display: flex;
  padding: ${({ theme }) => theme.padding[1.6]};
  border-bottom: 0.5px solid ${({ theme }) => theme.color.borderPrimary};
`;

const LinkWithIcon = styled(Link)`
  display: flex;
  align-items: center;
`;

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
            <Link onClick={() => navigate(RouterPath.Home)} color="fillBlue">
              <Trans t={t}>Close</Trans>
            </Link>
          </Typography>
        </Container>
      );
    case 'cancel':
      return (
        <Container>
          <Typography type="body" weight="semiBold">
            <Link onClick={() => navigate(RouterPath.Home)} color="fillBlue">
              <Trans t={t}>Cancel</Trans>
            </Link>
          </Typography>
        </Container>
      );
    case 'back':
      return (
        <Container>
          <Typography type="body" weight="semiBold">
            <LinkWithIcon onClick={() => navigate(-1)} color="fillBlue">
              <SvgIcon
                src="assets/icons/chevron.svg"
                color="contentBlue"
                flipByAxis="Y"
                size={24}
              />
              <Trans t={t}>Back</Trans>
            </LinkWithIcon>
          </Typography>
        </Container>
      );
    default:
      throw new Error('Unknown Link type');
  }
}
