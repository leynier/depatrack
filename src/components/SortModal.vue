<script setup lang="ts">
import { computed } from 'vue';
import { usePropertiesStore } from '@/stores/properties';
import { useLanguage } from '@/composables/useLanguage';
import type { SortField, SortDirection } from '@/types/property';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/vue/24/outline';

interface Props {
  open: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const propertiesStore = usePropertiesStore();
const { t } = useLanguage();

const sortOptions: Array<{ field: SortField; label: string }> = [
  { field: 'zone', label: t('property.zone') },
  { field: 'price', label: t('property.price') },
  { field: 'status', label: t('property.status') },
  { field: 'appointmentDate', label: t('property.appointment') }
];

const currentSort = computed(() => propertiesStore.sort);

function handleSortSelect(field: SortField) {
  propertiesStore.setSortField(field);
}

function handleDirectionToggle() {
  const newDirection: SortDirection = currentSort.value.direction === 'asc' ? 'desc' : 'asc';
  propertiesStore.setSortDirection(newDirection);
}

function handleClose() {
  emit('update:open', false);
}
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ t('sort.title') }}</DialogTitle>
      </DialogHeader>
      
      <div class="space-y-4">
        <!-- Sort Field Selection -->
        <div class="space-y-2">
          <h4 class="text-sm font-medium text-foreground">{{ t('sort.sortBy') }}</h4>
          <div class="grid grid-cols-1 gap-2">
            <Button
              v-for="option in sortOptions"
              :key="option.field"
              :variant="currentSort.field === option.field ? 'default' : 'outline'"
              class="justify-start"
              @click="handleSortSelect(option.field)"
            >
              <CheckIcon 
                v-if="currentSort.field === option.field" 
                class="h-4 w-4 mr-2" 
              />
              <span class="ml-6" v-else></span>
              {{ option.label }}
            </Button>
          </div>
        </div>

        <!-- Sort Direction Selection -->
        <div class="space-y-2">
          <h4 class="text-sm font-medium text-foreground">{{ t('sort.direction') }}</h4>
          <div class="flex gap-2">
            <Button
              :variant="currentSort.direction === 'asc' ? 'default' : 'outline'"
              class="flex-1 justify-center"
              @click="propertiesStore.setSortDirection('asc')"
            >
              <ChevronUpIcon class="h-4 w-4 mr-2" />
              {{ t('sort.ascending') }}
            </Button>
            <Button
              :variant="currentSort.direction === 'desc' ? 'default' : 'outline'"
              class="flex-1 justify-center"
              @click="propertiesStore.setSortDirection('desc')"
            >
              <ChevronDownIcon class="h-4 w-4 mr-2" />
              {{ t('sort.descending') }}
            </Button>
          </div>
        </div>

        <!-- Current Sort Display -->
        <div class="pt-4 border-t border-border">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">{{ t('sort.currentSort') }}</span>
            <Badge variant="outline" class="text-xs">
              {{ sortOptions.find(opt => opt.field === currentSort.field)?.label }}
              <component 
                :is="currentSort.direction === 'asc' ? ChevronUpIcon : ChevronDownIcon" 
                class="h-3 w-3 ml-1" 
              />
            </Badge>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2 pt-4">
          <Button variant="outline" class="flex-1" @click="handleClose">
            {{ t('common.close') }}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>