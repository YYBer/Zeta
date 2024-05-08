// TODO: implement unit transfer 
import { useEffect, useState } from 'react';
import * as nearAPI from "near-api-js";
const { utils, keyStores, connect, Contract } = nearAPI;
import { THIRTY_TGAS, connectionConfig, TOKEN_LIST, connectionTestConfig, TOKEN_TEST_LIST } from './constant'

type ContractType = InstanceType<typeof Contract>;
interface NEP141_Contract extends ContractType {
  ft_balance_of: (args: { account_id: string }) => Promise<string>;
  ft_metadata: () => Promise<{
    spec: string;
    name: string;
    symbol: string;
    icon: string;
    reference: null | string;
    reference_hash: null | string;
    decimals: number;
  }>;
}
export interface Payload {
  userId: string;
  receiverId: string;
  amount: string;
  symbol: string;
}

export async function getBalance(accountId: string, symbol: string): Promise<string> {
  const tokenContractId = TOKEN_LIST[symbol];
  // 應該檢查 symbol 是否在 TOKEN_LIST 中

  try {
    const nearConnection = await connect(connectionConfig);
    const account = await nearConnection.account(accountId);
    
    // 創建代幣合約實例
    const contract = new Contract(account, tokenContractId, {
      viewMethods: ['ft_balance_of', 'ft_metadata'],
      changeMethods: [],
    }) as unknown as NEP141_Contract;

    // 調用合約的 ft_balance_of 方法
    const balance = await contract.ft_balance_of({ account_id: accountId });

    const metadata = await contract.ft_metadata();
    const decimals = metadata.decimals;
    const unit_convert = 10**decimals
    // Failed to fetch balance: The number 522.704967 cannot be converted to a BigInt because it is not an integer
    // const parseBalance = BigInt(Math.round(parseFloat(balance) / unit_convert)).toString()
    const parseBalance = (parseFloat(balance) / unit_convert).toString()
    
    console.log(`Balance of ${symbol} in ${accountId}: ${balance}`);
    return parseBalance; // 返回餘額
  } catch (error) {
    console.error(`Failed to fetch balance of ${symbol} for ${accountId}:`, error);
    throw error;
  }

}