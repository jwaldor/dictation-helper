import { create } from "zustand";
import { persist, PersistStorage } from "zustand/middleware";

interface DocumentState {
  content: string;
  setContent: (content: string) => void;
  appendContent: (text: string) => void;
  clearContent: () => void;
}

const storage: PersistStorage<DocumentState> = {
  getItem: (name) => {
    try {
      const str = localStorage.getItem(name);
      return str ? JSON.parse(str) : null;
    } catch (e) {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, JSON.stringify(value));
    } catch (e) {
      // Ignore errors
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch (e) {
      // Ignore errors
    }
  },
};

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set) => ({
      content: "",
      setContent: (content: string) => set({ content }),
      appendContent: (text: string) =>
        set((state: DocumentState) => ({ content: state.content + text })),
      clearContent: () => set({ content: "" }),
    }),
    {
      name: "document-storage",
      storage,
    }
  )
);
