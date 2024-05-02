import { create } from 'zustand';

export const useInputPromptStore = create((set) => ({
  promptInput: '',
  setPromptInput: (newPrompt) => set({ promptInput: newPrompt }), 
}));

export const useWalletStore = create((set) => ({
  wallet: undefined,
  signedAccountId: '',
  setWallet: (wallet) => set({ wallet }),
  setSignedAccountId: (signedAccountId) => {
    console.log('useWalletStore', signedAccountId);
    set({ signedAccountId })
  }
}));
 