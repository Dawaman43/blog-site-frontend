import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
  isDarkMode: boolean;
  toggleMode: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDarkMode: false,
      toggleMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
    }),
    { name: "theme-storage" }
  )
);
