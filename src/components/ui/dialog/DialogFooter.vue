<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <div
    :class="
      cn(
        'flex flex-col-reverse gap-y-3 sm:flex-row sm:justify-end sm:gap-x-2 sm:gap-y-0',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
