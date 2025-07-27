import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

// Initialize MMKV storage
const storage = new MMKV();

// Custom MMKV storage adapter for Zustand
const mmkvStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    storage.set(name, value);
  },
  removeItem: (name: string) => {
    storage.delete(name);
  },
};

interface AppSettings {
  animationLightMode: boolean;
  notificationsEnabled: boolean;
  darkMode: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
}

interface NavigationState {
  activeTab: string;
  previousTab: string | null;
  navigationHistory: string[];
}

interface SystemStatus {
  isOnline: boolean;
  lastSync: number | null;
  convexConnected: boolean;
  telegramConnected: boolean;
}

interface AppStore {
  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  
  // Navigation
  navigation: NavigationState;
  setActiveTab: (tab: string) => void;
  goBack: () => void;
  clearNavigationHistory: () => void;
  
  // System Status
  systemStatus: SystemStatus;
  updateSystemStatus: (status: Partial<SystemStatus>) => void;
  
  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  
  // Error handling
  lastError: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const defaultSettings: AppSettings = {
  animationLightMode: false,
  notificationsEnabled: true,
  darkMode: false,
  autoRefresh: true,
  refreshInterval: 30,
};

const defaultNavigation: NavigationState = {
  activeTab: 'home',
  previousTab: null,
  navigationHistory: ['home'],
};

const defaultSystemStatus: SystemStatus = {
  isOnline: true,
  lastSync: null,
  convexConnected: false,
  telegramConnected: false,
};

export const useAppStore = create<AppStore>()(subscribeWithSelector(persist(
  (set) => ({
    // Settings
    settings: defaultSettings,
    updateSettings: (newSettings) => {
      set((state) => ({
        settings: { ...state.settings, ...newSettings },
      }));
    },
    resetSettings: () => {
      set({ settings: defaultSettings });
    },
    
    // Navigation
    navigation: defaultNavigation,
    setActiveTab: (tab) => {
      set((state) => {
        const newHistory = [...state.navigation.navigationHistory];
        if (newHistory[newHistory.length - 1] !== tab) {
          newHistory.push(tab);
          // Keep only last 10 items in history
          if (newHistory.length > 10) {
            newHistory.shift();
          }
        }
        
        return {
          navigation: {
            activeTab: tab,
            previousTab: state.navigation.activeTab,
            navigationHistory: newHistory,
          },
        };
      });
    },
    goBack: () => {
      set((state) => {
        const history = [...state.navigation.navigationHistory];
        if (history.length > 1) {
          history.pop(); // Remove current
          const previousTab = history[history.length - 1];
          return {
            navigation: {
              activeTab: previousTab,
              previousTab: state.navigation.activeTab,
              navigationHistory: history,
            },
          };
        }
        return state;
      });
    },
    clearNavigationHistory: () => {
      set((state) => ({
        navigation: {
          ...state.navigation,
          navigationHistory: [state.navigation.activeTab],
        },
      }));
    },
    
    // System Status
    systemStatus: defaultSystemStatus,
    updateSystemStatus: (status) => {
      set((state) => ({
        systemStatus: { ...state.systemStatus, ...status },
      }));
    },
    
    // Loading states
    isLoading: false,
    setLoading: (loading) => {
      set({ isLoading: loading });
    },
    
    // Error handling
    lastError: null,
    setError: (error) => {
      set({ lastError: error });
    },
    clearError: () => {
      set({ lastError: null });
    },
  }),
  {
    name: 'app-store',
    storage: createJSONStorage(() => mmkvStorage),
    // Only persist settings and some navigation state
    partialize: (state) => ({
      settings: state.settings,
      navigation: {
        activeTab: state.navigation.activeTab,
        previousTab: state.navigation.previousTab,
        navigationHistory: state.navigation.navigationHistory.slice(-3), // Keep only last 3
      },
    }),
  }
)));