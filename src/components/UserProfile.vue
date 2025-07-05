<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/composables/useLanguage';
import { useNetworkStatus } from '@/composables/useNetworkStatus';
import { useUserSettings } from '@/composables/useUserSettings';
import { useAuthStore } from '@/stores/auth';
import { usePropertiesStore } from '@/stores/properties';
import { ArrowRightOnRectangleIcon, CloudArrowUpIcon, CloudIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline';
import { computed, ref, unref } from 'vue';

const authStore = useAuthStore();
const propertiesStore = usePropertiesStore();
const userSettings = useUserSettings();
const { isOnline } = useNetworkStatus();
const { t } = useLanguage();

const isLoggingOut = ref(false);

const userInitials = computed(() => {
  if (!authStore.user?.email) return '?';
  return authStore.user.email.charAt(0).toUpperCase();
});

const statusIcon = computed(() => {
  if (!isOnline.value) return ExclamationTriangleIcon;
  if (propertiesStore.isSyncing || unref(userSettings.isSyncing)) return CloudArrowUpIcon;
  return CloudIcon;
});

const statusText = computed(() => {
  if (!isOnline.value) return t('auth.offline');
  if (propertiesStore.isSyncing || unref(userSettings.isSyncing)) return t('auth.syncing');
  return t('auth.online');
});

const statusColor = computed(() => {
  if (!isOnline.value) return 'text-red-500';
  if (propertiesStore.isSyncing) return 'text-blue-500';
  return 'text-green-500';
});

const lastSyncText = computed(() => {
  if (!propertiesStore.lastSyncTime) return t('auth.neverSynced');
  const now = new Date();
  const diff = now.getTime() - propertiesStore.lastSyncTime.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return t('auth.justSynced');
  if (minutes < 60) return t('auth.minutesAgo', { minutes });
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('auth.hoursAgo', { hours });
  
  const days = Math.floor(hours / 24);
  return t('auth.daysAgo', { days });
});

const isSyncDisabled = computed(() => {
  return !isOnline.value || propertiesStore.isSyncing || unref(userSettings.isSyncing);
});

async function handleLogout() {
  if (isLoggingOut.value) return;
  
  try {
    isLoggingOut.value = true;
    
    // Clean up Firebase subscriptions
    propertiesStore.cleanup();
    userSettings.cleanup();
    
    // Logout from Firebase
    await authStore.logout();
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    isLoggingOut.value = false;
  }
}

async function handleSync() {
  if (isOnline.value && !propertiesStore.isSyncing && !unref(userSettings.isSyncing)) {
    try {
      // Sync both properties and user settings
      await Promise.all([
        propertiesStore.syncWithFirebase(),
        userSettings.syncWithFirebase()
      ]);
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  }
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="icon" class="relative">
        <div class="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
          {{ userInitials }}
        </div>
        <div v-if="!isOnline" class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-background"></div>
      </Button>
    </DropdownMenuTrigger>
    
    <DropdownMenuContent align="end" class="w-64">
      <div class="px-3 py-2">
        <div class="text-sm font-medium">{{ authStore.user?.email }}</div>
        <div class="flex items-center gap-2 mt-1">
          <component :is="statusIcon" class="h-3 w-3" :class="statusColor" />
          <span class="text-xs text-muted-foreground">{{ statusText }}</span>
        </div>
        <div class="text-xs text-muted-foreground mt-1">
          {{ lastSyncText }}
        </div>
      </div>
      
      <DropdownMenuSeparator />
      
      <DropdownMenuItem @click="handleSync" :disabled="isSyncDisabled">
        <CloudArrowUpIcon class="h-4 w-4 mr-2" />
        {{ t('auth.syncNow') }}
      </DropdownMenuItem>
      
      <DropdownMenuSeparator />
      
      <DropdownMenuItem @click="handleLogout" :disabled="isLoggingOut">
        <ArrowRightOnRectangleIcon class="h-4 w-4 mr-2" />
        {{ isLoggingOut ? t('auth.signingOut') : t('auth.signOut') }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>