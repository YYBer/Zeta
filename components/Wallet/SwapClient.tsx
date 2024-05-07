'use client';
import { FunctionCallAction } from '@near-wallet-selector/core';
import { useWalletSelector } from '@/components/contexts/WalletSelectorContext';
import { useEffect, useState } from 'react';
import { 
  init_env,
  ftGetTokenMetadata,
  DCLSwapByInputOnBestPool,
} from '@ref-finance/ref-sdk'
import * as nearAPI from "near-api-js";
import { THIRTY_TGAS, connectionConfig, TOKEN_LIST, SwapPayload, MockSwapPayload, connectionTestConfig, TOKEN_TEST_LIST } from './constant'
import { getBalance } from './getBalanceClient'
const { utils, keyStores, connect, Contract } = nearAPI;

type ContractType = InstanceType<typeof Contract>;
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

interface REF_Contract extends ContractType {
  storage_balance_of: (args: { account_id: string }) => Promise<{total: string, available: string}>;
  storage_balance_bounds: (args: { account_id: string }) => Promise<{min: string, max: string}>;
}

export function PerformSwap({ payload }: { payload: SwapPayload }) {
  const { selector, modal, accounts } = useWalletSelector();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirmSwap, setConfirmSwap] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (payload && selector && modal && accounts.length > 0 && confirmSwap) {
      swap(payload);
    }
  }, [payload, selector, modal, accounts, confirmSwap]);

  async function handleConfirm() {
    setConfirmSwap(true);
    setCancelled(false);
  }

  async function handleCancel() {
    setConfirmSwap(false);
    setCancelled(true);
  }
  
  async function swap(payload: SwapPayload) {
    init_env('testnet');

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
      console.log(`Account ID: ${accountId}`);

      const tokenInBalance = getBalance(accountId, payload.tokenIn)
      if(parseFloat(await tokenInBalance) < parseFloat(payload.amountIn)){
        throw new Error('Insufficient balance');
        console.log("Insufficient balance")
      }

      const tokenIn = payload.tokenIn;
      const tokenOut = payload.tokenOut;
      const amountIn = payload.amountIn;
      // const tokenInContractId = TOKEN_LIST[tokenIn];
      // const tokenOutContractId = TOKEN_LIST[tokenOut];
      const tokenInContractId = TOKEN_TEST_LIST[tokenIn];
      const tokenOutContractId = TOKEN_TEST_LIST[tokenOut];
      // const refContractId = "v2.ref-finance.near"
      const refContractId = "ref-finance-101.testnet"
    
      // const nearConnection = await connect(connectionConfig);
      const nearConnection = await connect(connectionTestConfig);
      const userAccount = await nearConnection.account(accountId);
      
      const tokenInContract = new Contract(userAccount, tokenInContractId, {
          viewMethods: ['storage_balance_of', 'storage_balance_bounds', 'ft_metadata'],
          changeMethods: [],
      }) as unknown as NEP141_Contract;

      const tokenOutContract = new Contract(userAccount, tokenOutContractId, {
        viewMethods: ['storage_balance_of', 'storage_balance_bounds', 'ft_metadata'],
        changeMethods: [],
      }) as unknown as NEP141_Contract;

      const refContract = new Contract(userAccount, refContractId, {
        viewMethods: ['storage_balance_of', 'storage_balance_bounds'],
        changeMethods: [],
      }) as unknown as REF_Contract;

      // // get decimals of tokenIn contract
      // const metadata = await contract.ft_metadata();
      // const decimals = metadata.decimals;
      // const unit_convert = 10**decimals
      // console.log(`Decimals of ${tokenIn} contract: ${unit_convert}`);
    
      // get storage balance of user in tokenIn contract
      const storageBalanceOfTokenIn = await tokenInContract.storage_balance_of({ account_id: accountId });
      const storageBalanceOfTokenOut = await tokenOutContract.storage_balance_of({ account_id: accountId });
      const storageBalanceOfRef = await refContract.storage_balance_of({ account_id: accountId });
      // get storage balance bounds
      const boundsTokenIn = await tokenInContract.storage_balance_bounds({ account_id: accountId });
      const amount_should_be_deposit_tokenA = boundsTokenIn.min;
      const boundsTokenOut = await tokenOutContract.storage_balance_bounds({ account_id: accountId });
      const amount_should_be_deposit_tokenB = boundsTokenOut.min;
      const boundsRef = await refContract.storage_balance_bounds({ account_id: accountId });
      const amount_should_be_deposit_ref = boundsRef.min;

      // [action] storage deposit for user
      const args_storageDeposit = {
          account_id: accountId,
      }

      // In fact these two should be the same cause therotically the bound is the same
      const storageDepositForTokenA: FunctionCallAction = {
          type: 'FunctionCall',
          params: {
              methodName: 'storage_deposit',
              args: args_storageDeposit,
              gas: THIRTY_TGAS,
              deposit: amount_should_be_deposit_tokenA
          }
      }
      const storageDepositForTokenB: FunctionCallAction = {
        type: 'FunctionCall',
        params: {
            methodName: 'storage_deposit',
            args: args_storageDeposit,
            gas: THIRTY_TGAS,
            deposit: amount_should_be_deposit_tokenB
        }
      }
      const storageDepositForRef: FunctionCallAction = {
        type: 'FunctionCall',
        params: {
            methodName: 'storage_deposit',
            args: args_storageDeposit,
            gas: THIRTY_TGAS,
            deposit: amount_should_be_deposit_ref
        }
      }
      let tx = [];
      if (!storageBalanceOfTokenIn || storageBalanceOfTokenIn.total == '0') {
        console.log("tokenIn not registered!")
        tx.push({
          receiverId: tokenInContractId,
          actions: [storageDepositForTokenA]
        })
        // await wallet.signAndSendTransactions({
        //   transactions:[
        //     {
        //       receiverId: tokenInContractId,
        //       actions: [storageDepositForTokenA]
        //     }
        //   ]
        // })
      } 
      
      if(!storageBalanceOfTokenOut || storageBalanceOfTokenOut.total == '0'){
        console.log("tokenOut not registered!")
        tx.push({
          receiverId: tokenOutContractId,
          actions: [storageDepositForTokenB]
        })
        // await wallet.signAndSendTransactions({
        //   transactions:[
        //     {
        //       receiverId: tokenOutContractId,
        //       actions: [storageDepositForTokenB]
        //     }
        //   ]
        // })
      }
      
      if(!storageBalanceOfRef || storageBalanceOfRef.total == '0'){
        console.log("ref not registered!")
        tx.push({
          receiverId: refContractId,
          actions: [storageDepositForRef]
        })
        // await wallet.signAndSendTransactions({
        //   transactions:[
        //     {
        //       receiverId: refContractId,
        //       actions: [storageDepositForRef]
        //     }
        //   ]
        // })
      }

      console.log("storage tx: ", tx)

      // [tx] swap, using ref-sdk
      const tokenInMetadata = await ftGetTokenMetadata(tokenInContractId);
      const tokenOutMetadata = await ftGetTokenMetadata(tokenOutContractId);
      const swapTx = await DCLSwapByInputOnBestPool({
        tokenA: tokenInMetadata,
        tokenB: tokenOutMetadata,
        amountA: amountIn,
        slippageTolerance: payload.slippagetolerance,
        AccountId: accountId,
      })
      console.log(JSON.stringify(swapTx, null, 2))
      const i = swapTx.length;
      console.log("swapTx length: ", i)
      const receiverId = swapTx[i-1].receiverId;
      const functionCall = swapTx[i-1].functionCalls[0];
      const methodName = functionCall.methodName;
      const args = functionCall.args;
      const gas = functionCall.gas;
      const amount = "1";

      // Check if functionCall has all necessary properties
      if (receiverId && methodName && args && gas && amount) {
        console.log("get all functionCall")
        // Create the function call action
        const swapToken: FunctionCallAction = {
          type: 'FunctionCall',
          params: {
            methodName: methodName,
            args: args,
            gas: gas,
            deposit: amount
          }
        }

        tx.push({
            receiverId: tokenInContractId,
            actions: [swapToken]
          })
        } else {
        console.error('functionCall does not have all necessary properties');
        return;
        }      

      if (tx.length > 0) {
          await wallet.signAndSendTransactions({ transactions: tx });
      }      
      setSuccess(true);
      // TODO: implement the result of the swap
      console.log(`Successfully swap `);
    } catch (error) {
      // @ts-ignore
      setError(error.message);
      console.error(
        `Failed to swap :`,error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='text-black'>
      {loading && <p>Transferring tokens... for payload: {`${JSON.stringify(payload)}`}</p>}
      {/* {error && <p className="text-red-500">Error: {error}</p>} */}
      {success && <p className="text-green-500">Token transfer successful!</p>}
      {cancelled && <p className="text-red-500">Transaction Cancelled</p>}

      {!confirmSwap && !cancelled && (
        <div className="flex justify-center space-x-4 mt-4">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
            onClick={handleConfirm}
          >
            Confirm
          </button>
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      )}

      {confirmSwap && (
        <p className="text-center mt-2">Please approve the transaction on your wallet...</p>
      )}
    </div>
  );
}