<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { usePropertiesStore } from '@/stores/properties';
import { PROPERTY_STATUS_LABELS, type PropertyStatus } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import { useLanguage } from '@/composables/useLanguage';

const propertiesStore = usePropertiesStore();
const { t } = useLanguage();

const search = ref('');
const minPrice = ref<number | null>(null);
const maxPrice = ref<number | null>(null);
const selectedStatuses = ref<PropertyStatus[]>([]);
const showAdvancedFilters = ref(false);

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

const filters = computed(() => propertiesStore.filters);
const hasActiveFilters = computed(() => propertiesStore.hasActiveFilters);

const statusOptions = computed(() => {
  return Object.keys(PROPERTY_STATUS_LABELS).map((key) => ({
    value: key as PropertyStatus,
    label: t(`status.${key}`)
  }));
});

const activeFilterCount = computed(() => {
  let count = 0;
  if (filters.value.search) count++;
  if (filters.value.minPrice !== undefined) count++;
  if (filters.value.maxPrice !== undefined) count++;
  if (filters.value.statuses && filters.value.statuses.length > 0) count++;
  return count;
});

watch([search, minPrice, maxPrice, selectedStatuses], () => {
  applyFilters();
}, { deep: true });

function applyFilters() {
  propertiesStore.setFilters({
    search: search.value || undefined,
    minPrice: minPrice.value || undefined,
    maxPrice: maxPrice.value || undefined,
    statuses: selectedStatuses.value.length > 0 ? selectedStatuses.value : undefined
  });
}

function clearAllFilters() {
  search.value = '';
  minPrice.value = null;
  maxPrice.value = null;
  selectedStatuses.value = [];
  propertiesStore.clearFilters();
}

function clearSearch() {
  search.value = '';
  propertiesStore.clearSearch();
}

function removeStatusFilter(status: PropertyStatus) {
  selectedStatuses.value = selectedStatuses.value.filter(s => s !== status);
}

function removePriceFilter(type: 'min' | 'max') {
  if (type === 'min') {
    minPrice.value = null;
  } else {
    maxPrice.value = null;
  }
}

function toggleAdvancedFilters() {
  showAdvancedFilters.value = !showAdvancedFilters.value;
}
</script>

<template>
  <div class="mb-6">
    <Card>
      <CardContent class="p-4">
        <div class="flex flex-col sm:flex-row sm:items-center gap-4">
          <div class="flex-1">
            <div class="relative">
              <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                v-model="search"
                type="text"
                :placeholder="t('filters.searchPlaceholder')"
                class="pl-10 pr-10"
              />
              <Button
                v-if="search"
                variant="ghost"
                size="sm"
                @click="clearSearch"
                class="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                <XMarkIcon class="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              @click="toggleAdvancedFilters"
              :class="showAdvancedFilters || activeFilterCount > 0 ? 'bg-secondary' : ''"
            >
              <FunnelIcon v-if="!showAdvancedFilters && activeFilterCount === 0" class="h-4 w-4 mr-1" />
              <XMarkIcon v-else class="h-4 w-4 mr-1" />
              <span class="hidden sm:inline">{{ showAdvancedFilters ? t('filters.hideFilters') : t('common.filter') }}</span>
              <span class="sm:hidden">{{ t('common.filter') }}</span>
              <Badge v-if="activeFilterCount > 0" variant="secondary" class="ml-1">
                {{ activeFilterCount }}
              </Badge>
            </Button>

            <Button
              v-if="hasActiveFilters"
              variant="ghost"
              size="sm"
              @click="clearAllFilters"
            >
              {{ t('filters.clearAll') }}
            </Button>
          </div>
        </div>

        <div v-if="showAdvancedFilters" class="mt-4 pt-4">
          <Separator class="mb-4" />
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">{{ t('filters.minPrice') }}</label>
              <Input
                v-model="minPriceInput"
                type="number"
                :placeholder="t('filters.minPrice')"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-2">{{ t('filters.maxPrice') }}</label>
              <Input
                v-model="maxPriceInput"
                type="number"
                :placeholder="t('filters.noLimit')"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-2">{{ t('property.status') }}</label>
              <select
                v-model="selectedStatuses"
                multiple
                class="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
              >
                <option v-for="status in statusOptions" :key="status.value" :value="status.value">
                  {{ status.label }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div v-if="hasActiveFilters" class="mt-4 pt-4">
          <Separator class="mb-4" />
          <div class="flex flex-wrap items-center gap-2">
            <Badge
              v-if="filters.minPrice"
              variant="secondary"
              class="gap-1"
            >
              Min: ${{ filters.minPrice.toLocaleString() }}
              <Button
                variant="ghost"
                size="sm"
                @click="removePriceFilter('min')"
                class="h-4 w-4 p-0 hover:bg-transparent"
              >
                <XMarkIcon class="h-3 w-3" />
              </Button>
            </Badge>

            <Badge
              v-if="filters.maxPrice"
              variant="secondary"
              class="gap-1"
            >
              Max: ${{ filters.maxPrice.toLocaleString() }}
              <Button
                variant="ghost"
                size="sm"
                @click="removePriceFilter('max')"
                class="h-4 w-4 p-0 hover:bg-transparent"
              >
                <XMarkIcon class="h-3 w-3" />
              </Button>
            </Badge>

            <Badge
              v-for="status in (filters.statuses || [])"
              :key="status"
              variant="secondary"
              class="gap-1"
            >
              {{ t(`status.${status}`) }}
              <Button
                variant="ghost"
                size="sm"
                @click="removeStatusFilter(status)"
                class="h-4 w-4 p-0 hover:bg-transparent"
              >
                <XMarkIcon class="h-3 w-3" />
              </Button>
            </Badge>
          </div>
          
          <div class="mt-3 flex items-center justify-between text-sm text-muted-foreground">
            <span>{{ t('filters.showingProperties', { count: propertiesStore.properties.length, total: propertiesStore.allProperties.length }) }}</span>
            <div class="flex gap-2">
              <Button
                v-if="filters.search"
                variant="ghost"
                size="sm"
                @click="clearSearch"
              >
                {{ t('filters.clearSearch') }}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                @click="clearAllFilters"
              >
                {{ t('filters.clearAll') }}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>