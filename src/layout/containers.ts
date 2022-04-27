import styled from 'styled-components';

export const ContentContainer = styled.div`
  padding: 0 ${({ theme }) => theme.padding[1.6]};
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

export const ButtonsContainer = styled.div<Props>`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;

  display: flex;
  flex-direction: ${({ direction }) => (direction ? direction : 'column')};
  justify-content: space-around;
  gap: 16px;

  border-top: ${({ theme }) => theme.border.separator};
  padding: ${({ theme }) => theme.padding[1.6]};

  background-color: ${({ theme }) => theme.color.backgroundPrimary};
`;
