'use client';
import { FunctionCallAction } from '@near-wallet-selector/core';
import { useWalletSelector } from '@/components/contexts/WalletSelectorContext';
import { useEffect, useState } from 'react';
import { TransferAction } from '@near-wallet-selector/core';
import * as nearAPI from "near-api-js";
import { register } from 'module';
import { deployContract } from 'near-api-js/lib/transaction';
const { utils, keyStores, connect, Contract } = nearAPI;
type ContractType = InstanceType<typeof Contract>;
import { PiSpinnerGapBold } from "react-icons/pi";


interface NEP141_Contract extends ContractType {
  ft_balance_of: (args: { account_id: string }) => Promise<string>;
  storage_balance_of: (args: { account_id: string }) => Promise<{total: string, available: string}>;
  storage_balance_bounds: (args: { account_id: string }) => Promise<{min: string, max: string}>;
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

const THIRTY_TGAS = '30000000000000';

// testnet tokenlist
// const TOKEN_LIST: { [key: string]: string } = {
//   NEAR: 'NEAR',
//   USDC: 'usdc.fakes.testnet'
//   // Add other token symbols and their contract IDs
// };

// // mainnet tokenlist
const TOKEN_LIST: { [key: string]: string } = {
  // NEAR: 'NEAR', neeed to used wrapper contract
  USDC: '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1'
};

export interface Payload {
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
  const [confirmTransfer, setConfirmTransfer] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  console.log('payload', payload)

  useEffect(() => {
    if (payload && selector && modal && accounts.length > 0 && confirmTransfer) {
      transferToken(payload);
    }
  }, [payload, selector, modal, accounts, confirmTransfer]);

  async function handleConfirm() {
    setConfirmTransfer(true);
    setCancelled(false);
  }

  async function handleCancel() {
    setConfirmTransfer(false);
    setCancelled(true);
  }

  async function transferToken(payload: Payload) {
    setLoading(true);
    setError(null);
    setSuccess(false);
    console.log(JSON.stringify(payload));
    try {
      const wallet = await selector.wallet();
      const accountId = accounts.find((account) => account.active)?.accountId;
      if (!accountId) {
        throw new Error('No active account found');
      }

      const user_id = payload.userId;
      const receiver_id = payload.receiverId;
      const symbol = payload.symbol;
      const tokenContractId = TOKEN_LIST[symbol];

      // // testnet config
      // const connectionConfig = {
      //   networkId: "testnet",
      //   keyStore: new keyStores.BrowserLocalStorageKeyStore(),
      //   nodeUrl: "https://rpc.testnet.near.org",
      //   walletUrl: "https://testnet.mynearwallet.com/",
      //   helperUrl: "https://helper.testnet.near.org",
      //   explorerUrl: "https://testnet.nearblocks.io",
      // };

      // // mainnet config
      const connectionConfig = {
        networkId: "mainnet",
        keyStore: new keyStores.BrowserLocalStorageKeyStore(),
        nodeUrl: "https://rpc.mainnet.near.org",
        walletUrl: "https://wallet.mainnet.near.org",
        helperUrl: "https://helper.mainnet.near.org",
        explorerUrl: "https://nearblocks.io",
      };

      const nearConnection = await connect(connectionConfig);
      const receiver_account = await nearConnection.account(user_id);
      
      const contract = new Contract(receiver_account, tokenContractId, {
          viewMethods: ['storage_balance_of', 'storage_balance_bounds', 'ft_metadata'],
          changeMethods: [],
      }) as unknown as NEP141_Contract;

      // get decimals of token contract
      const metadata = await contract.ft_metadata();
      const decimals = metadata.decimals;
      const unit_convert = 10**decimals
      console.log(`Decimals of ${symbol} contract: ${unit_convert}`);
    
      // get storage balance of receiver first
      const storage_balance_of_receiver = await contract.storage_balance_of({ account_id: receiver_id });
      console.log(`Storage Balance of ${receiver_id} in ${symbol} contract: ${storage_balance_of_receiver}`);        

      // get storage balance bounds
      const bounds = await contract.storage_balance_bounds({ account_id: receiver_id });
      const amount_should_be_deposit = bounds.min;

      // // sender way
      // const stroage_deposit ={
      //   receiverId: tokenContractId,
      //   actions:[
      //     {
      //       methodName: 'storage_deposit',
      //       args: {
      //         accountId: receiver_id,
      //         registeration_only: true
      //       },
      //       gas: THIRTY_TGAS,
      //       deposit: amount_should_be_deposit
      //     }
      //   ]
      // }

      // [action] storage deposit for receiver
      const args_storageDeposit = {
          account_id: receiver_id,
      }
      const storageDepositForReceiver: FunctionCallAction = {
          type: 'FunctionCall',
          params: {
              methodName: 'storage_deposit',
              args: args_storageDeposit,
              gas: THIRTY_TGAS,
              deposit: amount_should_be_deposit
          }
      }

      // [action] transfer NEAR
      const transferNear: TransferAction = {
        type: 'Transfer',
        params: {
          // @ts-ignore
          deposit: utils.format.parseNearAmount(payload.amount.toString())
        }
      };
      
      // [action] transfer token
      const args_transferToken = {
        receiver_id: payload.receiverId,
        amount: BigInt(Math.round(parseFloat(payload.amount) * unit_convert)).toString(),
      };
      const transferToken: FunctionCallAction = {
        type: 'FunctionCall',
        params: {
          methodName: 'ft_transfer',
          args: args_transferToken,
          gas: THIRTY_TGAS,
          deposit: '1'
        }
      }      

      if (payload.symbol == 'NEAR') {
        await wallet.signAndSendTransaction({
          receiverId: payload.receiverId,
          actions: [transferNear],
        });
      } 
      else if (!storage_balance_of_receiver) {
        console.log("reciever not registered!")

        await wallet.signAndSendTransactions({
          transactions:[
            {
              receiverId: tokenContractId,
              actions: [storageDepositForReceiver, transferToken]
            },
            // {
            //   receiverId: tokenContractId,
            //   actions: [transferToken]
            // }
          ]
        })
      } 
      else {
        await wallet.signAndSendTransaction({
          receiverId: tokenContractId,
          actions: [transferToken]
        })
      }

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
    <div className='text-black'>
      {loading && 
        <div className='flex flex-col gap-2'>
          <div className='flex gap-2 items-center text-[#0EA5E9]'><PiSpinnerGapBold className='spinner'/><div>Simulating the transfer</div></div>
          <div className='mb-2'>We will simulate whether the transaction is successful. This is a simulated transaction, not an actual one.</div>
        </div>
      }
      {/* {error && <p className="text-red-500">Error: {error}</p>} */}
      {success && <p className="text-green-500">Token transfer successful!</p>}
      {cancelled && <p className="text-red-500">Transaction Cancelled</p>}

      {!confirmTransfer && !cancelled && (
        <div className="flex space-x-4 my-2">
          <button
            className="px-4 py-2 bg-[#0EA5E9] w-3/4 text-white rounded-full hover:bg-blue-600"
            onClick={handleConfirm}
          >
            Confirm
          </button>
          <button
            className="px-4 py-2 border-[#0EA5E9] w-1/4 border text-[#0EA5E9] rounded-full hover:bg-gray-600"
            onClick={handleCancel}
          >
            Not now
          </button>
        </div>
      )}

      {/* {confirmTransfer && (
        <p className="text-center mt-2">Please approve the transaction on your wallet...</p>
      )} */}
    </div>
  );
}
