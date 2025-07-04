<script setup lang="ts">
import { onMounted } from 'vue';
import { usePropertiesStore } from '@/stores/properties';
import { useTheme } from '@/composables/useTheme';
import AppHeader from '@/components/AppHeader.vue';
import AppMain from '@/components/AppMain.vue';

const propertiesStore = usePropertiesStore();
useTheme(); // Initialize theme system

onMounted(() => {
  propertiesStore.loadProperties();
});
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <AppHeader />
    <AppMain />
  </div>
</template>