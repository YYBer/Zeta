'use client';

import { FunctionCallAction } from '@near-wallet-selector/core';
import { useWalletSelector } from '@/components/contexts/WalletSelectorContext';
import { useEffect, useState } from 'react';
import { TransferAction } from '@near-wallet-selector/core';
import * as nearAPI from "near-api-js";
const { utils } = nearAPI;
const THIRTY_TGAS = '30000000000000';
const TOKEN_LIST: { [key: string]: string } = {
  NEAR: 'NEAR',
  PTC: 'ft5.0xpj.testnet',
  // Add other token symbols and their contract IDs
};

interface Payload {
  userId: string;
  receiverId: string;
  amount: string;
  symbol: string;
}

export function TransferToken({ payload }: { payload: Payload }) {
  const { selector, modal, accounts } = useWalletSelector();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (payload && selector && modal && accounts.length > 0) {
      transferToken(payload);
    }
  }, [payload, selector, modal, accounts]);

  async function transferToken(payload: Payload) {
    setLoading(true);
    setError(null);
    setSuccess(false);
  console.log(JSON.stringify(payload))
    try {
      const wallet = await selector.wallet();
      const accountId = accounts.find((account) => account.active)?.accountId;

      if (!accountId) {
        throw new Error('No active account found');
      }

      const args = {
        receiver_id: payload.receiverId,
        amount: utils.format.parseNearAmount(payload.amount.toString()),
      };
      const contractId = TOKEN_LIST[payload.symbol];
      console.log("ccontract ID : ",contractId)
console.log("the args sent : ",args)
      const transfer: FunctionCallAction = {
        type: 'FunctionCall',
        params: {
          methodName: 'ft_transfer',
          args: args,
          gas: THIRTY_TGAS,
          deposit: '1',
        },
      };
      const transferAction: TransferAction = {
        type: 'Transfer',
        params: {
               // @ts-ignore 
          deposit: utils.format.parseNearAmount(payload.amount.toString())
        
        }
      }

      
      await wallet.signAndSendTransaction({
        receiverId:  payload.receiverId,
        actions: [transferAction],
      });

      setSuccess(true);
      console.log(
        `Successfully transferred ${payload.amount.toString()} ${
          payload.symbol
        } to ${payload.receiverId}`
      );
    } catch (error) {
         // @ts-ignore 
      setError(error.message);
      console.error(
        `Failed to transfer ${payload.amount.toString()} ${payload.symbol} to ${
          payload.receiverId
        }:`,
        error
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {loading && <p>Transferring tokens... for payload : {`${JSON.stringify(payload)}`}</p>}
      {error && <p>Error: {error}</p>}
      {success && <p>Token transfer successful!</p>}
    </div>
  );
}