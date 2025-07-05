import { useUserSettings } from '@/composables/useUserSettings'
import type { Theme } from '@/types/user-settings'
import { computed } from 'vue'

export function useTheme() {
  const userSettings = useUserSettings()
  
  const theme = computed(() => userSettings.theme())
  
  const setTheme = (newTheme: Theme) => {
    userSettings.setTheme(newTheme)
  }

  const toggleTheme = () => {
    userSettings.toggleTheme()
  }

  return {
    theme,
    setTheme,
    toggleTheme
  }
}