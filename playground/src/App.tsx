import React from 'react';
import logo from './logo.svg';
import { Button } from '@mui/material';
import styled from '@emotion/styled';
import { useWalletService } from './wallet-service';
import { truncateKey } from './utils';

const Container = styled('div')({
  backgroundColor: '#282c34',
  color: 'white',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  alignItems: 'center',
  justifyContent: 'center'
});

const Row = styled(Container)({
  flexDirection: 'row'
});

function App() {
  const { connectSigner, disconnect, activePublicKey, errorMessage, logs } =
    useWalletService();
  const handleConnect = activePublicKey ? disconnect : connectSigner;

  const statusText = activePublicKey
    ? `${truncateKey(activePublicKey)}`
    : 'Disconnected';
  const connectButtonText = !activePublicKey ? `Connect` : 'Disconnect';

  return (
    <Container>
      <Row style={{ fontSize: '2rem' }}>
        <img src={logo} alt="logo" />
        Casper Wallet Playground
      </Row>
      <Row>
        Connected Account: {statusText}{' '}
        <Button variant="contained" onClick={handleConnect}>
          {connectButtonText}
        </Button>
      </Row>
      {errorMessage && <div>{errorMessage}</div>}
      <div>
        {logs.map(([log, payload], index) => <div key={index}>{log} {JSON.stringify(payload, null, 2)}]</div>)}
      </div>
    </Container>
  );
}

export default App;
