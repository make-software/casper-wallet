import React from 'react';
import logo from './logo.svg';
import { Button } from '@mui/material';
import styled from '@emotion/styled';
import { useWalletService } from './wallet-service';
import { truncateKey } from './utils';
import {
  AuctionManagerEntryPoint,
  makeAuctionManagerDeploy,
  makeNativeTransferDeploy
} from './deploy-utils';
import { DeployUtil } from 'casper-js-sdk';

const Container = styled('div')({
  backgroundColor: '#282c34',
  color: 'white',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  alignItems: 'center',
  justifyContent: 'center'
});

const LogoTitleContainer = styled(Container)({
  marginTop: '24px',
  flexDirection: 'row'
});

const Row = styled(Container)({
  flexDirection: 'row'
});

function App() {
  const {
    connectSigner,
    disconnect,
    sign,
    getVersion,
    activePublicKey,
    errorMessage,
    logs
  } = useWalletService();

  const handleSignDeploy = (
    accountPublicKey: string,
    deploy: DeployUtil.Deploy
  ) => {
    if (accountPublicKey) {
      const deployJson = DeployUtil.deployToJson(deploy);
      sign(JSON.stringify(deployJson), accountPublicKey, 'undelegate').then(
        res => {
          alert('Sign successful: ' + Object.values(res.signature).toString());
        }
      );
    }
  };

  const handleConnect = activePublicKey ? disconnect : connectSigner;

  const statusText = activePublicKey
    ? `${truncateKey(activePublicKey)}`
    : 'Disconnected';
  const connectButtonText = !activePublicKey ? `Connect` : 'Disconnect';

  return (
    <Container>
      <LogoTitleContainer style={{ fontSize: '2rem' }}>
        <img src={logo} alt="logo" />
        Casper Wallet Playground
      </LogoTitleContainer>

      <Row>
        Connected Account: {statusText}{' '}
        <Button variant="contained" onClick={handleConnect}>
          {connectButtonText}
        </Button>
        <Button
          variant="contained"
          onClick={async () => {
            const ver = await getVersion();
            alert(ver);
          }}
        >
          Show Version
        </Button>
      </Row>
      <Row>
        {activePublicKey == null ? (
          'CONNECT TO SEE MORE ACTIONS'
        ) : (
          <div>
            <div style={{ textAlign: 'center' }}>
              SIGNATURE REQUEST SCENARIOS
            </div>
            <Button
              variant="text"
              onClick={() => {
                const deploy = makeNativeTransferDeploy(
                  activePublicKey,
                  '0106ca7c39cd272dbf21a86eeb3b36b7c26e2e9b94af64292419f7862936bca2ca',
                  '2500000000',
                  '1234'
                );
                handleSignDeploy(activePublicKey, deploy);
              }}
            >
              Transfer
            </Button>
            <Button
              variant="text"
              onClick={() => {
                const deploy = makeAuctionManagerDeploy(
                  AuctionManagerEntryPoint.delegate,
                  activePublicKey,
                  `0106ca7c39cd272dbf21a86eeb3b36b7c26e2e9b94af64292419f7862936bca2ca`, // MAKE Stake 10% [testnet],
                  null,
                  '2500000000'
                );
                handleSignDeploy(activePublicKey, deploy);
              }}
            >
              Delegate
            </Button>
            <Button
              variant="text"
              onClick={() => {
                const deploy = makeAuctionManagerDeploy(
                  AuctionManagerEntryPoint.undelegate,
                  activePublicKey,
                  `0106ca7c39cd272dbf21a86eeb3b36b7c26e2e9b94af64292419f7862936bca2ca`, // MAKE Stake 10% [testnet],
                  null,
                  '2500000000'
                );
                handleSignDeploy(activePublicKey, deploy);
              }}
            >
              Undelegate
            </Button>
            <Button
              variant="text"
              onClick={() => {
                const deploy = makeAuctionManagerDeploy(
                  AuctionManagerEntryPoint.redelegate,
                  activePublicKey,
                  `0106ca7c39cd272dbf21a86eeb3b36b7c26e2e9b94af64292419f7862936bca2ca`, // MAKE Stake 10% [testnet],
                  '017d96b9a63abcb61c870a4f55187a0a7ac24096bdb5fc585c12a686a4d892009e', // MAKE Stake 2
                  '2500000000'
                );
                handleSignDeploy(activePublicKey, deploy);
              }}
            >
              Redelegate
            </Button>
            <div style={{ textAlign: 'center' }}>SIGNATURE REQUEST ERRORS</div>
            <Button
              variant="text"
              onClick={() => {
                const deploy = makeNativeTransferDeploy(
                  activePublicKey,
                  // recipientPublicKey was corrupted by changing last `c` char to `C`
                  '0106ca7c39cd272dbf21a86eeb3b36b7c26e2e9b94af64292419f7862936bca2Ca',
                  '2500000000',
                  '1234'
                );
                handleSignDeploy(activePublicKey, deploy);
              }}
            >
              Invalid Checksum
            </Button>
            <Button
              variant="text"
              onClick={() => {
                const pk =
                  '01ebf429a18b232b71df5759fe4e77dd05bf8ab3f2ccdcca50d0baa47d6ff27e02';
                const deploy = makeNativeTransferDeploy(
                  pk,
                  '0106ca7c39cd272dbf21a86eeb3b36b7c26e2e9b94af64292419f7862936bca2ca',
                  '2500000000',
                  '1234'
                );
                handleSignDeploy(pk, deploy);
              }}
            >
              Not approved
            </Button>
          </div>
        )}
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
