import { useUserSettings } from '@/composables/useUserSettings'
import type { Language } from '@/types/user-settings'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const availableLocales = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' }
]

export function useLanguage() {
  const { t } = useI18n()
  const userSettings = useUserSettings()
  
  const currentLocale = computed(() => userSettings.language())
  
  const currentLanguage = computed(() => {
    const lang = availableLocales.find(l => l.code === userSettings.language())
    return lang?.name || 'English'
  })
  
  const setLanguage = (newLocale: Language) => {
    userSettings.setLanguage(newLocale)
  }
  
  const toggleLanguage = () => {
    userSettings.toggleLanguage()
  }
  
  return {
    availableLocales,
    currentLocale,
    currentLanguage,
    setLanguage,
    toggleLanguage,
    t
  }
}