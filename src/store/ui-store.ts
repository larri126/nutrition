import { create } from 'zustand';

interface UIStore {
    activeMergeId: string | null; // ¿Qué ventana está abierta? (null = ninguna)
    openMerge: (id: string) => void;
    closeMerge: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
    activeMergeId: null,
    openMerge: (id) => set({ activeMergeId: id }),
    closeMerge: () => set({ activeMergeId: null }),
}));