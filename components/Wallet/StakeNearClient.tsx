'use client'
import { FunctionCallAction } from '@near-wallet-selector/core'
import { useWalletSelector } from '@/components/contexts/WalletSelectorContext'
import { useEffect, useState } from 'react'
import * as nearAPI from 'near-api-js'
import { useTransferTokenStore } from '@/lib/store/store'
import { PiSpinnerGapBold } from 'react-icons/pi'

const { utils } = nearAPI
// const THIRTY_TGAS = '30000000000000'
import {
  THIRTY_TGAS,
  getConnectionConfig,
  TOKEN_LIST,
  StakePayload
} from './constant'

export function StakeNEAR({ payload }: { payload: StakePayload }) {
  const { selector, modal, accounts } = useWalletSelector()
  // const [loading, setLoading] = useState(false)
  // const [error, setError] = useState<string | null>(null)
  // const [success, setSuccess] = useState(false)
  // const [confirmStake, setConfirmState] = useState(false)
  // const [cancelled, setCancelled] = useState(false)
  const {
    setSuccess,
    error,
    success,
    setError,
    confirmStake,
    setConfirmStake,
    loading,
    setLoading,
    cancelled,
    setCancelled
  } = useTransferTokenStore()

  useEffect(() => {
    if (payload && selector && modal && accounts.length > 0 && confirmStake) {
      stakeNEAR(payload)
    }
  }, [payload, selector, modal, accounts, confirmStake])

  async function handleConfirm() {
    setConfirmStake(true)
    setCancelled(false)
  }

  async function handleCancel() {
    setConfirmStake(false)
    setCancelled(true)
  }

  async function stakeNEAR(payload: StakePayload) {
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
      const amountInYocto = utils.format.parseNearAmount(payload.amount)
      const MetaPoolContractId = 'meta-pool.near'

      // deposit_and_stake will automatically deposit if not registered
      // [action] transfer token (no args needed)
      const stakeNEAR: FunctionCallAction = {
        type: 'FunctionCall',
        params: {
          methodName: 'deposit_and_stake',
          args: {},
          gas: THIRTY_TGAS,
          deposit: amountInYocto || '0'
        }
      }
      await wallet.signAndSendTransaction({
        receiverId: MetaPoolContractId,
        actions: [stakeNEAR]
      })

      setSuccess(true)
      // TODO: implement the result of the swap
      console.log(`Successfully stake! `)
    } catch (error) {
      // @ts-ignore
      setError(error.message)
      console.error(`Failed to stake :`, error)
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
