'use client'
import { FunctionCallAction } from '@near-wallet-selector/core'
import { useWalletSelector } from '@/components/contexts/WalletSelectorContext'
import { useEffect, useState } from 'react'
import {
  init_env,
  ftGetTokenMetadata,
  DCLSwapByInputOnBestPool
} from '@ref-finance/ref-sdk'
import * as nearAPI from 'near-api-js'
import {
  THIRTY_TGAS,
  TOKEN_LIST,
  SwapPayload,
  MockSwapPayload,
  getConnectionConfig,
  TOKEN_TEST_LIST
} from './constant'
import { getBalance } from './getBalanceClient'
const { utils, keyStores, connect, Contract } = nearAPI
import { PiSpinnerGapBold } from 'react-icons/pi'
import { useTransferTokenStore } from '@/lib/store/store'

type ContractType = InstanceType<typeof Contract>
interface NEP141_Contract extends ContractType {
  ft_balance_of: (args: { account_id: string }) => Promise<string>
  storage_balance_of: (args: {
    account_id: string
  }) => Promise<{ total: string; available: string }>
  storage_balance_bounds: (args: {
    account_id: string
  }) => Promise<{ min: string; max: string }>
  ft_metadata: () => Promise<{
    spec: string
    name: string
    symbol: string
    icon: string
    reference: null | string
    reference_hash: null | string
    decimals: number
  }>
}

interface REF_Contract extends ContractType {
  storage_balance_of: (args: {
    account_id: string
  }) => Promise<{ total: string; available: string }>
  storage_balance_bounds: (args: {
    account_id: string
  }) => Promise<{ min: string; max: string }>
}

