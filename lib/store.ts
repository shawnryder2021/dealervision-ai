import { create } from "zustand";
import type { Dealership, Profile, Vehicle, GeneratedAsset } from "./types";

interface AppState {
  dealership: Dealership | null;
  profile: Profile | null;
  vehicles: Vehicle[];
  recentAssets: GeneratedAsset[];
  isLoading: boolean;

  setDealership: (dealership: Dealership | null) => void;
  setProfile: (profile: Profile | null) => void;
  setVehicles: (vehicles: Vehicle[]) => void;
  setRecentAssets: (assets: GeneratedAsset[]) => void;
  setIsLoading: (loading: boolean) => void;
  addAsset: (asset: GeneratedAsset) => void;
  updateAsset: (id: string, updates: Partial<GeneratedAsset>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  dealership: null,
  profile: null,
  vehicles: [],
  recentAssets: [],
  isLoading: true,

  setDealership: (dealership) => set({ dealership }),
  setProfile: (profile) => set({ profile }),
  setVehicles: (vehicles) => set({ vehicles }),
  setRecentAssets: (assets) => set({ recentAssets: assets }),
  setIsLoading: (isLoading) => set({ isLoading }),
  addAsset: (asset) =>
    set((state) => ({ recentAssets: [asset, ...state.recentAssets] })),
  updateAsset: (id, updates) =>
    set((state) => ({
      recentAssets: state.recentAssets.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    })),
}));
