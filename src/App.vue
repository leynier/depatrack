<script setup lang="ts">
import { useUserSettings } from '@/composables/useUserSettings';
import { analyticsService } from '@/services/analytics';
import { useAuthStore } from '@/stores/auth';
import { usePropertiesStore } from '@/stores/properties';
import { onMounted } from 'vue';

const propertiesStore = usePropertiesStore();
const authStore = useAuthStore();
const userSettings = useUserSettings();

onMounted(() => {
  // Initialize user settings first (loads theme, language, etc.)
  userSettings.loadSettings();
  
  // Initialize auth, then load properties
  authStore.initializeAuth();
  propertiesStore.loadProperties();
  
  // Log page view
  analyticsService.logPageView('DepaTrack App');
});
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <router-view />
  </div>
</template>