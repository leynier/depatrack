<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
  open?: boolean;
  title?: string;
  message?: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  showCancel?: boolean;
  confirmText?: string;
  cancelText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  title: 'Notification',
  message: '',
  type: 'info',
  showCancel: false,
  confirmText: 'OK',
  cancelText: 'Cancel'
});

const emit = defineEmits<{
  close: [];
  confirm: [];
  cancel: [];
  'update:open': [value: boolean];
}>();

function handleClose() {
  emit('update:open', false);
  emit('close');
}

function handleConfirm() {
  emit('confirm');
  handleClose();
}

function handleCancel() {
  emit('cancel');
  handleClose();
}
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>
          {{ message }}
        </DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <Button 
          v-if="showCancel"
          type="button" 
          variant="outline" 
          @click="handleCancel"
          class="border-border hover:bg-muted"
        >
          {{ cancelText }}
        </Button>
        <Button 
          type="button" 
          @click="handleConfirm"
          :class="[
            type === 'error' ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : 
            type === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
            'bg-primary hover:bg-primary/90 text-primary-foreground'
          ]"
        >
          {{ confirmText }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>