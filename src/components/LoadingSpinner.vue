<script setup lang="ts">
import { useLanguage } from '@/composables/useLanguage'

interface Props {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  message: '',
  size: 'md'
})

const { t } = useLanguage()

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8', 
  lg: 'h-12 w-12'
}

const displayMessage = props.message || t('common.loading')
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 space-y-4">
    <!-- Spinning icon -->
    <div 
      :class="[
        'animate-spin rounded-full border-2 border-muted border-t-primary',
        sizeClasses[size]
      ]"
    />
    
    <!-- Loading message -->
    <p class="text-muted-foreground text-sm font-medium">
      {{ displayMessage }}
    </p>
  </div>
</template>