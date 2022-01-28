import React from 'react';
import { Container, ContainerBackground } from './Panel.styled';

const Panel: React.FC = () => {
  return (
    <Container>
      <ContainerBackground />
      <h1>Dev Tools Panel</h1>
    </Container>
  );
};

export default Panel;
