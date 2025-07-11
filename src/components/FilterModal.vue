<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { usePropertiesStore } from '@/stores/properties';
import { PROPERTY_STATUS_LABELS, type PropertyStatus } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/composables/useLanguage';

interface Props {
  open?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  open: false
});

const emit = defineEmits<{
  close: [];
  apply: [];
  'update:open': [value: boolean];
}>();

const propertiesStore = usePropertiesStore();
const { t } = useLanguage();

const minPrice = ref<number | null>(null);
const maxPrice = ref<number | null>(null);
const selectedStatuses = ref<PropertyStatus[]>([]);

const minPriceInput = computed({
  get: () => minPrice.value?.toString() ?? '',
  set: (value: string) => {
    minPrice.value = value ? Number(value) : null;
  }
});

const maxPriceInput = computed({
  get: () => maxPrice.value?.toString() ?? '',
  set: (value: string) => {
    maxPrice.value = value ? Number(value) : null;
  }
});

const statusOptions = computed(() => {
  return Object.keys(PROPERTY_STATUS_LABELS).map((key) => ({
    value: key as PropertyStatus,
    label: t(`status.${key}`)
  }));
});

function loadFilters() {
  const filters = propertiesStore.filters;
  minPrice.value = filters.minPrice || null;
  maxPrice.value = filters.maxPrice || null;
  selectedStatuses.value = filters.statuses ? [...filters.statuses] : [];
}

onMounted(() => {
  loadFilters();
});

watch(() => props.open, (newValue) => {
  if (newValue) {
    loadFilters();
  }
});

function handleClose() {
  emit('update:open', false);
  emit('close');
}

function handleApply() {
  propertiesStore.setFilters({
    ...propertiesStore.filters,
    minPrice: minPrice.value || undefined,
    maxPrice: maxPrice.value || undefined,
    statuses: selectedStatuses.value.length > 0 ? selectedStatuses.value : undefined
  });
  emit('update:open', false);
  emit('apply');
}

function toggleStatus(status: PropertyStatus) {
  const index = selectedStatuses.value.indexOf(status);
  if (index > -1) {
    selectedStatuses.value.splice(index, 1);
  } else {
    selectedStatuses.value.push(status);
  }
}

function isStatusSelected(status: PropertyStatus) {
  return selectedStatuses.value.includes(status);
}
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="sm:max-w-lg max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
      <DialogHeader>
        <DialogTitle>{{ t('filters.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('filters.description') }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6">
        <div>
          <h4 class="text-sm font-medium mb-3">{{ t('filters.priceRange') }}</h4>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="minPrice">{{ t('filters.minPrice') }}</Label>
              <Input
                id="minPrice"
                v-model="minPriceInput"
                type="number"
                min="0"
                step="1000"
                :placeholder="t('filters.minPrice')"
              />
            </div>
            <div class="space-y-2">
              <Label for="maxPrice">{{ t('filters.maxPrice') }}</Label>
              <Input
                id="maxPrice"
                v-model="maxPriceInput"
                type="number"
                min="0"
                step="1000"
                :placeholder="t('filters.noLimit')"
              />
            </div>
          </div>
        </div>

        <div>
          <h4 class="text-sm font-medium mb-3">{{ t('property.status') }}</h4>
          <div class="grid grid-cols-2 gap-2">
            <Badge
              v-for="status in statusOptions"
              :key="status.value"
              :variant="isStatusSelected(status.value) ? 'default' : 'outline'"
              class="justify-center cursor-pointer transition-colors"
              @click="toggleStatus(status.value)"
            >
              {{ status.label }}
            </Badge>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" @click="handleClose">
          {{ t('common.cancel') }}
        </Button>
        <Button type="button" @click="handleApply">
          {{ t('filters.applyFilters') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>