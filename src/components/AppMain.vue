<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePropertiesStore } from '@/stores/properties';
import { type Property, PROPERTY_STATUS_LABELS } from '@/types/property';
import PropertyTable from '@/components/PropertyTable.vue';
import PropertyForm from '@/components/PropertyForm.vue';
import FilterModal from '@/components/FilterModal.vue';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog.vue';
import NotificationDialog from '@/components/NotificationDialog.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, FunnelIcon, PlusIcon, MagnifyingGlassIcon, XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/vue/24/outline';
import { FunnelIcon as FunnelSolidIcon } from '@heroicons/vue/24/solid';
import { exportToCSV, downloadCSV, parseCSV, generateCSVFilename } from '@/utils/csv';
import { useLanguage } from '@/composables/useLanguage';

const propertiesStore = usePropertiesStore();
const { t } = useLanguage();

const showForm = ref(false);
const showFilters = ref(false);
const showColumnSettings = ref(false);
const showDeleteConfirm = ref(false);
const editingProperty = ref<string | null>(null);
const deletingProperty = ref<Property | null>(null);
const searchQuery = ref('');
const fileInput = ref<HTMLInputElement>();
const isImporting = ref(false);

// Notification dialog state
const showNotification = ref(false);
const notificationTitle = ref('');
const notificationMessage = ref('');
const notificationType = ref<'info' | 'success' | 'error' | 'warning'>('info');
const showNotificationCancel = ref(false);
const notificationCallback = ref<(() => void) | null>(null);

const properties = computed(() => propertiesStore.properties);
const allProperties = computed(() => propertiesStore.allProperties);
const isLoading = computed(() => propertiesStore.isLoading);
const error = computed(() => propertiesStore.error);
const hasActiveFilters = computed(() => propertiesStore.hasActiveFilters);

const emptyStateMessage = computed(() => {
  if (hasActiveFilters.value) {
    return t('app.noPropertiesWithFilters');
  }
  return t('app.noProperties');
});

// Update search on input change
const searchInput = computed({
  get: () => searchQuery.value,
  set: (value: string) => {
    searchQuery.value = value;
    propertiesStore.setFilters({
      ...propertiesStore.filters,
      search: value || undefined
    });
  }
});

function handleAddProperty() {
  editingProperty.value = null;
  showForm.value = true;
}

function handleEditProperty(id: string) {
  editingProperty.value = id;
  showForm.value = true;
}

function handleCloseForm() {
  showForm.value = false;
  editingProperty.value = null;
}

function handleFormSubmit() {
  showForm.value = false;
  editingProperty.value = null;
}

function handleExport() {
  try {
    const properties = propertiesStore.exportProperties();
    const csvContent = exportToCSV(properties);
    const filename = generateCSVFilename();
    downloadCSV(csvContent, filename);
    showNotificationDialog(t('export.title'), t('export.exportSuccess', { count: properties.length }), 'success');
  } catch (error) {
    console.error('Export failed:', error);
    showNotificationDialog(t('export.title'), t('export.exportError'), 'error');
  }
}

function handleImportClick() {
  fileInput.value?.click();
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;
  
  if (!file.name.toLowerCase().endsWith('.csv')) {
    showNotificationDialog(t('import.invalidFileTitle'), t('import.invalidFileMessage'), 'warning');
    return;
  }
  
  try {
    isImporting.value = true;
    
    const text = await file.text();
    const properties = parseCSV(text);
    
    if (properties.length === 0) {
      showNotificationDialog(t('import.noPropertiesFoundTitle'), t('import.noPropertiesFoundMessage'), 'warning');
      return;
    }
    
    const confirmMessage = t('import.confirmMessage', { count: properties.length });
    
    showNotificationDialog(
      t('import.title'),
      confirmMessage,
      'info',
      true,
      () => {
        try {
          propertiesStore.addProperties(properties);
          showNotificationDialog(t('import.title'), t('import.importSuccess', { count: properties.length }), 'success');
        } catch (error) {
          console.error('Import failed:', error);
          showNotificationDialog(t('import.title'), t('import.importError'), 'error');
        }
      }
    );
  } catch (error) {
    console.error('Import failed:', error);
    showNotificationDialog(t('import.title'), t('import.importError'), 'error');
  } finally {
    isImporting.value = false;
    if (target) {
      target.value = '';
    }
  }
}

function handleFiltersOpen() {
  showFilters.value = true;
}

