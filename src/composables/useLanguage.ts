import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const availableLocales = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' }
]

export function useLanguage() {
  const { locale, t } = useI18n()
  
  const currentLocale = computed(() => locale.value)
  
  const currentLanguage = computed(() => {
    const lang = availableLocales.find(l => l.code === locale.value)
    return lang?.name || 'English'
  })
  
  const setLanguage = (newLocale: string) => {
    locale.value = newLocale
    localStorage.setItem('locale', newLocale)
  }
  
  const toggleLanguage = () => {
    const newLocale = locale.value === 'en' ? 'es' : 'en'
    setLanguage(newLocale)
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