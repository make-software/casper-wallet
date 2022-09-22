import styled from 'styled-components';

const backgroundIconPath = 'assets/icons/logo-background.svg';

export const HeaderContainer = styled.header`
  background: url(${backgroundIconPath}) no-repeat;
  background-color: ${({ theme }) => theme.color.backgroundRed};
  height: 72px;

  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 0 16px;
`;

export const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  height: 100%;
`;

export const LogoContainer = styled.div`
  cursor: ${props => (props.onClick ? 'pointer' : 'default')};
`;

export const ContentContainer = styled.div`
  padding: 0 ${({ theme }) => theme.padding[1.6]}
    ${({ theme }) => theme.padding[1.6]};
`;

export const HeaderTextContainer = styled(ContentContainer)`
  margin-top: 24px;
`;

export const TextContainer = styled(ContentContainer)`
  margin-top: 16px;
`;

export const InputsContainer = styled.div`
  margin-top: 24px;
  & > div:nth-child(2) {
    margin-top: 16px;
  }
`;

// Default direction value is `column`
interface Props {
  direction?: 'row' | 'column';
}

export const FooterButtonsContainer = styled.div<Props>`
  margin-top: 16px;
  width: 100%;

  display: flex;
  flex-direction: ${({ direction }) => (direction ? direction : 'column')};
  justify-content: space-around;
  gap: 16px;

  border-top: ${({ theme }) => theme.border.separator};
  padding: ${({ theme }) => theme.padding[1.6]};

  background-color: ${({ theme }) => theme.color.backgroundPrimary};
`;

export const FooterButtonsAbsoluteContainer = styled(FooterButtonsContainer)`
  position: absolute;
  bottom: 0;
  left: 0;
`;

export const ListItemClickableContainer = styled.div`
  display: flex;
  justify-content: space-between;

  width: 100%;
  cursor: pointer;

  padding: 14px 18px;
  & > * + * {
    padding-left: 18px;
  }

  & > span {
    white-space: nowrap;
  }
`;
