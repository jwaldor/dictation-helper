import { create } from 'zustand';

interface DocumentState {
  content: string;
  setContent: (content: string) => void;
  appendContent: (text: string) => void;
  clearContent: () => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  content: '',
  setContent: (content: string) => set({ content }),
  appendContent: (text: string) => 
    set((state) => ({ content: state.content + text })),
  clearContent: () => set({ content: '' }),
}));
