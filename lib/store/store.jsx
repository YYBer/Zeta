import { create } from 'zustand';

export const useInputPromptStore = create((set) => ({
  promptInput: '',
  setPromptInput: (newPrompt) => set({ promptInput: newPrompt }), 
}));
