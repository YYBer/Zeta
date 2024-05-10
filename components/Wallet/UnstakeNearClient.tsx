'use client'
import { FunctionCallAction } from '@near-wallet-selector/core'
import { useWalletSelector } from '@/components/contexts/WalletSelectorContext'
import { useEffect, useState } from 'react'
import * as nearAPI from 'near-api-js'
import { useTransferTokenStore } from '@/lib/store/store'
import {
  THIRTY_TGAS,
  getConnectionConfig,
  TOKEN_LIST,
  UnstakePayload
} from './constant'
import { PiSpinnerGapBold } from 'react-icons/pi'

const { connect, Contract } = nearAPI
// const THIRTY_TGAS = '30000000000000'
type ContractType = InstanceType<typeof Contract>
interface MetaPool_Contract extends ContractType {
  ft_balance_of: (args: { account_id: string }) => Promise<string>
}

export function UnstakeNEAR({ payload }: { payload: UnstakePayload }) {
  const { selector, modal, accounts } = useWalletSelector()
  // const [loading, setLoading] = useState(false)
  // const [error, setError] = useState<string | null>(null)
  // const [success, setSuccess] = useState(false)
  // const [confirmUnstake, setConfirmUnstake] = useState(false)
  // const [cancelled, setCancelled] = useState(false)
  const {
    setSuccess,
    error,
    success,
    setError,
    confirmUnstake,
    setConfirmUnstake,
    loading,
    setLoading,
    cancelled,
    setCancelled
  } = useTransferTokenStore()

  useEffect(() => {
    if (payload && selector && modal && accounts.length > 0 && confirmUnstake) {
      unstakeNEAR(payload)
    }
  }, [payload, selector, modal, accounts, confirmUnstake])

  async function handleConfirm() {
    setConfirmUnstake(true)
    setCancelled(false)
  }

  async function handleCancel() {
    setConfirmUnstake(false)
    setCancelled(true)
  }

  async function unstakeNEAR(payload: UnstakePayload) {
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

      //const tokenSymbol = payload.symbol;
      //const tokenId = TOKEN_LIST[tokenSymbol];
      //const amountInYocto = utils.format.parseNearAmount(payload.amount);
      const MetaPoolContractId = 'meta-pool.near'
      let connectionConfig = getConnectionConfig('mainnet')
      // const connectionConfig = {
      //   networkId: 'mainnet',
      //   keyStore: new keyStores.BrowserLocalStorageKeyStore(),
      //   nodeUrl: 'https://rpc.mainnet.near.org',
      //   walletUrl: 'https://wallet.mainnet.near.org',
      //   helperUrl: 'https://helper.mainnet.near.org',
      //   explorerUrl: 'https://nearblocks.io'
      // }

      const nearConnection = await connect(connectionConfig)
      const userAccount = await nearConnection.account(accountId)

      const contract = new Contract(userAccount, MetaPoolContractId, {
        viewMethods: ['ft_balance_of'],
        changeMethods: []
      }) as unknown as MetaPool_Contract
      const stNearBalance = await contract.ft_balance_of({
        account_id: accountId
      })

      // deposit_and_stake will automatically deposit if not registered
      // [action] transfer token (no args needed)
      const unstakeNEAR: FunctionCallAction = {
        type: 'FunctionCall',
        params: {
          methodName: 'liquid_unstake',
          args: {
            st_near_to_burn: stNearBalance,
            min_expected_near: '0' // how to calculate this?
          },
          gas: THIRTY_TGAS,
          deposit: '0'
        }
      }
      await wallet.signAndSendTransaction({
        receiverId: MetaPoolContractId,
        actions: [unstakeNEAR]
      })

      setSuccess(true)
      // TODO: implement the result of the swap
      console.log(`Successfully unstake `)
    } catch (error) {
      // @ts-ignore
      setError(error.message)
      console.error(`Failed to stake:`, error)
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
