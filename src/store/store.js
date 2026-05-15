import { create } from 'zustand';
import { saveKeyToVault, getKeyFromVault } from '../utils/keyVault';

const getInitialTheme = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedPrefs = window.localStorage.getItem('color-theme');
    if (typeof storedPrefs === 'string') return storedPrefs;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  }
  return 'light';
};

const getInitialLanguage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem('language');
    if (stored) return stored;
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.toLowerCase().startsWith('es')) return 'es';
  }
  return 'pt';
};

// BUSCA A AUTORIZAÇÃO SALVA PARA EVITAR LOGAR NO REFRESH
const getInitialAuth = () => {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    return window.sessionStorage.getItem('isAuthorized') === 'true';
  }
  return false;
};

export const useAppStore = create((set, get) => ({
  user: null, userRole: null, 
  isAuthorized: getInitialAuth(), // Inicializa lendo do SessionStorage
  activeHub: null, activeHubKey: null, userHubs: [],
  theme: getInitialTheme(), language: getInitialLanguage(), igsUsers: [],
  
  dialog: null,
  openDialog: (config) => set({ dialog: config }),
  closeDialog: () => set({ dialog: null }),

  setUser: (user, role) => set({ user, userRole: role }),
  
  setAuthorized: (status) => {
    if (status) {
      sessionStorage.setItem('isAuthorized', 'true');
    } else {
      sessionStorage.removeItem('isAuthorized');
      sessionStorage.removeItem('masterKey'); // Limpa a chave por segurança
    }
    set({ isAuthorized: status });
  },

  setUserHubs: (hubs) => set({ userHubs: hubs }),
  setIgsUsers: (users) => set({ igsUsers: users }),

  toggleTheme: () => {
    const { theme } = get();
    const newTheme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('color-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    set({ theme: newTheme });
  },

  toggleLanguage: () => {
    const { language } = get();
    const newLang = language === 'pt' ? 'es' : 'pt';
    localStorage.setItem('language', newLang);
    set({ language: newLang });
  },
  
  setActiveHub: (hub, providedKey = null) => {
    const state = get();
    const userId = state.user?.uid;
    if (providedKey) {
      saveKeyToVault(userId, hub.id, providedKey);
      set({ activeHub: hub, activeHubKey: providedKey });
      return true;
    }
    const vaultKey = getKeyFromVault(userId, hub.id);
    if (vaultKey) {
      set({ activeHub: hub, activeHubKey: vaultKey });
      return true;
    }
    return false;
  },
  clearActiveHub: () => set({ activeHub: null, activeHubKey: null }),
}));