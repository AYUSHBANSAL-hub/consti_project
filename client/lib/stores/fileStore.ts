import { create } from "zustand";

interface FileStoreState {
  files: File[];
  setFiles: (files: File[]) => void;
}

export const useFileStore = create<FileStoreState>()((set) => ({
  files: [],
  setFiles: (files: File[]) => {
    set({ files });
  },
}));
