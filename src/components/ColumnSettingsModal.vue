<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useUserSettings } from '@/composables/useUserSettings';
import { useLanguage } from '@/composables/useLanguage';
import type { ColumnVisibilitySettings } from '@/types/user-settings';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface Props {
  open: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const userSettings = useUserSettings();
const { t } = useLanguage();

// Local copy of column visibility settings
const localColumnVisibility = ref<ColumnVisibilitySettings>({ ...userSettings.columnVisibility() });

// Watch for modal open to reset local state
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    // Reset to current settings when modal opens
    localColumnVisibility.value = { ...userSettings.columnVisibility() };
  }
});

// Define column options with labels
const columnOptions = computed(() => [
  {
    key: 'appointment' as const,
    label: t('property.appointment'),
    description: t('columns.appointmentDescription'),
    configurable: true
  },
  {
    key: 'realEstate' as const,
    label: t('property.realEstate'),
    description: t('columns.realEstateDescription'),
    configurable: true
  },
  {
    key: 'requirements' as const,
    label: t('property.requirements'),
    description: t('columns.requirementsDescription'),
    configurable: true
  },
  {
    key: 'comments' as const,
    label: t('property.comments'),
    description: t('columns.commentsDescription'),
    configurable: true
  },
  {
    key: 'links' as const,
    label: t('property.links'),
    description: t('columns.linksDescription'),
    configurable: true
  }
]);

// Always visible columns for reference
const alwaysVisibleColumns = computed(() => [
  {
    key: 'zone' as const,
    label: t('property.zone'),
    description: t('columns.zoneDescription')
  },
  {
    key: 'price' as const,
    label: t('property.price'),
    description: t('columns.priceDescription')
  },
  {
    key: 'status' as const,
    label: t('property.status'),
    description: t('columns.statusDescription')
  },
  {
    key: 'actions' as const,
    label: t('common.actions'),
    description: t('columns.actionsDescription')
  }
]);

function handleColumnToggle(column: keyof ColumnVisibilitySettings, value: boolean) {
  if (column === 'zone' || column === 'price' || column === 'status' || column === 'actions') {
    // These columns cannot be toggled off
    return;
  }
  
  // Create a new object to ensure reactivity works
  const newVisibility = {
    zone: localColumnVisibility.value.zone,
    price: localColumnVisibility.value.price,
    status: localColumnVisibility.value.status,
    actions: localColumnVisibility.value.actions,
    appointment: localColumnVisibility.value.appointment,
    realEstate: localColumnVisibility.value.realEstate,
    requirements: localColumnVisibility.value.requirements,
    comments: localColumnVisibility.value.comments,
    links: localColumnVisibility.value.links
  };
  
  // Update the specific property (only for configurable columns)
  if (column === 'appointment' || column === 'realEstate' || column === 'requirements' || column === 'comments' || column === 'links') {
    (newVisibility as any)[column] = value;
  }
  
  // Assign the new object
  localColumnVisibility.value = newVisibility;
}

function handleSave() {
  userSettings.setColumnVisibility(localColumnVisibility.value);
  emit('update:open', false);
}

function handleCancel() {
  // Reset to original values
  localColumnVisibility.value = { ...userSettings.columnVisibility() };
  emit('update:open', false);
}

function handleReset() {
  localColumnVisibility.value = {
    zone: true,
    price: true,
    status: true,
    actions: true,
    appointment: true,
    realEstate: true,
    requirements: true,
    comments: true,
    links: true
  };
}
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md max-h-[80vh] flex flex-col">
      <!-- Fixed Header -->
      <DialogHeader class="flex-shrink-0">
        <DialogTitle class="text-lg">{{ t('columns.title') }}</DialogTitle>
        <DialogDescription class="text-xs text-muted-foreground">
          {{ t('columns.description') }}
        </DialogDescription>
      </DialogHeader>
      
      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto space-y-4 pr-1">
        <!-- Always Visible Columns -->
        <div class="space-y-2">
          <h4 class="text-sm font-medium text-foreground sticky top-0 bg-background py-1">{{ t('columns.alwaysVisible') }}</h4>
          <div class="bg-muted/30 rounded p-2">
            <p class="text-xs text-muted-foreground leading-relaxed">
              <span 
                v-for="(column, index) in alwaysVisibleColumns" 
                :key="column.key"
                class="font-medium"
              >
                {{ column.label }}<span v-if="index < alwaysVisibleColumns.length - 1">, </span>
              </span>
            </p>
          </div>
        </div>

        <!-- Configurable Columns -->
        <div class="space-y-2">
          <h4 class="text-sm font-medium text-foreground sticky top-0 bg-background py-1">{{ t('columns.configurable') }}</h4>
          <div class="space-y-1">
            <div 
              v-for="column in columnOptions" 
              :key="column.key"
              class="flex items-center justify-between p-2 border border-border rounded hover:bg-muted/30 transition-colors"
            >
              <div class="flex-1 min-w-0">
                <Label 
                  class="text-sm font-medium cursor-pointer block" 
                  :for="`column-${column.key}`"
                >
                  {{ column.label }}
                </Label>
                <p class="text-xs text-muted-foreground truncate" :title="column.description">
                  {{ column.description }}
                </p>
              </div>
              <Switch 
                :id="`column-${column.key}`"
                :checked="localColumnVisibility[column.key]"
                @update:checked="(value) => handleColumnToggle(column.key, value)"
                class="ml-2 flex-shrink-0"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Fixed Footer -->
      <div class="flex-shrink-0 pt-3 border-t border-border">
        <div class="flex justify-between items-center">
          <Button variant="outline" @click="handleReset" size="sm" class="text-xs">
            {{ t('columns.resetToDefault') }}
          </Button>
          
          <div class="flex gap-2">
            <Button variant="outline" @click="handleCancel" size="sm">
              {{ t('common.cancel') }}
            </Button>
            <Button @click="handleSave" size="sm">
              {{ t('common.save') }}
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>