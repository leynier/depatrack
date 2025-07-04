<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type Property } from '@/types/property';

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
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete this property? This action cannot be undone.
        </DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <Button 
          type="button" 
          variant="outline" 
          @click="handleClose"
          class="border-border hover:bg-muted"
        >
          Cancel
        </Button>
        <Button 
          type="button" 
          @click="handleConfirm"
          class="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
        >
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>