function handleColumnSettingsOpen() {
  showColumnSettings.value = true;
}

function handleDeleteRequest(property: Property) {
  deletingProperty.value = property;
  showDeleteConfirm.value = true;
}

function handleDeleteConfirm() {
  if (deletingProperty.value) {
    propertiesStore.deleteProperty(deletingProperty.value.id);
    deletingProperty.value = null;
    showDeleteConfirm.value = false;
  }
}

function handleDeleteCancel() {
  deletingProperty.value = null;
  showDeleteConfirm.value = false;
}

function removeFilter(type: string, value?: string) {
  const currentFilters = { ...propertiesStore.filters };
  
  if (type === 'search') {
    delete currentFilters.search;
    searchQuery.value = '';
  } else if (type === 'minPrice') {
    delete currentFilters.minPrice;
  } else if (type === 'maxPrice') {
    delete currentFilters.maxPrice;
  } else if (type === 'status' && value) {
    if (currentFilters.statuses) {
      currentFilters.statuses = currentFilters.statuses.filter(s => s !== value);
      if (currentFilters.statuses.length === 0) {
        delete currentFilters.statuses;
      }
    }
  }
  
  propertiesStore.setFilters(currentFilters);
}

function showNotificationDialog(
  title: string, 
  message: string, 
  type: 'info' | 'success' | 'error' | 'warning' = 'info',
  showCancel = false,
  callback?: () => void
) {
  notificationTitle.value = title;
  notificationMessage.value = message;
  notificationType.value = type;
  showNotificationCancel.value = showCancel;
  notificationCallback.value = callback || null;
  showNotification.value = true;
}

function handleNotificationConfirm() {
  if (notificationCallback.value) {
    notificationCallback.value();
  }
}

defineExpose({
  handleAddProperty
});
</script>

