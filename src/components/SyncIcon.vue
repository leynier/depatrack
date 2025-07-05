<script setup lang="ts">
import { computed } from 'vue'
import { usePropertiesStore } from '@/stores/properties'
import { CheckCircleIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

const propertiesStore = usePropertiesStore()

const syncStatus = computed(() => {
  if (propertiesStore.error) return 'error'
  if (propertiesStore.isOperating) return 'operating'
  if (propertiesStore.isSyncing) return 'syncing'
  if (propertiesStore.lastSyncTime) return 'synced'
  return 'idle'
})

const statusIcon = computed(() => {
  switch (syncStatus.value) {
    case 'operating':
    case 'syncing':
      return ArrowPathIcon
    case 'synced':
      return CheckCircleIcon
    case 'error':
      return ExclamationTriangleIcon
    default:
      return null
  }
})

const statusColor = computed(() => {
  switch (syncStatus.value) {
    case 'operating':
      return 'text-orange-500'
    case 'syncing':
      return 'text-blue-500'
    case 'synced':
      return 'text-green-500'
    case 'error':
      return 'text-red-500'
    default:
      return 'text-muted-foreground'
  }
})

const shouldAnimate = computed(() => {
  return syncStatus.value === 'syncing' || syncStatus.value === 'operating'
})
</script>

<template>
  <component
    v-if="statusIcon"
    :is="statusIcon"
    :class="[
      'h-5 w-5 ml-2',
      statusColor,
      { 'animate-spin': shouldAnimate }
    ]"
  />
</template>