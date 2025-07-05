<script setup lang="ts">
import { ref } from 'vue';
import { useTheme } from '@/composables/useTheme';
import { useAuthStore } from '@/stores/auth';
import { useLanguage } from '@/composables/useLanguage';
import { Button } from '@/components/ui/button';
import { SunIcon, MoonIcon, ChartBarIcon, UserIcon } from '@heroicons/vue/24/outline';
import StatsModal from '@/components/StatsModal.vue';
import AuthDialog from '@/components/AuthDialog.vue';
import UserProfile from '@/components/UserProfile.vue';
import LanguageSelector from '@/components/LanguageSelector.vue';

const { theme, toggleTheme } = useTheme();
const authStore = useAuthStore();
const { t } = useLanguage();
const showStatsModal = ref(false);
const showAuthDialog = ref(false);

const getThemeIcon = () => {
  return theme.value === 'dark' ? SunIcon : MoonIcon;
};

const getThemeTitle = () => {
  return theme.value === 'dark' ? t('theme.light') : t('theme.dark');
};

const openGitHub = () => {
  window.open('https://github.com/leynier/depatrack', '_blank');
};

const openStats = () => {
  showStatsModal.value = true;
};

const openAuth = () => {
  showAuthDialog.value = true;
};
</script>

<template>
  <header class="bg-background border-b border-border">
    <div class="max-w-7xl mx-auto px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground sans-serif">{{ t('app.title') }}</h1>
          <p class="mt-1 text-sm text-muted-foreground leading-relaxed hidden md:block">
            {{ t('app.description') }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            @click="openStats"
            :title="t('navigation.statistics')"
            class="border-border hover:bg-muted"
          >
            <ChartBarIcon class="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            @click="openGitHub"
            :title="t('navigation.github')"
            class="border-border hover:bg-muted"
          >
            <!-- GitHub Icon -->
            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
          </Button>
          <Button
            variant="outline"
            size="icon"
            @click="toggleTheme"
            :title="getThemeTitle()"
            class="border-border hover:bg-muted"
          >
            <component :is="getThemeIcon()" class="h-4 w-4" />
          </Button>
          
          <LanguageSelector />

          <!-- Auth Section -->
          <UserProfile v-if="authStore.isAuthenticated" />
          <Button
            v-else
            variant="outline"
            size="icon"
            @click="openAuth"
            :title="t('auth.signIn')"
            class="bg-foreground text-background hover:bg-foreground/90"
          >
            <UserIcon class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  </header>

  <!-- Stats Modal -->
  <StatsModal 
    v-model:open="showStatsModal" 
    @close="showStatsModal = false" 
  />
  
  <!-- Auth Dialog -->
  <AuthDialog 
    v-model:open="showAuthDialog" 
  />
</template>