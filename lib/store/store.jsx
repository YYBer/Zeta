import { create } from 'zustand';

export const useInputJSONStore = create((set) => ({
  inputJSON: '',
  setInputJSON: (newPrompt) => set({ inputJSON: newPrompt }), 
}));

export const useWalletInfoStore = create((set) => ({
  walletInfo: '',
  setWalletInfo: (info) => set({ walletInfo: info }), 
}));

export const useTransferTokenStore = create((set) => ({
  success: false, 
  error: null, 
  confirm: false,
  loading: false,
  cancelled: false,
  messageCount: 0,
  setSuccess: (success) => set({ success }),
  setError: (error) => set({ error }),
  setConfirmTransfer: (confirm) => {
    console.log('confirm', confirm);
    set({ confirmTransfer : confirm })
  },
  setLoading : (loading) => set({ loading }),
  setCancelled : (isCancel) => set({ cancelled : isCancel }),
  setMessageCount: (messageCount) => set({ messageCount }),
}));
 
// export const useWalletStore = create((set) => ({
//   wallet: undefined,
//   signedAccountId: '',
//   setWallet: (wallet) => set({ wallet }),
//   setSignedAccountId: (signedAccountId) => {
//     console.log('useWalletStore', signedAccountId);
//     set({ signedAccountId })
//   }
// }));
 