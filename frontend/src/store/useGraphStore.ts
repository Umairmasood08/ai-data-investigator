import { create } from "zustand";

type State = {
  selectedNode: any;
  setSelectedNode: (node: any) => void;
};

export const useGraphStore = create<State>((set) => ({
  selectedNode: null,
  setSelectedNode: (node) => set({ selectedNode: node }),
}));