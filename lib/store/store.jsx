import { create } from 'zustand'

export const useInputJSONStore = create(set => ({
  inputJSON: '',
  transferObject: {},
  swapObject: {},
  setInputJSON: newPrompt => set({ inputJSON: newPrompt }),
  setTransferObject: transferObject => set({ transferObject }),
  setSwapObject: swapObject => set({ swapObject })
}))

export const useWalletInfoStore = create(set => ({
  walletInfo: '',
  setWalletInfo: info => set({ walletInfo: info })
}))

export const useTransferTokenStore = create(set => ({
  success: false,
  error: false,
  confirm: false,
  loading: false,
  cancelled: false,
  messageCount: 0,
  confirmSwap: false,
  confirmTransfer: false,
  setSuccess: success => set({ success }),
  setError: error => set({ error }),
  setConfirmTransfer: confirm => {
    set({ confirmTransfer: confirm })
  },
  setConfirmSwap: confirm => {
    set({ confirmSwap: confirm })
  },
  setLoading: loading => set({ loading }),
  setCancelled: isCancel => set({ cancelled: isCancel }),
  setMessageCount: messageCount => set({ messageCount })
}))

// export const useWalletStore = create((set) => ({
//   wallet: undefined,
//   signedAccountId: '',
//   setWallet: (wallet) => set({ wallet }),
//   setSignedAccountId: (signedAccountId) => {
//     console.log('useWalletStore', signedAccountId);
//     set({ signedAccountId })
//   }
// }));
