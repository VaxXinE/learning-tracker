'use client';
import { create } from 'zustand';

type State = { 
  theme: 'dark'|'light'; 
  toggle: ()=>void;
};

export const useThemeStore = create<State>((set) => ({
  theme: 'dark', // Default theme for SSR
  toggle: () => set((s) => {
    const newTheme = s.theme === 'dark' ? 'light' : 'dark';
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.toggle('light', newTheme === 'light');
    }
    return { theme: newTheme };
  }),
}));

// Initialize theme from localStorage on client side
if (typeof window !== 'undefined') {
  const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
  if (savedTheme) {
    useThemeStore.setState({ theme: savedTheme });
  }
}
