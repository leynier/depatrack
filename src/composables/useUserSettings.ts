import { useNetworkStatus } from '@/composables/useNetworkStatus';
import i18n from '@/i18n';
import { analyticsService } from '@/services/analytics';
import { UserSettingsService } from '@/services/user-settings';
import { useAuthStore } from '@/stores/auth';
import type { PropertyFilters, PropertySort } from '@/types/property';
import type { Language, Theme, UserSettings, UserSettingsFormData, ColumnVisibilitySettings } from '@/types/user-settings';
import { ref } from 'vue';

const STORAGE_KEYS = {
  theme: 'depatrack-theme',
  language: 'locale',
  filters: 'depatrack-filters',
  sort: 'depatrack-sort',
  columnVisibility: 'depatrack-column-visibility'
};

// Global state
const currentSettings = ref<UserSettings>({
  theme: 'light',
  language: 'en',
  filters: {},
  sort: { field: 'zone', direction: 'asc' },
  columnVisibility: {
    zone: true,
    price: true,
    status: true,
    actions: true,
    appointment: true,
    realEstate: true,
    requirements: true,
    comments: true,
    links: true
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

const isLoading = ref(false);
const isSyncing = ref(false);
const lastSyncTime = ref<Date | null>(null);

let unsubscribeFromFirestore: (() => void) | null = null;

function safeJSONParse<T>(jsonString: string | null, fallback: T): T {
  if (!jsonString || jsonString === 'undefined' || jsonString === 'null') {
    return fallback;
  }
  
  try {
    const parsed = JSON.parse(jsonString);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (error) {
    console.warn('Failed to parse JSON from localStorage:', error);
    return fallback;
  }
}

function getDefaultSettings(): UserSettings {
  // Get system theme preference
  const systemTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  
  // Get browser language preference
  const browserLanguage = navigator.language.split('-')[0];
  const defaultLanguage = browserLanguage === 'es' ? 'es' : 'en';
  
  return {
    theme: systemTheme,
    language: defaultLanguage,
    filters: {},
    sort: { field: 'zone', direction: 'asc' },
    columnVisibility: {
      zone: true,
      price: true,
      status: true,
      actions: true,
      appointment: true,
      realEstate: true,
      requirements: true,
      comments: true,
      links: true
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function loadLocalSettings(): UserSettings {
  const storedTheme = localStorage.getItem(STORAGE_KEYS.theme);
  const storedLanguage = localStorage.getItem(STORAGE_KEYS.language);
  const storedFilters = localStorage.getItem(STORAGE_KEYS.filters);
  const storedSort = localStorage.getItem(STORAGE_KEYS.sort);
  const storedColumnVisibility = localStorage.getItem(STORAGE_KEYS.columnVisibility);
  
  const defaults = getDefaultSettings();
  
  return {
    theme: (storedTheme && ['light', 'dark'].includes(storedTheme)) ? storedTheme as Theme : defaults.theme,
    language: (storedLanguage && ['en', 'es'].includes(storedLanguage)) ? storedLanguage as Language : defaults.language,
    filters: safeJSONParse(storedFilters, defaults.filters),
    sort: safeJSONParse(storedSort, defaults.sort),
    columnVisibility: safeJSONParse(storedColumnVisibility, defaults.columnVisibility),
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function saveLocalSettings(settings: UserSettings): void {
  localStorage.setItem(STORAGE_KEYS.theme, settings.theme);
  localStorage.setItem(STORAGE_KEYS.language, settings.language);
  localStorage.setItem(STORAGE_KEYS.filters, JSON.stringify(settings.filters));
  localStorage.setItem(STORAGE_KEYS.sort, JSON.stringify(settings.sort));
  localStorage.setItem(STORAGE_KEYS.columnVisibility, JSON.stringify(settings.columnVisibility));
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function useUserSettings() {
  const userSettingsService = UserSettingsService.getInstance();
  const authStore = useAuthStore();
  const { isOnline } = useNetworkStatus();

  // Load settings from localStorage immediately
  const loadSettings = () => {
    isLoading.value = true;
    try {
      const localSettings = loadLocalSettings();
      currentSettings.value = localSettings;
      
      // Apply theme immediately
      applyTheme(localSettings.theme);
      
      // Apply language immediately
      i18n.global.locale.value = localSettings.language;
      
      // If user is authenticated and online, sync with Firebase
      if (authStore.isAuthenticated && isOnline.value) {
        syncWithFirebase();
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Fallback to defaults
      currentSettings.value = getDefaultSettings();
    } finally {
      isLoading.value = false;
    }
  };

  const syncWithFirebase = async (): Promise<void> => {
    if (!authStore.user || !isOnline.value) return;
    
    try {
      isSyncing.value = true;
      const syncStartTime = Date.now();
      
      // Get Firebase settings
      const firebaseSettings = await userSettingsService.getUserSettings(authStore.user.uid);
      
      // If Firebase is empty but we have local settings, migrate them
      if (!firebaseSettings && currentSettings.value) {
        console.log('Migrating local settings to Firebase...');
        await userSettingsService.saveUserSettings(authStore.user.uid, {
          theme: currentSettings.value.theme,
          language: currentSettings.value.language,
          filters: currentSettings.value.filters,
          sort: currentSettings.value.sort,
          columnVisibility: currentSettings.value.columnVisibility
        });
      } else if (firebaseSettings) {
        // Merge with local settings, preferring newer ones
        const mergedSettings = mergeSettings(currentSettings.value, firebaseSettings);
        
        // Update local settings
        currentSettings.value = mergedSettings;
        saveLocalSettings(mergedSettings);
        
        // Apply theme and language
        applyTheme(mergedSettings.theme);
        i18n.global.locale.value = mergedSettings.language;
      }
      
      // Subscribe to real-time updates
      subscribeToFirebaseUpdates();
      
      lastSyncTime.value = new Date();
      
      const syncDuration = Date.now() - syncStartTime;
      console.log(`User settings sync completed in ${syncDuration}ms`);
    } catch (error) {
      console.error('Firebase settings sync failed:', error);
      // Continue with local settings on sync failure
    } finally {
      isSyncing.value = false;
    }
  };

  const subscribeToFirebaseUpdates = (): void => {
    if (!authStore.user || unsubscribeFromFirestore) return;
    
    unsubscribeFromFirestore = userSettingsService.subscribeToUserSettings(
      authStore.user.uid,
      (firebaseSettings) => {
        if (firebaseSettings) {
          // Update local settings with Firebase changes
          const mergedSettings = mergeSettings(currentSettings.value, firebaseSettings);
          currentSettings.value = mergedSettings;
          saveLocalSettings(mergedSettings);
          
          // Apply theme and language
          applyTheme(mergedSettings.theme);
          i18n.global.locale.value = mergedSettings.language;
        }
      }
    );
  };

  const mergeSettings = (localSettings: UserSettings, firebaseSettings: UserSettings): UserSettings => {
    // Ensure both settings have all required properties
    const defaults = getDefaultSettings();
    
    const safeLocalSettings = {
      ...defaults,
      ...localSettings
    };
    
    const safeFirebaseSettings = {
      ...defaults,
      ...firebaseSettings
    };
    
    // Prefer the newer settings based on updatedAt
    return safeFirebaseSettings.updatedAt > safeLocalSettings.updatedAt ? safeFirebaseSettings : safeLocalSettings;
  };

  const updateSettings = async (updates: Partial<UserSettingsFormData>): Promise<void> => {
    try {
      const newSettings: UserSettings = {
        ...currentSettings.value,
        ...updates,
        updatedAt: new Date()
      };
      
      // Update local settings first
      currentSettings.value = newSettings;
      saveLocalSettings(newSettings);
      
      // Apply theme if changed
      if (updates.theme) {
        applyTheme(updates.theme);
        analyticsService.logThemeChange(updates.theme);
      }
      
      // Apply language if changed
      if (updates.language) {
        i18n.global.locale.value = updates.language;
      }
      
      // Sync with Firebase if authenticated and online
      if (authStore.isAuthenticated && isOnline.value) {
        try {
          await userSettingsService.saveUserSettings(authStore.user!.uid, {
            theme: newSettings.theme,
            language: newSettings.language,
            filters: newSettings.filters,
            sort: newSettings.sort,
            columnVisibility: newSettings.columnVisibility
          });
        } catch (firebaseError) {
          console.error('Firebase settings update failed:', firebaseError);
          // Continue with local settings - sync will handle it later
        }
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  };

  const setTheme = (theme: Theme): void => {
    updateSettings({ theme });
  };

  const toggleTheme = (): void => {
    const newTheme = currentSettings.value.theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const setLanguage = (language: Language): void => {
    updateSettings({ language });
  };

  const toggleLanguage = (): void => {
    const newLanguage = currentSettings.value.language === 'en' ? 'es' : 'en';
    setLanguage(newLanguage);
  };

  const setFilters = (filters: PropertyFilters): void => {
    // Convert undefined values to null for Firestore compatibility
    const cleanFilters: PropertyFilters = {
      search: filters.search ?? null,
      minPrice: filters.minPrice ?? null,
      maxPrice: filters.maxPrice ?? null,
      statuses: filters.statuses ?? null
    };
    
    updateSettings({ filters: cleanFilters });
  };

  const setSort = (sort: PropertySort): void => {
    updateSettings({ sort });
  };

  const setColumnVisibility = (columnVisibility: ColumnVisibilitySettings): void => {
    updateSettings({ columnVisibility });
  };

  const cleanup = (): void => {
    if (unsubscribeFromFirestore) {
      unsubscribeFromFirestore();
      unsubscribeFromFirestore = null;
    }
  };

  return {
    // State
    settings: currentSettings,
    isLoading,
    isSyncing,
    lastSyncTime,
    
    // Computed getters
    theme: () => currentSettings.value.theme,
    language: () => currentSettings.value.language,
    filters: () => currentSettings.value.filters,
    sort: () => currentSettings.value.sort,
    columnVisibility: () => currentSettings.value?.columnVisibility || {
      zone: true,
      price: true,
      status: true,
      actions: true,
      appointment: true,
      realEstate: true,
      requirements: true,
      comments: true,
      links: true
    },
    
    // Actions
    loadSettings,
    syncWithFirebase,
    updateSettings,
    setTheme,
    toggleTheme,
    setLanguage,
    toggleLanguage,
    setFilters,
    setSort,
    setColumnVisibility,
    cleanup
  };
} 