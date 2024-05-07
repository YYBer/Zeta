// TODO: implement unit transfer 
import { useEffect, useState } from 'react';
import * as nearAPI from "near-api-js";
const { utils, keyStores, connect, Contract } = nearAPI;
type ContractType = InstanceType<typeof Contract>;
interface NEP141_Contract extends ContractType {
  ft_balance_of: (args: { account_id: string }) => Promise<string>;
}

const THIRTY_TGAS = '30000000000000';
const TOKEN_LIST: { [key: string]: string } = {
  wNEAR: 'wrap.testnet',
  USDC: 'usdc.fakes.testnet',
  USDT: 'usdt.fakes.testnet',
  AURORA: 'aurora.fakes.testnet',
  REF: 'ref.fakes.testnet',
  DAI: 'dai.fakes.testnet'
};
export interface Payload {
  userId: string;
  receiverId: string;
  amount: string;
  symbol: string;
}

export async function getBalance(accountId: string, symbol: string): Promise<string> {
  const tokenContractId = TOKEN_LIST[symbol];
  // 應該檢查 symbol 是否在 TOKEN_LIST 中

  const connectionConfig = {
    networkId: "testnet",
    keyStore: new keyStores.BrowserLocalStorageKeyStore(),
    nodeUrl: "https://rpc.testnet.near.org",
    walletUrl: "https://testnet.mynearwallet.com/",
    helperUrl: "https://helper.testnet.near.org",
    explorerUrl: "https://testnet.nearblocks.io",
  };

  try {
    const nearConnection = await connect(connectionConfig);
    const account = await nearConnection.account(accountId);
    
    // 創建代幣合約實例
    const contract = new Contract(account, tokenContractId, {
      viewMethods: ['ft_balance_of'],
      changeMethods: [],
    }) as unknown as NEP141_Contract;

    // 調用合約的 ft_balance_of 方法
    const balance = await contract.ft_balance_of({ account_id: accountId });
    console.log(`Balance of ${symbol} in ${accountId}: ${balance}`);
    return balance; // 返回餘額
  } catch (error) {
    console.error(`Failed to fetch balance of ${symbol} for ${accountId}:`, error);
    throw error;
  }

}