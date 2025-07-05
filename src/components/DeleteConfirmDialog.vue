<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type Property } from '@/types/property';
import { useLanguage } from '@/composables/useLanguage';

interface Props {
  open?: boolean;
  property?: Property | null;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  property: null
});

const emit = defineEmits<{
  close: [];
  confirm: [];
  'update:open': [value: boolean];
}>();

const { t } = useLanguage();

function handleClose() {
  emit('update:open', false);
  emit('close');
}

function handleConfirm() {
  emit('confirm');
}
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="sm:max-w-md max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
      <DialogHeader>
        <DialogTitle>{{ t('delete.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('delete.message') }}
        </DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <Button 
          type="button" 
          variant="outline" 
          @click="handleClose"
          class="border-border hover:bg-muted"
        >
          {{ t('common.cancel') }}
        </Button>
        <Button 
          type="button" 
          @click="handleConfirm"
          class="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
        >
          {{ t('delete.confirm') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>