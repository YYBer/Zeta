import { create } from 'zustand';

export const useInputJSONStore = create((set) => ({
  inputJSON: '',
  setInputJSON: (newPrompt) => set({ inputJSON: newPrompt }), 
}));

export const useWalletInfoStore = create((set) => ({
  walletInfo: '',
  setWalletInfo: (info) => set({ walletInfo: info }), 
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
 