<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { usePropertiesStore } from '@/stores/properties';
import { PROPERTY_STATUS_LABELS, type PropertyStatus } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  return Object.entries(PROPERTY_STATUS_LABELS).map(([key, label]) => ({
    value: key as PropertyStatus,
    label
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
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Configure Filters</DialogTitle>
        <DialogDescription>
          Set up filters to narrow down your property search
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6">
        <div>
          <h4 class="text-sm font-medium mb-3">Price Range</h4>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="minPrice">Min Price</Label>
              <Input
                id="minPrice"
                v-model="minPriceInput"
                type="number"
                min="0"
                step="1000"
                placeholder="0"
              />
            </div>
            <div class="space-y-2">
              <Label for="maxPrice">Max Price</Label>
              <Input
                id="maxPrice"
                v-model="maxPriceInput"
                type="number"
                min="0"
                step="1000"
                placeholder="No limit"
              />
            </div>
          </div>
        </div>

        <div>
          <h4 class="text-sm font-medium mb-3">Status</h4>
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
          Cancel
        </Button>
        <Button type="button" @click="handleApply">
          Apply Filters
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>