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
  const {
    connectSigner,
    disconnect,
    sign,
    activePublicKey,
    errorMessage,
    logs
  } = useWalletService();
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
        {/*
          !!! TEMPORARY SOLUTION FOR DEMO REASON ONLY. SHOULD BE DELETED !!!
          `recipientPublicKey` used as entry points keys for demo
        */}
        <Button
          disabled={activePublicKey == null}
          variant="contained"
          onClick={() =>
            activePublicKey && sign({ deploy: {} }, activePublicKey, 'delegate')
          }
        >
          Signing Delegate Request
        </Button>
        <Button
          disabled={activePublicKey == null}
          variant="contained"
          onClick={() =>
            activePublicKey &&
            sign({ deploy: {} }, activePublicKey, 'undelegate')
          }
        >
          Signing Undelegate Request
        </Button>
        <Button
          disabled={activePublicKey == null}
          variant="contained"
          onClick={() =>
            activePublicKey &&
            sign({ deploy: {} }, activePublicKey, 'redelegate')
          }
        >
          Signing Redelegate Request
        </Button>
        <Button
          disabled={activePublicKey == null}
          variant="contained"
          onClick={() =>
            activePublicKey && sign({ deploy: {} }, activePublicKey, 'transfer')
          }
        >
          Signing Transfer Request
        </Button>
      </Row>
      {errorMessage && <div>{errorMessage}</div>}
      <div>
        {logs.map(([log, payload], index) => (
          <div key={index}>
            {log} {JSON.stringify(payload, null, 2)}]
          </div>
        ))}
      </div>
    </Container>
  );
}

export default App;
