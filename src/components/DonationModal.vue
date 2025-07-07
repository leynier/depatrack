<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/composables/useLanguage';

interface Props {
  open?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  open: false
});

const emit = defineEmits<{
  close: [];
  'update:open': [value: boolean];
}>();

const { t } = useLanguage();

function handleClose() {
  emit('update:open', false);
  emit('close');
}

function openBuyMeCoffee() {
  window.open('https://www.buymeacoffee.com/leynier', '_blank');
}
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="sm:max-w-md max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
      <DialogHeader>
        <DialogTitle>
          {{ t('donation.title') }}
        </DialogTitle>
        <DialogDescription>
          {{ t('donation.description') }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="bg-muted/50 rounded-lg p-4">
          <h3 class="font-semibold text-foreground mb-2">{{ t('donation.projectInfo') }}</h3>
          <p class="text-sm text-muted-foreground mb-3">
            {{ t('donation.projectDescription') }}
          </p>
          <p class="text-sm text-muted-foreground">
            {{ t('donation.supportMessage') }}
          </p>
        </div>

        <div class="text-center">
          <p class="text-sm text-muted-foreground mb-4">
            {{ t('donation.thankYou') }}
          </p>
          
          <!-- Buy Me a Coffee Button Container -->
          <div class="flex justify-center">
            <!-- Custom Buy Me a Coffee Button with app styling -->
            <Button
              @click="openBuyMeCoffee"
              class="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-3 rounded-lg flex items-center gap-2 text-sm shadow-md transition-all duration-200 hover:shadow-lg border border-border"
              style="font-family: 'Inter', sans-serif;"
            >
              ☕ {{ t('donation.buyMeACoffee') }}
            </Button>
          </div>
        </div>
      </div>

    </DialogContent>
  </Dialog>
</template>

