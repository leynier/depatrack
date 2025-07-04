<script setup lang="ts">
import { useTheme } from '@/composables/useTheme';
import { Button } from '@/components/ui/button';
import { SunIcon, MoonIcon } from '@heroicons/vue/24/outline';

const { theme, toggleTheme } = useTheme();

const getThemeIcon = () => {
  return theme.value === 'dark' ? SunIcon : MoonIcon;
};

const getThemeTitle = () => {
  return theme.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
};
</script>

<template>
  <header class="bg-background border-b border-border">
    <div class="max-w-7xl mx-auto px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground sans-serif">DepaTrack</h1>
          <p class="mt-1 text-sm text-muted-foreground leading-relaxed hidden md:block">
            Lightweight web app to log and track apartment-rental prospects—everything stored locally in your browser.
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          @click="toggleTheme"
          :title="getThemeTitle()"
          class="border-border hover:bg-muted"
        >
          <component :is="getThemeIcon()" class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </header>
</template>