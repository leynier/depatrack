<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePropertiesStore } from '@/stores/properties';
import { exportToCSV, downloadCSV, parseCSV, generateCSVFilename } from '@/utils/csv';
import { Button } from '@/components/ui/button';
import { ArrowUpTrayIcon, ArrowDownTrayIcon } from '@heroicons/vue/24/outline';

const propertiesStore = usePropertiesStore();
const fileInput = ref<HTMLInputElement>();
const isImporting = ref(false);
const importError = ref<string | null>(null);

const hasActiveFilters = computed(() => propertiesStore.hasActiveFilters);

function handleExport() {
  try {
    const properties = propertiesStore.exportProperties();
    const csvContent = exportToCSV(properties);
    const filename = generateCSVFilename();
    
    downloadCSV(csvContent, filename);
  } catch (error) {
    console.error('Export failed:', error);
    alert('Failed to export properties. Please try again.');
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
    importError.value = 'Please select a CSV file';
    return;
  }
  
  try {
    isImporting.value = true;
    importError.value = null;
    
    const text = await file.text();
    const properties = parseCSV(text);
    
    if (properties.length === 0) {
      importError.value = 'No valid properties found in the CSV file';
      return;
    }
    
    const confirmMessage = `This will import ${properties.length} properties and replace all existing data. Are you sure you want to continue?`;
    
    if (confirm(confirmMessage)) {
      propertiesStore.importProperties(properties);
      alert(`Successfully imported ${properties.length} properties!`);
    }
  } catch (error) {
    console.error('Import failed:', error);
    importError.value = error instanceof Error ? error.message : 'Failed to import CSV file';
  } finally {
    isImporting.value = false;
    if (target) {
      target.value = '';
    }
  }
}

</script>

<template>
  <div class="relative flex items-center space-x-2">
    <Button
      variant="outline"
      size="icon"
      @click="handleExport"
      title="Export to CSV"
    >
      <ArrowDownTrayIcon class="h-4 w-4 md:h-5 md:w-5" />
    </Button>
    
    <Button
      variant="outline"
      size="icon"
      @click="handleImportClick"
      title="Import from CSV"
      :disabled="isImporting"
    >
      <ArrowUpTrayIcon class="h-4 w-4 md:h-5 md:w-5" />
    </Button>

    <input
      ref="fileInput"
      type="file"
      accept=".csv"
      @change="handleFileSelect"
      class="hidden"
    />

    <div
      v-if="importError"
      class="absolute right-0 top-full mt-2 w-64 bg-destructive/10 border border-destructive/20 rounded-md p-3 z-20"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-destructive">Import Error</h3>
          <p class="text-sm text-destructive/80 mt-1">{{ importError }}</p>
          <Button
            variant="ghost"
            size="sm"
            @click="importError = null"
            class="mt-2 p-0 h-auto text-destructive hover:text-destructive/80"
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>