export function PerformSwap({ payload }: { payload: SwapPayload }) {
  const { selector, modal, accounts } = useWalletSelector()
  // const [loading, setLoading] = useState(false)
  // const [error, setError] = useState<string | null>(null)
  // const [success, setSuccess] = useState(false)
  // const [confirmSwap, setConfirmSwap] = useState(false)
  // const [cancelled, setCancelled] = useState(false)
  const {
    setSuccess,
    error,
    success,
    setError,
    confirmSwap,
    setConfirmSwap,
    loading,
    setLoading,
    cancelled,
    setCancelled
  } = useTransferTokenStore()

  useEffect(() => {
    if (payload && selector && modal && accounts.length > 0 && confirmSwap) {
      swap(payload)
    }
  }, [payload, selector, modal, accounts, confirmSwap])

  async function handleConfirm() {
    setConfirmSwap(true)
    setCancelled(false)
  }

  async function handleCancel() {
    setConfirmSwap(false)
    setCancelled(true)
  }

  async function swap(payload: SwapPayload) {
    // init_env('testnet')

    setLoading(true)
    setError(null)
    setSuccess(false)
    console.log(JSON.stringify(payload))
    try {
      const wallet = await selector.wallet()
      const accountId = accounts.find(account => account.active)?.accountId
      if (!accountId) {
        throw new Error('No active account found')
      }
      console.log(`Account ID: ${accountId}`)

      const tokenIn = payload.tokenIn
      const tokenOut = payload.tokenOut
      const amountIn = payload.amountIn
      const tokenInContractId = TOKEN_LIST[tokenIn]
      const tokenOutContractId = TOKEN_LIST[tokenOut]
      //const refContractId = 'ref-finance-101.testnet'
      const refContractId = "v2.ref-finance.near"
      let connectionConfig = getConnectionConfig('mainnet')
      const nearConnection = await connect(connectionConfig)
      const userAccount = await nearConnection.account(accountId)

      const tokenInContract = new Contract(userAccount, tokenInContractId, {
        viewMethods: [
          'storage_balance_of',
          'storage_balance_bounds',
          'ft_metadata',
          'ft_balance_of'
        ],
        changeMethods: []
      }) as unknown as NEP141_Contract

      const tokenOutContract = new Contract(userAccount, tokenOutContractId, {
        viewMethods: [
          'storage_balance_of',
          'storage_balance_bounds',
          'ft_metadata'
        ],
        changeMethods: []
      }) as unknown as NEP141_Contract

      const refContract = new Contract(userAccount, refContractId, {
        viewMethods: ['storage_balance_of', 'storage_balance_bounds'],
        changeMethods: []
      }) as unknown as REF_Contract

      // console.log('accountId', accountId)
      // get storage balance of user in tokenIn contract
      const storageBalanceOfTokenIn = await tokenInContract.storage_balance_of({
        account_id: accountId
      })
      const storageBalanceOfTokenOut =
        await tokenOutContract.storage_balance_of({ account_id: accountId })
      const storageBalanceOfRef = await refContract.storage_balance_of({
        account_id: accountId
      })
      // get storage balance bounds
      const boundsTokenIn = await tokenInContract.storage_balance_bounds({
        account_id: accountId
      })
      const amount_should_be_deposit_tokenA = boundsTokenIn.min
      const boundsTokenOut = await tokenOutContract.storage_balance_bounds({
        account_id: accountId
      })
      const amount_should_be_deposit_tokenB = boundsTokenOut.min
      const boundsRef = await refContract.storage_balance_bounds({
        account_id: accountId
      })
      const amount_should_be_deposit_ref = boundsRef.min

      // [action] storage deposit for user
      const args_storageDeposit = {
        account_id: accountId
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
      let tx = []
      if (!storageBalanceOfTokenIn || storageBalanceOfTokenIn.total == '0') {
        console.log('tokenIn not registered!')
        tx.push({
          receiverId: tokenInContractId,
          actions: [storageDepositForTokenA]
        })
      }

      // const balanceOfWrappedNEAR = await tokenInContract.ft_balance_of({ account_id: accountId });
      // const amountInInYocto = utils.format.parseNearAmount(amountIn) || '0';
      // console.log("balanceOfWrappedNEAR: ", balanceOfWrappedNEAR)
      // console.log("amountIn: ", amountInInYocto)
      if(tokenIn == "NEAR" /*&& BigInt(balanceOfWrappedNEAR) < BigInt(amountInInYocto)*/){
        console.log("NEAR -> wNEAR")
        const amountInYocto = utils.format.parseNearAmount(amountIn) || '0';
        const nearDeposit: FunctionCallAction = {
          type: 'FunctionCall',
          params: {
              methodName: 'near_deposit',
              args: {},
              gas: THIRTY_TGAS,
              deposit: amountInYocto || '0'
          }
        }
        tx.push({
          receiverId: tokenInContractId,
          actions: [nearDeposit]
        })
      }      

      if (!storageBalanceOfTokenOut || storageBalanceOfTokenOut.total == '0') {
        console.log('tokenOut not registered!')
        tx.push({
          receiverId: tokenOutContractId,
          actions: [storageDepositForTokenB]
        })
      }

      if (!storageBalanceOfRef || storageBalanceOfRef.total == '0') {
        console.log('ref not registered!')
        tx.push({
          receiverId: refContractId,
          actions: [storageDepositForRef]
        })
      }

      console.log('storage tx: ', tx)

      // [tx] swap, using ref-sdk
      const tokenInMetadata = await ftGetTokenMetadata(tokenInContractId)
      const tokenOutMetadata = await ftGetTokenMetadata(tokenOutContractId)
      const swapTx = await DCLSwapByInputOnBestPool({
        tokenA: tokenInMetadata,
        tokenB: tokenOutMetadata,
        amountA: amountIn,
        slippageTolerance: payload.slippageTolerance,
        AccountId: accountId
      })
      console.log(JSON.stringify(swapTx, null, 2))

      const i = swapTx.length
      console.log('swapTx length: ', i)
      const receiverId = swapTx[i - 1].receiverId
      const functionCall = swapTx[i - 1].functionCalls[0]
      const methodName = functionCall.methodName
      const args = functionCall.args
      const gas = functionCall.gas
      const amount = '1'

      // Check if functionCall has all necessary properties
      if (receiverId && methodName && args && gas && amount) {
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
        console.error('functionCall does not have all necessary properties')
        return
      }

      if (tx.length > 0) {
        await wallet.signAndSendTransactions({ transactions: tx })
        console.log('here!')
      }
      setSuccess(true)
      // TODO: implement the result of the swap
      console.log(`Successfully swap `)
    } catch (error) {
      // @ts-ignore
      setError(error.message)
      console.error(`Failed to swap :`, error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="text-black">
      {!cancelled && (
        <div className="flex space-x-4 my-4">
          <button
            className="lg:px-4 py-2 w-1/4 border border-[#9CA8B4] rounded-full text-[#9CA8B4] font-medium hover:bg-[#9CA8B4]/10 hover:border-[#9CA8B4] active:bg-[#9CA8B4] active:border-[#9CA8B4]"
            onClick={handleCancel}
          >
            Not now
          </button>
          <button
            className="lg:px-4 py-2 bg-[#38BDF8] w-3/4 text-white text-base font-bold rounded-full hover:bg-[#0EA5E9] active:bg-[#0EA5E9] flex items-center justify-center gap-2"
            onClick={handleConfirm}
          >
            {loading ? (
              <>
                <PiSpinnerGapBold className="spinner" />
                Processing
              </>
            ) : (
              'Confirm'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