<template>
  <main class="max-w-7xl mx-auto px-6 py-4">
    <!-- Toolbar -->
    <div class="mb-2 md:mb-3 flex items-center gap-2">
      <!-- Search Box -->
      <div class="flex-1 relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon class="h-4 w-4 text-muted-foreground" />
        </div>
        <Input
          v-model="searchInput"
          type="text"
          :placeholder="t('filters.searchPlaceholder')"
          class="pl-10 border-border"
        />
      </div>

      <!-- Filters Button -->
      <Button 
        variant="outline" 
        size="icon" 
        @click="handleFiltersOpen"
        :class="[
          'border-border hover:bg-muted',
          hasActiveFilters ? 'bg-primary/10 border-primary/20' : ''
        ]"
        :title="t('filters.title')"
      >
        <FunnelSolidIcon v-if="hasActiveFilters" class="h-4 w-4 text-primary" />
        <FunnelIcon v-else class="h-4 w-4" />
      </Button>

      <!-- Column Settings Button (Desktop only) -->
      <Button 
        variant="outline" 
        size="icon" 
        @click="handleColumnSettingsOpen"
        class="hidden md:flex border-border hover:bg-muted"
        :title="t('columns.configure')"
      >
        <AdjustmentsHorizontalIcon class="h-4 w-4" />
      </Button>

      <!-- Export Button (Desktop only) -->
      <Button 
        variant="outline" 
        size="icon" 
        @click="handleExport"
        class="hidden md:flex border-border hover:bg-muted"
        :title="t('export.title')"
      >
        <ArrowDownTrayIcon class="h-4 w-4" />
      </Button>

      <!-- Import Button (Desktop only) -->
      <Button 
        variant="outline" 
        size="icon" 
        @click="handleImportClick"
        :disabled="isImporting"
        class="hidden md:flex border-border hover:bg-muted"
        :title="t('import.title')"
      >
        <ArrowUpTrayIcon class="h-4 w-4" />
      </Button>

      <!-- Add Button (Desktop only) -->
      <Button 
        @click="handleAddProperty"
        class="hidden md:flex bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg rounded-md"
        :title="t('property.addProperty')"
      >
        <PlusIcon class="h-4 w-4" />
      </Button>
    </div>

    <!-- Filter Badges -->
    <div v-if="hasActiveFilters" class="mb-2 md:mb-3 flex flex-wrap gap-2">
      <!-- Search Badge -->
      <Badge 
        v-if="propertiesStore.filters.search && propertiesStore.filters.search !== null"
        variant="secondary"
        class="gap-1 px-2 py-1"
      >
        {{ t('common.search') }}: "{{ propertiesStore.filters.search }}"
        <button @click="removeFilter('search')" class="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5">
          <XMarkIcon class="h-3 w-3" />
        </button>
      </Badge>

      <!-- Min Price Badge -->
      <Badge 
        v-if="propertiesStore.filters.minPrice !== undefined && propertiesStore.filters.minPrice !== null"
        variant="secondary"
        class="gap-1 px-2 py-1"
      >
        {{ t('filters.minPrice') }}: {{ propertiesStore.filters.minPrice }}
        <button @click="removeFilter('minPrice')" class="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5">
          <XMarkIcon class="h-3 w-3" />
        </button>
      </Badge>

      <!-- Max Price Badge -->
      <Badge 
        v-if="propertiesStore.filters.maxPrice !== undefined && propertiesStore.filters.maxPrice !== null"
        variant="secondary"
        class="gap-1 px-2 py-1"
      >
        {{ t('filters.maxPrice') }}: {{ propertiesStore.filters.maxPrice }}
        <button @click="removeFilter('maxPrice')" class="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5">
          <XMarkIcon class="h-3 w-3" />
        </button>
      </Badge>

      <!-- Status Badges -->
      <Badge 
        v-for="status in (propertiesStore.filters.statuses && propertiesStore.filters.statuses !== null) ? propertiesStore.filters.statuses : []"
        :key="status"
        variant="secondary"
        class="gap-1 px-2 py-1"
      >
        {{ t(`status.${status}`) }}
        <button @click="removeFilter('status', status)" class="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5">
          <XMarkIcon class="h-3 w-3" />
        </button>
      </Badge>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
      <p class="text-destructive">{{ error }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading">
      <LoadingSpinner :message="t('loading.loadingProperties')" />
    </div>

    <!-- Empty State -->
    <div v-else-if="properties.length === 0" class="text-center py-16">
      <div class="text-muted-foreground text-lg">{{ emptyStateMessage }}</div>
    </div>

    <!-- Properties Table -->
    <div v-else>
      <PropertyTable 
        :properties="properties"
        :show-column-settings="showColumnSettings"
        @edit="handleEditProperty"
        @delete="handleDeleteRequest"
        @update:show-column-settings="showColumnSettings = $event"
      />
    </div>

    <!-- Hidden File Input -->
    <input
      ref="fileInput"
      type="file"
      accept=".csv"
      @change="handleFileSelect"
      class="hidden"
    />

    <!-- Modals -->
    <PropertyForm
      :open="showForm"
      :property-id="editingProperty"
      @close="handleCloseForm"
      @submit="handleFormSubmit"
      @update:open="showForm = $event"
    />

    <FilterModal
      :open="showFilters"
      @close="showFilters = false"
      @apply="showFilters = false"
      @update:open="showFilters = $event"
    />

    <DeleteConfirmDialog
      :open="showDeleteConfirm"
      :property="deletingProperty"
      @close="handleDeleteCancel"
      @confirm="handleDeleteConfirm"
      @update:open="showDeleteConfirm = $event"
    />

    <NotificationDialog
      :open="showNotification"
      :title="notificationTitle"
      :message="notificationMessage"
      :type="notificationType"
      :show-cancel="showNotificationCancel"
      @close="showNotification = false"
      @confirm="handleNotificationConfirm"
      @update:open="showNotification = $event"
    />

    <!-- Floating Action Buttons (Mobile Only) -->
    <div class="md:hidden fixed bottom-6 right-6 flex flex-col gap-3">
      <!-- Import Button -->
      <Button 
        variant="outline" 
        size="icon" 
        @click="handleImportClick"
        :disabled="isImporting"
        class="h-14 w-14 rounded-full shadow-lg bg-background border-border hover:bg-muted"
        :title="t('import.title')"
      >
        <ArrowUpTrayIcon class="h-5 w-5" />
      </Button>

      <!-- Export Button -->
      <Button 
        variant="outline" 
        size="icon" 
        @click="handleExport"
        class="h-14 w-14 rounded-full shadow-lg bg-background border-border hover:bg-muted"
        :title="t('export.title')"
      >
        <ArrowDownTrayIcon class="h-5 w-5" />
      </Button>

      <!-- Add Button -->
      <Button 
        @click="handleAddProperty"
        class="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
        :title="t('property.addProperty')"
      >
        <PlusIcon class="h-6 w-6" />
      </Button>
    </div>
  </main>
</template>