import { create } from "zustand";
import GMDMapper from "../gmdMapping";

export interface GMDMapState {
  fileName: string;
  isMappingCorrect: boolean | null;
  mappedColumns: {
    [key: string]: string;
  };
  unMappedColumns: string[];
  unMappedHeaders: string[];
  columnTypes: { [key: string]: string };
  requiredColumns: { [key: string]: string };
}

interface GMDState {
  mapping: GMDMapState[];
  pushMap: (map: GMDMapState) => void;
  clearMapping: () => void;
  editMapping: (map: GMDMapState) => void;
  setMappingCorrect: (value: boolean, fileName: string, index: number) => void;
}

export const useGMDMappingStore = create<GMDState>()((set) => ({
  mapping: [],
  clearMapping: () => set({ mapping: [] }),
  pushMap: (map) => set((state) => ({ mapping: [...state.mapping, map] })),
  editMapping: (map) => {
    set((state) => ({
      mapping: [
        ...state.mapping.map((m) => {
          if (m.fileName === map.fileName) {
            return map;
          }
          return m;
        }),
      ],
    }));
  },

  setMappingCorrect: (value, filename, index) =>
    set((state) => ({
      mapping: state.mapping.map((map, index2) => {
        if (map.fileName === filename && index2 === index) {
          return {
            ...map,
            isMappingCorrect: value,
          };
        }
        return map;
      }),
    })),
}));
