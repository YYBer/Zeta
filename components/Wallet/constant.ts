import * as nearAPI from "near-api-js";

const { keyStores } = nearAPI;


export interface TransferPayload {
  userId: string;
  receiverId: string;
  amount: string;
  symbol: string;
}

export interface SwapPayload {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippagetolerance: number;
}


 // // mainnet config
 export const connectionConfig = {
    networkId: "mainnet",
    keyStore: new keyStores.BrowserLocalStorageKeyStore(),
    nodeUrl: "https://rpc.mainnet.near.org",
    walletUrl: "https://wallet.mainnet.near.org",
    helperUrl: "https://helper.mainnet.near.org",
    explorerUrl: "https://nearblocks.io",
  };

  // mainnet tokenlist
  export const TOKEN_LIST: { [key: string]: string } = {
  ETH: 'aurora',
  wNEAR: 'wrap.near',
  AURORA: 'aaaaaa20d9e0e2461697782ef11675f668207961.factory.bridge.near',
  USDC: '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
  USDT: 'dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near',
  DAI:'6b175474e89094c44da98b954eedeac495271d0f.factory.bridge.near',
  REF:'token.v2.ref-finance.near'
};

// testnet connection config
export const connectionTestConfig = {
  networkId: "testnet",
  keyStore: new keyStores.BrowserLocalStorageKeyStore(),
  nodeUrl: "https://rpc.testnet.near.org",
  walletUrl: "https://testnet.mynearwallet.com/",
  helperUrl: "https://helper.testnet.near.org",
  explorerUrl: "https://testnet.nearblocks.io",
};

// testnet tokenlist
export const TOKEN_TEST_LIST: { [key: string]: string } = {
  wNEAR: 'wrap.testnet',
  ETH: 'eth.fakes.testnet',
  USDC: 'usdc.fakes.testnet',
  USDT: 'usdt.fakes.testnet',
  AURORA: 'aurora.fakes.testnet',
  REF: 'ref.fakes.testnet',
  DAI: 'dai.fakes.testnet'
};

export const THIRTY_TGAS = '30000000000000';

export const MockTransferPayload: TransferPayload = {
  userId: '9b5adfd2530b9c2657b088cfc8755e3c25a6cef7fb9b44c659d12b2bd30a3f62',
  receiverId: 'c7413c9c61fd11557efbfae8a063daebfa5774432aca543833d05bcd7050d9e6',
  amount: '0.01',
  symbol: 'USDC'
};

export const MockSwapPayload: SwapPayload = {
  tokenIn: "USDC", // symbol
  tokenOut: "ETH", // symbol
  amountIn: "0.1",
  slippagetolerance: 0.01
}
