import { ref, onMounted, watch } from 'vue'
import { analyticsService } from '@/services/analytics'

type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'depatrack-theme'

// Global state
const currentTheme = ref<Theme>('light')

function applyTheme(theme: Theme) {
  const root = document.documentElement
  
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

function loadStoredTheme() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  
  if (stored && ['light', 'dark'].includes(stored)) {
    currentTheme.value = stored as Theme
  } else {
    // First time - detect system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      currentTheme.value = 'dark'
    } else {
      currentTheme.value = 'light'
    }
  }
}

function saveTheme(theme: Theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme)
}

export function useTheme() {
  // Check if there was a stored theme before loading
  const hadStoredTheme = localStorage.getItem(THEME_STORAGE_KEY) !== null
  
  // Load stored theme immediately (before mounting)
  loadStoredTheme()

  // Watch for theme changes and apply them
  let isInitialLoad = true
  watch(currentTheme, (newTheme) => {
    applyTheme(newTheme)
    
    // Save to localStorage if:
    // 1. Not initial load (user changed theme), OR
    // 2. Initial load but no theme was stored (save detected system preference)
    if (!isInitialLoad || !hadStoredTheme) {
      saveTheme(newTheme)
    }
  }, { immediate: true })

  onMounted(() => {
    // Mark that initial load is complete
    isInitialLoad = false
  })

  const setTheme = (theme: Theme) => {
    const oldTheme = currentTheme.value;
    currentTheme.value = theme;
    
    // Log analytics event if theme actually changed
    if (oldTheme !== theme && !isInitialLoad) {
      analyticsService.logThemeChange(theme);
    }
  }

  const toggleTheme = () => {
    const newTheme = currentTheme.value === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }

  return {
    theme: currentTheme,
    setTheme,
    toggleTheme
  }
}