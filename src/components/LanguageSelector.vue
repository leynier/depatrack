<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useLanguage } from '@/composables/useLanguage'
import type { Language } from '@/types/user-settings'
import { LanguageIcon } from '@heroicons/vue/24/outline'

const { availableLocales, currentLocale, setLanguage, t } = useLanguage()

const handleLanguageChange = (locale: string) => {
  setLanguage(locale as Language)
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="outline"
        size="icon"
        :title="t('language.selectLanguage')"
        class="border-border hover:bg-muted"
      >
        <LanguageIcon class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem
        v-for="locale in availableLocales"
        :key="locale.code"
        @click="handleLanguageChange(locale.code)"
        :class="{ 'bg-muted': currentLocale === locale.code }"
      >
        {{ locale.name }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>