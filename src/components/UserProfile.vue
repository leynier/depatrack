<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { usePropertiesStore } from '@/stores/properties';
import { useNetworkStatus } from '@/composables/useNetworkStatus';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserIcon, ArrowRightOnRectangleIcon, CloudIcon, CloudArrowUpIcon, WifiIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline';

const authStore = useAuthStore();
const propertiesStore = usePropertiesStore();
const { isOnline } = useNetworkStatus();

const isLoggingOut = ref(false);

const userInitials = computed(() => {
  if (!authStore.user?.email) return '?';
  return authStore.user.email.charAt(0).toUpperCase();
});

const statusIcon = computed(() => {
  if (!isOnline.value) return ExclamationTriangleIcon;
  if (propertiesStore.isSyncing) return CloudArrowUpIcon;
  return CloudIcon;
});

const statusText = computed(() => {
  if (!isOnline.value) return 'Offline';
  if (propertiesStore.isSyncing) return 'Syncing...';
  return 'Online';
});

const statusColor = computed(() => {
  if (!isOnline.value) return 'text-red-500';
  if (propertiesStore.isSyncing) return 'text-blue-500';
  return 'text-green-500';
});

const lastSyncText = computed(() => {
  if (!propertiesStore.lastSyncTime) return 'Never synced';
  const now = new Date();
  const diff = now.getTime() - propertiesStore.lastSyncTime.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just synced';
  if (minutes < 60) return `${minutes} min ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
});

async function handleLogout() {
  if (isLoggingOut.value) return;
  
  try {
    isLoggingOut.value = true;
    
    // Clean up Firebase subscription
    propertiesStore.cleanup();
    
    // Logout from Firebase
    await authStore.logout();
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    isLoggingOut.value = false;
  }
}

async function handleSync() {
  if (isOnline.value && !propertiesStore.isSyncing) {
    try {
      await propertiesStore.syncWithFirebase();
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
      
      <DropdownMenuItem @click="handleSync" :disabled="!isOnline || propertiesStore.isSyncing">
        <CloudArrowUpIcon class="h-4 w-4 mr-2" />
        Sync Now
      </DropdownMenuItem>
      
      <DropdownMenuSeparator />
      
      <DropdownMenuItem @click="handleLogout" :disabled="isLoggingOut">
        <ArrowRightOnRectangleIcon class="h-4 w-4 mr-2" />
        {{ isLoggingOut ? 'Signing out...' : 'Sign Out' }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>