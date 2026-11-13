import { create } from 'zustand';

export interface Toast {
  id: number;
  text: string;
  kind: 'info' | 'success' | 'error' | 'reward';
}

interface UiState {
  toasts: Toast[];
  toast: (text: string, kind?: Toast['kind']) => void;
  dismissToast: (id: number) => void;
  debugVisible: boolean;
  toggleDebug: () => void;
  musicOn: boolean;
  sfxOn: boolean;
  setMusic: (on: boolean) => void;
  setSfx: (on: boolean) => void;
}

let toastId = 0;

export const useUiStore = create<UiState>()((set) => ({
  toasts: [],
  toast: (text, kind = 'info') => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, text, kind }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2600);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  debugVisible: false,
  toggleDebug: () => set((s) => ({ debugVisible: !s.debugVisible })),
  musicOn: (() => {
    try {
      return localStorage.getItem('fq_music') !== '0';
    } catch {
      return true;
    }
  })(),
  sfxOn: (() => {
    try {
      return localStorage.getItem('fq_sfx') !== '0';
    } catch {
      return true;
    }
  })(),
  setMusic: (on) => {
    try {
      localStorage.setItem('fq_music', on ? '1' : '0');
    } catch {
      /* ignore */
    }
    set({ musicOn: on });
  },
  setSfx: (on) => {
    try {
      localStorage.setItem('fq_sfx', on ? '1' : '0');
    } catch {
      /* ignore */
    }
    set({ sfxOn: on });
  },
}));
